#!/bin/sh
set -eu

rm -rf .next
rm -f tsconfig.tsbuildinfo

exec next dev
