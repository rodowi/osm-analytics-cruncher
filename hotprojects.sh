#!/bin/bash -ex
# usage: ./hotprojects.sh s3://<bucket>/<path>

./hotprojects.js --raw > hotprojects.raw.geojson
./node_modules/mapbox-tile-copy/bin/mapbox-tile-copy.js --minzoom=1 --maxzoom=9 hotprojects.raw.geojson "$1/tiles/{z}/{x}/{y}.pbf"
rm hotprojects.raw.geojson

./hotprojects.js > hotprojects.geojson
gzip -9 hotprojects.geojson
aws s3 cp hotprojects.geojson.gz "$1/hotprojects.geojson" --content-type="application/json" --content-encoding="gzip"
rm hotprojects.geojson.gz
