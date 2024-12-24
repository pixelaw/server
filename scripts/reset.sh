#!/bin/bash
set -euxo pipefail

rm -f storage/*.sqlite
find storage/tiles/ -type f ! -name '1_100_template.png' -delete
