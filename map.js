'use strict';
var turf = require('turf');

// Filter features touched by list of users defined by users.json
module.exports = function(tileLayers, tile, writeData, done) {
  var layer = tileLayers.osm.osm;
  var users = {};

  layer.features.forEach(function(val) {
    if (val.geometry.type !== "LineString") return;
    if (!val.properties.highway) return;
    var user = val.properties._user;
    if (!users[user])
      users[user] = 0;
    users[user] += turf.lineDistance(val, "kilometers");
  });

  done(null, users);
};
