#!/bin/bash
if [ -f node_modules.tar.zst ]; then
  if [ -L node_modules ]; then
    rm -f node_modules
  fi
  if [ ! -f node_modules/express/package.json ]; then
    mkdir -p node_modules
    tar --zstd -xf node_modules.tar.zst -C node_modules 2>/dev/null || true
  fi
fi
exec npm start
