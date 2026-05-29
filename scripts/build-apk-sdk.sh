#!/usr/bin/env bash
# Build luci-app-mwan6-npt .apk for OpenWrt 25.12+ using the official SDK.
#
# Usage:
#   ./scripts/build-apk-sdk.sh
#   PROJECT_VERSION=1.0.0 ./scripts/build-apk-sdk.sh
#
# Environment:
#   SDK_URL      - OpenWrt SDK archive URL
#   SDK_DIR      - extracted SDK path (default: build/sdk)
#   MWAN6_NPT    - path to mwan6-npt sources (dependency metadata)
#   OUTPUT_DIR   - copy *.apk here (default: dist)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MWAN6_NPT="${MWAN6_NPT:-$(dirname "$ROOT")/mwan6-npt}"
SDK_URL="${SDK_URL:-https://downloads.openwrt.org/releases/25.12.0/targets/x86/64/openwrt-sdk-25.12.0-x86-64_gcc-14.3.0_musl.Linux-x86_64.tar.zst}"
SDK_DIR="${SDK_DIR:-$ROOT/build/sdk}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT/dist}"
ARCHIVE="$ROOT/build/$(basename "$SDK_URL")"

PROJECT_VERSION="${PROJECT_VERSION:-$(git -C "$ROOT" describe --tags --match 'v*' 2>/dev/null | sed 's/^v//')}"
PROJECT_VERSION="${PROJECT_VERSION:-1.0.0}"
PKG_RELEASE="${PKG_RELEASE:-1}"

log() { printf '[build-apk-sdk] %s\n' "$*"; }

need_cmd() {
	command -v "$1" >/dev/null 2>&1 || {
		echo "Missing command: $1" >&2
		exit 1
	}
}

need_cmd wget
need_cmd tar
need_cmd make
need_cmd sed

[ -d "$MWAN6_NPT" ] || {
	echo "mwan6-npt sources not found at $MWAN6_NPT" >&2
	exit 1
}

if [ ! -f "$SDK_DIR/staging_dir/host/bin/apk" ]; then
	log "Downloading OpenWrt SDK..."
	mkdir -p "$ROOT/build"
	if [ ! -f "$ARCHIVE" ]; then
		wget -O "$ARCHIVE" "$SDK_URL"
	fi
	rm -rf "$SDK_DIR"
	mkdir -p "$SDK_DIR"
	if [[ "$ARCHIVE" == *.tar.zst ]]; then
		tar --zstd -xf "$ARCHIVE" -C "$SDK_DIR" --strip-components=1
	elif [[ "$ARCHIVE" == *.tar.xz ]]; then
		tar -xJf "$ARCHIVE" -C "$SDK_DIR" --strip-components=1
	else
		echo "Unsupported SDK archive: $ARCHIVE" >&2
		exit 1
	fi
fi

log "Preparing package tree in SDK..."
rm -rf "$SDK_DIR/package/custom/luci-app-mwan6-npt" "$SDK_DIR/package/custom/mwan6-npt"
mkdir -p "$SDK_DIR/package/custom"
rsync -a --exclude .git --exclude build --exclude dist "$ROOT/" "$SDK_DIR/package/custom/luci-app-mwan6-npt/"
rsync -a --exclude .git --exclude build --exclude dist "$MWAN6_NPT/" "$SDK_DIR/package/custom/mwan6-npt/"

cd "$SDK_DIR"

sed -i \
	-e 's|git\.openwrt\.org/feed|github.com/openwrt|g' \
	-e 's|git\.openwrt\.org/project|github.com/openwrt|g' \
	-e 's|git\.openwrt\.org/openwrt|github.com/openwrt|g' \
	feeds.conf.default

./scripts/feeds update luci
./scripts/feeds install -p luci luci-base

cat >> .config <<EOF
CONFIG_ALL_NONSHARED=n
CONFIG_ALL_KMODS=n
CONFIG_ALL=n
CONFIG_AUTOREMOVE=n
CONFIG_SIGNED_PACKAGES=n
CONFIG_PACKAGE_luci-base=y
CONFIG_PACKAGE_mwan6-npt=m
CONFIG_PACKAGE_luci-app-mwan6-npt=m
CONFIG_LUCI_LANG_ru=y
EOF

make defconfig

log "Compiling luci-app-mwan6-npt (version ${PROJECT_VERSION}-r${PKG_RELEASE})..."
make "package/luci-app-mwan6-npt/clean" V=s
make "package/luci-app-mwan6-npt/compile" "PKG_VERSION=${PROJECT_VERSION}" "PKG_RELEASE=${PKG_RELEASE}" -j"$(nproc)" V=s \
	|| make "package/luci-app-mwan6-npt/compile" "PKG_VERSION=${PROJECT_VERSION}" "PKG_RELEASE=${PKG_RELEASE}" -j1 V=s

mkdir -p "$OUTPUT_DIR"
find bin/packages -name 'luci-app-mwan6-npt*.apk' -exec cp -a {} "$OUTPUT_DIR/" \;
find bin/packages -name 'luci-i18n-mwan6-npt-ru*.apk' -exec cp -a {} "$OUTPUT_DIR/" \;

if ! ls "$OUTPUT_DIR"/luci-app-mwan6-npt*.apk >/dev/null 2>&1; then
	echo "APK build failed: no output in $OUTPUT_DIR" >&2
	exit 1
fi

log "Built packages:"
ls -la "$OUTPUT_DIR"/*.apk
