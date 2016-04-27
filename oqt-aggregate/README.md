# oqt-aggregate

Aggregates data from [osm-qa-tiles](http://osmlab.github.io/osm-qa-tiles/) into square bins.

Usage:

Aggregate data to bins:

    node index.js input.mbtiles binningfactor | tippecanoe … # -> binned.mbtiles

Downscale bins one zoom level down:

    node downscale.js <binned.mbtiles> <binningfactor> | tippecanoe … # -> binned.zoom-1.mbtiles
