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

## Install on a running router

```bash
opkg install luci-app-mwan6-npt_*.ipk
# or on OpenWrt 24+ with apk:
apk add luci-app-mwan6-npt
```

Reload LuCI (or clear rpcd cache):

```bash
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

Open **Network → NPTv6 Multi-WAN** in the admin UI.

## Manual install (development)

Copy `htdocs/` and `root/` files into the running system (paths match the OpenWrt package layout), then restart `rpcd` and `uhttpd` as above.

## UCI mapping

The LuCI forms edit the same UCI file as the CLI. See [mwan6-npt documentation](https://github.com/nagual2/mwan6-npt):

- Section `globals` → option `enabled`
- Section `interface '<name>'` → `enabled`, `wan_prefix`, `default`
- Section name must match the Linux interface name (e.g. `lan`, `tb6`)

On first install, `root/etc/uci-defaults/60_luci-mwan6-npt` creates the `globals` section if it is missing.

## License

GPL-2.0
