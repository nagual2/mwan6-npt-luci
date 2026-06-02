# luci-app-mwan6-npt

**English** | [Русский](README.ru.md) | [Deutsch](README.de.md)

LuCI web interface for [mwan6-npt](https://github.com/nagual2/mwan6-npt) — NPTv6 prefix translation for multiple IPv6 WAN paths on OpenWrt.

Repository: https://github.com/nagual2/mwan6-npt-luci

## Overview

This package adds a LuCI (JavaScript) admin UI on top of the **mwan6-npt** UCI configuration. Manage the LAN NPT source prefix, add WAN tunnels from `network` interfaces, and view or trigger rule updates without editing `/etc/config/mwan6-npt` manually.

## Features

- **Network → NPTv6 Multi-WAN** — service toggle, LAN prefix (NPT source), WAN table
- **LAN prefix** — detect from `network` via `detect-lan-prefix.sh`
- **WAN interfaces** — dropdown from `network` (excludes `lan` and already configured), optional prefix field before add, `detect-wan-prefix.sh` suggestion
- **Status → NPTv6 Multi-WAN** — live `mwan6-npt status`, update/flush/refresh buttons
- **Save & Apply** runs `/etc/init.d/mwan6-npt reload` after UCI changes
- Prefix validation in the web form; `lan` always `default=1` (LAN source flag hidden in UI)

## Requirements

- OpenWrt 22.03+ with LuCI (js, `luci-base`)
- Installed package **[mwan6-npt](https://github.com/nagual2/mwan6-npt)**

## Install from release

Download assets from [GitHub Releases](https://github.com/nagual2/mwan6-npt-luci/releases).

### OpenWrt 25.12 and newer (`apk`)

Install **mwan6-npt** first, then this LuCI package:

```bash
cd /tmp
wget https://github.com/nagual2/mwan6-npt-luci/releases/download/v1.2.1/luci-app-mwan6-npt-1.2.1-r1.apk
apk add --allow-untrusted ./luci-app-mwan6-npt-*.apk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

This command **pins** the package in `/etc/apk/world` (`luci-app-mwan6-npt><Q1hash…`). Verify with `grep luci-app-mwan6-npt /etc/apk/world` and `apk policy luci-app-mwan6-npt`. Details: [luci-app-mwan3 — Pinning](https://github.com/nagual2/luci-app-mwan3#pinning-the-nagual2-fork-apk).

Optional Russian UI: build with OpenWrt SDK and `CONFIG_LUCI_LANG_ru=y`, or use English menu strings from `po/ru/`.

### OpenWrt 23.x (`opkg` / `.ipk`)

```bash
opkg install /tmp/luci-app-mwan6-npt_1.2.1-1_all.ipk
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

## Related packages

| Package | Repository |
|---------|------------|
| mwan3 (fork) | [nagual2/mwan3](https://github.com/nagual2/mwan3) |
| luci-app-mwan3 | [nagual2/luci-app-mwan3](https://github.com/nagual2/luci-app-mwan3) |
| mwan6-npt | [nagual2/mwan6-npt](https://github.com/nagual2/mwan6-npt) |

## Documentation

Trilingual README files ship in `/usr/share/doc/luci-app-mwan6-npt/` (`README.en.md`, `README.ru.md`, `README.de.md`).

## License

Apache-2.0 (same license as [LuCI](https://github.com/openwrt/luci)). See `LICENSE` and `NOTICE`.
