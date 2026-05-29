#!/usr/bin/env bash
# Build OpenWrt 25.12+ .apk using apk mkpkg (no full SDK compile).
# Requires OpenWrt SDK host tools (staging_dir/host/bin/apk) or APK_TOOL in PATH.
#
# Usage:
#   ./scripts/build-apk-mkpkg.sh
#   PROJECT_VERSION=1.0.0 APK_TOOL=/path/to/apk ./scripts/build-apk-mkpkg.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT/dist}"
SDK_DIR="${SDK_DIR:-$ROOT/build/sdk}"
APK_TOOL="${APK_TOOL:-$SDK_DIR/staging_dir/host/bin/apk}"

PROJECT_VERSION="${PROJECT_VERSION:-$(git -C "$ROOT" describe --tags --match 'v*' 2>/dev/null | sed 's/^v//')}"
PROJECT_VERSION="${PROJECT_VERSION:-1.2.1}"
PKG_RELEASE="${PKG_RELEASE:-1}"
PKG_VERSION="${PROJECT_VERSION}-r${PKG_RELEASE}"

log() { printf '[build-apk-mkpkg] %s\n' "$*"; }

ensure_apk_tool() {
	if [ -x "$APK_TOOL" ]; then
		return 0
	fi

	local archive url
	url="${SDK_URL:-https://downloads.openwrt.org/releases/25.12.0/targets/x86/64/openwrt-sdk-25.12.0-x86-64_gcc-14.3.0_musl.Linux-x86_64.tar.zst}"
	archive="$ROOT/build/$(basename "$url")"

	log "Extracting apk host tool from OpenWrt SDK..."
	mkdir -p "$ROOT/build"
	[ -f "$archive" ] || wget -O "$archive" "$url"
	rm -rf "$SDK_DIR"
	mkdir -p "$SDK_DIR"
	tar --zstd -xf "$archive" -C "$SDK_DIR" --strip-components=1
	APK_TOOL="$SDK_DIR/staging_dir/host/bin/apk"
	[ -x "$APK_TOOL" ] || {
		echo "apk tool not found after SDK extract: $APK_TOOL" >&2
		exit 1
	}
}

ensure_apk_tool

STAGE="$(mktemp -d)"
POSTINST="$(mktemp)"
trap 'rm -rf "$STAGE" "$POSTINST"' EXIT

log "Staging files in $STAGE"
install -d "$STAGE/www/luci-static/resources/view/mwan6-npt/network"
install -d "$STAGE/www/luci-static/resources/view/mwan6-npt/status"
install -d "$STAGE/usr/share/luci/menu.d"
install -d "$STAGE/usr/share/rpcd/acl.d"
install -d "$STAGE/etc/uci-defaults"
install -d "$STAGE/usr/share/luci/mwan6-npt"

install -m 0644 "$ROOT/htdocs/luci-static/resources/view/mwan6-npt/network/"*.js \
	"$STAGE/www/luci-static/resources/view/mwan6-npt/network/"
install -m 0644 "$ROOT/htdocs/luci-static/resources/view/mwan6-npt/status/"*.js \
	"$STAGE/www/luci-static/resources/view/mwan6-npt/status/"
install -m 0644 "$ROOT/root/usr/share/luci/menu.d/luci-app-mwan6-npt.json" \
	"$STAGE/usr/share/luci/menu.d/"
install -m 0644 "$ROOT/root/usr/share/rpcd/acl.d/luci-app-mwan6-npt.json" \
	"$STAGE/usr/share/rpcd/acl.d/"
install -m 0755 "$ROOT/root/etc/uci-defaults/60_luci-mwan6-npt" \
	"$STAGE/etc/uci-defaults/"
install -m 0755 "$ROOT/root/etc/uci-defaults/61_luci-mwan6-npt-autostart-sync" \
	"$STAGE/etc/uci-defaults/"
install -m 0755 "$ROOT/root/usr/share/luci/mwan6-npt/sync-autostart.sh" \
	"$STAGE/usr/share/luci/mwan6-npt/"

chmod +x "$ROOT/scripts/stage-docs.sh"
"$ROOT/scripts/stage-docs.sh" "$STAGE" luci-app-mwan6-npt

POSTINST="$(mktemp)"
trap 'rm -rf "$STAGE" "$POSTINST"' EXIT

cat >"$POSTINST" <<'EOF'
#!/bin/sh
[ -n "${IPKG_INSTROOT}" ] && exit 0
[ -x /etc/uci-defaults/60_luci-mwan6-npt ] && /etc/uci-defaults/60_luci-mwan6-npt
[ -x /etc/uci-defaults/61_luci-mwan6-npt-autostart-sync ] && /etc/uci-defaults/61_luci-mwan6-npt-autostart-sync
rm -f /tmp/luci-indexcache.*
rm -rf /tmp/luci-modulecache/
/etc/init.d/rpcd reload 2>/dev/null
exit 0
EOF
chmod 0755 "$POSTINST"

mkdir -p "$OUTPUT_DIR"
OUT_APK="$OUTPUT_DIR/luci-app-mwan6-npt-${PKG_VERSION}.apk"

log "Creating $OUT_APK"
"$APK_TOOL" mkpkg \
	--compat 3.0.0_pre1 \
	--files "$STAGE" \
	--info "name:luci-app-mwan6-npt" \
	--info "version:${PKG_VERSION}" \
	--info "arch:noarch" \
	--info "license:Apache-2.0" \
	--info "maintainer:OpenWrt Community" \
	--info "depends:luci-base mwan6-npt" \
	--info "description:LuCI web interface for mwan6-npt NPTv6 Multi-WAN" \
	--script "post-install:$POSTINST" \
	--output "$OUT_APK"

log "Built: $OUT_APK ($(wc -c <"$OUT_APK") bytes)"
