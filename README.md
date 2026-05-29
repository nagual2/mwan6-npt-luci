# luci-app-mwan6-npt

**English** | [Русский](README.ru.md)

LuCI web interface for [mwan6-npt](https://github.com/nagual2/mwan6-npt) — NPTv6 prefix translation for multiple IPv6 WAN paths on OpenWrt.

## Features

- **Network → NPTv6 Multi-WAN → Globals** — enable/disable the `mwan6-npt` procd service
- **Network → NPTv6 Multi-WAN → Interfaces** — edit UCI `interface` sections (`enabled`, `wan_prefix`, `default`)
- **Status → NPTv6 Multi-WAN** — live `mwan6-npt status`, buttons for update/flush
- **Save & Apply** runs `/etc/init.d/mwan6-npt reload` after UCI changes

## Requirements

- OpenWrt 22.03+ with LuCI (js, `luci-base`)
- Installed package **mwan6-npt**

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
# or apk on OpenWrt 24+
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

## License

GPL-2.0
