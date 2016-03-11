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
        bboxHeight = tileBbox[3]-tileBbox[1], // todo: hmm…
        bboxWidth  = tileBbox[2]-tileBbox[0];
    for (var i=0; i<binningFactor; i++) {
        for (var j=0; j<binningFactor; j++) {
            bins.push([
                tileBbox[0] + bboxWidth /binningFactor*j,
                tileBbox[1] + bboxHeight/binningFactor*i,
                tileBbox[0] + bboxWidth /binningFactor*(j+1),
                tileBbox[1] + bboxHeight/binningFactor*(i+1),
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
                binObjects[index].push(feature.properties._osm_way_id); // todo: rels??
            }
        });
    });

    var output = turf.featurecollection(bins.map(turf.bboxPolygon));
    output.features.forEach(function(feature, index) {
        feature.properties.binX = index % binningFactor;
        feature.properties.binY = Math.floor(index / binningFactor);
        feature.properties.count = binCounts[index];
        feature.properties._osm_way_ids = binObjects[index] ? binObjects[index].join(';') : '';
    });
    output.features = output.features.filter(function(feature) {
        return feature.properties.count > 0;
    });
    output.properties = { tileX: tile[0], tileY: tile[1], tileZ: tile[2] };

    writeData(JSON.stringify(output)+'\n');
    done();
};
