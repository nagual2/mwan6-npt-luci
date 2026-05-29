#!/bin/sh
# Sanity check for luci-app-mwan6-npt package layout (no router required).

set -e

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

required="
	Makefile
	README.md
	README.ru.md
	README.de.md
	htdocs/luci-static/resources/view/mwan6-npt/network/config.js
	htdocs/luci-static/resources/view/mwan6-npt/network/globals.js
	htdocs/luci-static/resources/view/mwan6-npt/network/interface.js
	htdocs/luci-static/resources/view/mwan6-npt/status/overview.js
	root/usr/share/luci/menu.d/luci-app-mwan6-npt.json
	root/usr/share/rpcd/acl.d/luci-app-mwan6-npt.json
"

missing=0
for f in $required; do
	if [ ! -e "$ROOT/$f" ]; then
		echo "MISSING: $f"
		missing=1
	fi
done

grep -q 'mwan6-npt' "$ROOT/root/usr/share/luci/menu.d/luci-app-mwan6-npt.json" || {
	echo "menu.d: expected mwan6-npt paths"
	missing=1
}

grep -q 'luci-app-mwan6-npt' "$ROOT/root/usr/share/rpcd/acl.d/luci-app-mwan6-npt.json" || {
	echo "acl: expected luci-app-mwan6-npt"
	missing=1
}

if [ "$missing" -ne 0 ]; then
	exit 1
fi

echo "OK: package structure"
