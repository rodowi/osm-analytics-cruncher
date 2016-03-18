'use strict';
var turf = require('turf');
var lineclip = require('lineclip');
var sphericalmercator = new (require('sphericalmercator'))();
var rbush = require('rbush');

var binningFactor = global.mapOptions.binningFactor; // number of slices in each direction

module.exports = function(tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
    var tileBbox = sphericalmercator.bbox(tile[0],tile[1],tile[2]);

    var bins = [],
        bboxMinXY = sphericalmercator.px([tileBbox[0], tileBbox[1]], tile[2]),
        bboxMaxXY = sphericalmercator.px([tileBbox[2], tileBbox[3]], tile[2]),
        bboxWidth  = bboxMaxXY[0]-bboxMinXY[0],
        bboxHeight = bboxMaxXY[1]-bboxMinXY[1];
    for (var i=0; i<binningFactor; i++) {
        for (var j=0; j<binningFactor; j++) {
            var binMinXY = [
                bboxMinXY[0] + bboxWidth /binningFactor*j,
                bboxMinXY[1] + bboxHeight/binningFactor*i
            ], binMaxXY = [
                bboxMinXY[0] + bboxWidth /binningFactor*(j+1),
                bboxMinXY[1] + bboxHeight/binningFactor*(i+1)
            ];
            var binMinLL = sphericalmercator.ll(binMinXY, tile[2]),
                binMaxLL = sphericalmercator.ll(binMaxXY, tile[2]);
            bins.push([
                binMinLL[0],
                binMinLL[1],
                binMaxLL[0],
                binMaxLL[1],
                i*binningFactor + j
            ]);
        }
    }
    var binCounts = Array(bins.length+1).join(0).split('').map(Number); // initialize with zeros
    var binObjects = Array(bins.length);
    var binTree = rbush();
    binTree.load(bins);

    layer.features.forEach(function(feature) {
        var clipper,
            geometry;
        if (feature.geometry.type === 'LineString') {
            clipper = lineclip.polyline;
            geometry = feature.geometry.coordinates;
        } else if (feature.geometry.type === 'Polygon') {
            clipper = lineclip.polygon;
            geometry = feature.geometry.coordinates[0];
        } else return console.error('unsupported geometry type');

        var featureBbox = turf.extent(feature);
        binTree.search(featureBbox).forEach(function(bin) {
            var index = bin[4];
            if (clipper(geometry, bin).length > 0) { // todo: look at more detail
                binCounts[index]++;
                if (!binObjects[index]) binObjects[index] = [];
                binObjects[index].push({
                    id: feature.properties._osm_way_id, // todo: rels??
                    timestamp: feature.properties._timestamp,
                    experience: feature.properties._userExperience
                });
            }
        });
    });

    var output = turf.featurecollection(bins.map(turf.bboxPolygon));
    output.features.forEach(function(feature, index) {
        feature.properties.binX = index % binningFactor;
        feature.properties.binY = Math.floor(index / binningFactor);
        feature.properties.count = binCounts[index];
        if (!(binCounts[index] > 0)) return;
        feature.properties.avg_timestamp = average(binObjects[index], 'timestamp'); // todo: don't hardcode properties to average?
        feature.properties.avg_experience = average(binObjects[index], 'experience');
        feature.properties.osm_way_ids = binObjects[index].join(';');
    });
    output.features = output.features.filter(function(feature) {
        return feature.properties.count > 0;
    });
    output.properties = { tileX: tile[0], tileY: tile[1], tileZ: tile[2] };

    writeData(JSON.stringify(output)+'\n');
    done();
};

function average(arr, property) {
    return arr.reduce(function(prev, current) {
        return prev + current[property];
    }, 0) / arr.length;
}
