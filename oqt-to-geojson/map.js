'use strict';
module.exports = function(tileLayers, tile, writeData, done) {
    var layer = tileLayers.osm.osm;
    writeData(JSON.stringify(layer)+'\n');
    done();
};
