osm data analyis tool backend
=============================

Backend for an OSM data analysis tool. Uses [osm-qa-tiles](osmlab.github.io/osm-qa-tiles/) as input data.

Usage
-----

    ./run.sh <path-to-osmqatiles.mbtiles> <filter>

A *filter* is defined in the corresponding `<filter>.json` file. See [`building.json`](https://github.com/hotosm/osm-dat-backend/blob/master/buildings.json) for an example.
