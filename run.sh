#!/bin/bash -ex

TIPPECANOE="tippecanoe -b0 -d20 -psfk -fP -t . -l osm"

# make temporary directory for intermediate results
mkdir -p intermediate

# calculate user experience stats
./node_modules/oqt-user-experience/index.js $1 > intermediate/users.json

# apply filter, merge with user experience data
./node_modules/oqt-filter/index.js $1 $2.json | $TIPPECANOE -z 12 -Z 12 -o intermediate/$2.mbtiles

# aggregate to bins
./node_modules/oqt-aggregate/index.js intermediate/$2.mbtiles | $TIPPECANOE -z 12 -Z 12 -o intermediate/$2.z12.mbtiles

# downscale bins to zoom levels 11 to 0
for i in {11..0}; do
    ./node_modules/oqt-aggregate/downscale.js intermediate/$2.z$((i+1)).mbtiles | $TIPPECANOE -z $i -Z $i -o intermediate/$2.z$i.mbtiles
done

# merge mbtiles files of different zooms
mv intermediate/$2.mbtiles $2.mbtiles
for i in {11..0}; do
    echo "merge in zoom $i"
    sqlite3 $2.mbtiles "attach 'intermediate/$2.z$i.mbtiles' as tomerge; BEGIN; insert into tiles select * from tomerge.tiles; COMMIT;"
done

# clean up temporary data
rm intermediate/*
rmdir intermediate
