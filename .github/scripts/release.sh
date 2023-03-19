#!/bin/bash

NEXT_VERSION=$1
CURRENT_VERSION=$(awk -F \" '/"version": ".+"/ { print $4; exit; }' package.json)

sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEXT_VERSION\"/g" package.json

zip -qr /tmp/release.zip dist package.json README.md
