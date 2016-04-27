#!/bin/bash -ex

# calculate user experience stats
./oqt-user-experience/index.js $1 > experiences.json
