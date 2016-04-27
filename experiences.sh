#!/bin/bash -ex

# calculate user experience stats
./node_modules/oqt-user-experience/index.js $1 > experiences.json
