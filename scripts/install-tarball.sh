#!/bin/sh
# Install luci-app-mwan6-npt on OpenWrt 25.x when only a standalone IPK/tarball is available.
# Usage: ./install-tarball.sh <router_host>
#        SSH_KEY=~/.ssh/id_ed25519 ./install-tarball.sh 192.168.1.1

set -e

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${1:?Usage: $0 <router_host>}"
IPK="${PKG_DIR}/dist/luci-app-mwan6-npt_"*"_all.ipk"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/id_ed25519}"
STAGING="/tmp/luci-mwan6-npt-install-$$"

IPK_FILE=$(ls -1 $IPK 2>/dev/null | tail -1)
[ -n "$IPK_FILE" ] || { echo "Build IPK first: make -f Makefile.build ipk"; exit 1; }

mkdir -p "$STAGING"
cd "$STAGING"
ar x "$IPK_FILE"
tar -xzf data.tar.gz
tar czf luci-app-mwan6-npt.tar.gz www usr etc

scp -O -i "$SSH_KEY" luci-app-mwan6-npt.tar.gz "root@${HOST}:/tmp/"
ssh -i "$SSH_KEY" "root@${HOST}" '
    set -e
    cd /
    tar -xzf /tmp/luci-app-mwan6-npt.tar.gz
    [ -x /etc/uci-defaults/60_luci-mwan6-npt ] && /etc/uci-defaults/60_luci-mwan6-npt || true
    rm -f /tmp/luci-indexcache.*
    rm -rf /tmp/luci-modulecache/
    /etc/init.d/rpcd reload
    /etc/init.d/uhttpd restart
    echo "LuCI mwan6-npt installed"
'

rm -rf "$STAGING"
echo "Installed on $HOST"
