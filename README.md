# luci-app-mwan6-npt

**English** | [Русский](README.ru.md) | [Deutsch](README.de.md)

LuCI web interface for [mwan6-npt](https://github.com/nagual2/mwan6-npt) — NPTv6 prefix translation for multiple IPv6 WAN paths on OpenWrt.

Repository: https://github.com/nagual2/mwan6-npt-luci

## Overview

This package adds a LuCI (JavaScript) admin UI on top of the **mwan6-npt** UCI configuration. You can manage globals, per-interface NPTv6 prefixes, and view or trigger rule updates without editing `/etc/config/mwan6-npt` manually.

## Features

- **Network → NPTv6 Multi-WAN → Globals** — enable/disable the `mwan6-npt` procd service
- **Network → NPTv6 Multi-WAN → Interfaces** — edit UCI `interface` sections (`enabled`, `wan_prefix`, `default`)
- **Status → NPTv6 Multi-WAN** — live `mwan6-npt status`, buttons for update/flush/refresh
- **Save & Apply** runs `/etc/init.d/mwan6-npt reload` after UCI changes
- Prefix validation in the web form (same pattern as the CLI helper)
- Ensures only one interface is marked as LAN/source (`default=1`)

## Requirements

- OpenWrt 22.03+ with LuCI (js, `luci-base`)
- Installed package **[mwan6-npt](https://github.com/nagual2/mwan6-npt)**

## Install from release

Download assets from [GitHub Releases](https://github.com/nagual2/mwan6-npt-luci/releases).

### OpenWrt 25.12 and newer (`apk`)

Install **mwan6-npt** first, then this LuCI package:

```bash
cd /tmp
wget https://github.com/nagual2/mwan6-npt-luci/releases/download/v1.0.0/luci-app-mwan6-npt-1.0.0-r1.apk
apk add --allow-untrusted ./luci-app-mwan6-npt-*.apk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

Optional Russian UI: build with OpenWrt SDK and `CONFIG_LUCI_LANG_ru=y`, or use English menu strings from `po/ru/`.

### OpenWrt 23.x (`opkg` / `.ipk`)

```bash
opkg install /tmp/luci-app-mwan6-npt_1.0.0-1_all.ipk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### OpenWrt 25.x fallback (tarball from IPK)

On the build host:

```bash
make -f Makefile.build ipk
./scripts/install-tarball.sh 192.168.1.1
```

Open **Network → NPTv6 Multi-WAN** in the admin UI.

## Build standalone packages

```bash
# opkg IPK (all architectures)
make -f Makefile.build ipk PROJECT_VERSION=1.0.0

# apk for OpenWrt 25.12+ (uses OpenWrt apk mkpkg; SDK host tools downloaded once)
chmod +x scripts/build-apk-mkpkg.sh
./scripts/build-apk-mkpkg.sh
ls dist/
```

## Build (OpenWrt SDK / image builder)

1. Add this tree to your build, e.g. symlink into the LuCI feed:

   ```bash
   ln -sf /path/to/mwan6-npt-luci $TOPDIR/feeds/luci/applications/luci-app-mwan6-npt
   ```

2. Ensure the **mwan6-npt** package is available in `package/` or another feed.

3. Select **LuCI → Applications → luci-app-mwan6-npt** in `make menuconfig`, then:

   ```bash
   make package/luci-app-mwan6-npt/compile V=s
   ```

If the LuCI feed is not under `feeds/luci`, pass `LUCI_DIR`:

```bash
make package/luci-app-mwan6-npt/compile LUCI_DIR=/path/to/luci V=s
```

## Manual install (development)

Copy `htdocs/` and `root/` files into the running system (paths match the OpenWrt package layout), then restart `rpcd` and `uhttpd`.

## UCI mapping

The LuCI forms edit the same UCI file as the CLI. See [mwan6-npt documentation](https://github.com/nagual2/mwan6-npt):

- Section `globals` → option `enabled`
- Section `interface '<name>'` → `enabled`, `wan_prefix`, `default`
- Section name must match the Linux interface name (e.g. `lan`, `tb6`)

On first install, `root/etc/uci-defaults/60_luci-mwan6-npt` creates the `globals` section if it is missing.

## License

GPL-2.0
