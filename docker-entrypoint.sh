#!/bin/sh
# Mochi container entrypoint.
#
# Hosts like Railway and Render mount a fresh volume owned by root, but Mochi runs as the
# unprivileged "node" user. When the container starts as root, hand the data folder to "node",
# then drop privileges and run Mochi as "node". When it already starts as non-root (Kubernetes
# with runAsUser/fsGroup, `docker run --user`), just run it.
set -e
DATA="${DATA_DIR:-/app/data}"
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA"
  if [ "$(stat -c %u "$DATA")" != "$(id -u node)" ]; then
    chown -R node:node "$DATA"
  fi
  chmod 700 "$DATA"
  exec su-exec node "$@"
fi
exec "$@"
