# luci-app-mwan6-npt

[English](README.md) | [Русский](README.ru.md) | **Deutsch**

LuCI-Weboberfläche für [mwan6-npt](https://github.com/nagual2/mwan6-npt) — NPTv6-Präfixübersetzung für mehrere IPv6-WAN-Pfade auf OpenWrt.

Repository: https://github.com/nagual2/mwan6-npt-luci

## Übersicht

Dieses Paket ergänzt **mwan6-npt** um eine LuCI-Administration (JavaScript). Globale Einstellungen, NPTv6-Präfixe pro Schnittstelle sowie Status und Regelaktualisierung sind ohne manuelles Bearbeiten von `/etc/config/mwan6-npt` möglich.

## Funktionen

- **Netzwerk → NPTv6 Multi-WAN → Globals** — procd-Dienst `mwan6-npt` ein-/ausschalten
- **Netzwerk → NPTv6 Multi-WAN → Interfaces** — UCI-`interface`-Abschnitte (`enabled`, `wan_prefix`, `default`)
- **Status → NPTv6 Multi-WAN** — Live-Ausgabe von `mwan6-npt status`, Schaltflächen Update/Flush/Refresh
- **Speichern & Anwenden** führt nach UCI-Änderungen `/etc/init.d/mwan6-npt reload` aus
- Präfixvalidierung im Formular (gleiches Muster wie in der CLI)
- Stellt sicher, dass nur eine Schnittstelle als LAN/Quelle (`default=1`) markiert ist

## Voraussetzungen

- OpenWrt 22.03+ mit LuCI (js, `luci-base`)
- Installiertes Paket **[mwan6-npt](https://github.com/nagual2/mwan6-npt)**

## Installation aus Release

Dateien: [GitHub Releases](https://github.com/nagual2/mwan6-npt-luci/releases).

### OpenWrt 25.12 und neuer (`apk`)

Zuerst **mwan6-npt** installieren, dann dieses LuCI-Paket:

```bash
cd /tmp
wget https://github.com/nagual2/mwan6-npt-luci/releases/download/v1.0.0/luci-app-mwan6-npt-1.0.0-r1.apk
apk add --allow-untrusted ./luci-app-mwan6-npt-*.apk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

Optional Russisch: Build mit OpenWrt SDK und `CONFIG_LUCI_LANG_ru=y`.

### OpenWrt 23.x (`opkg` / `.ipk`)

```bash
opkg install /tmp/luci-app-mwan6-npt_1.0.0-1_all.ipk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### OpenWrt 25.x Fallback (Tarball aus IPK)

Auf dem Build-Rechner:

```bash
make -f Makefile.build ipk
./scripts/install-tarball.sh 192.168.1.1
```

In der Admin-Oberfläche: **Netzwerk → NPTv6 Multi-WAN**.

## Standalone-Pakete bauen

```bash
make -f Makefile.build ipk PROJECT_VERSION=1.0.0
chmod +x scripts/build-apk-mkpkg.sh
./scripts/build-apk-mkpkg.sh
ls dist/
```

## Build (OpenWrt SDK)

1. Symlink in den LuCI-Feed:

   ```bash
   ln -sf /path/to/mwan6-npt-luci $TOPDIR/feeds/luci/applications/luci-app-mwan6-npt
   ```

2. **mwan6-npt** muss im Build-Baum verfügbar sein.

3. `make menuconfig` → **LuCI → Applications → luci-app-mwan6-npt**, dann:

   ```bash
   make package/luci-app-mwan6-npt/compile V=s
   ```

## Manuelle Installation (Entwicklung)

Inhalt von `htdocs/` und `root/` kopieren, `rpcd` und `uhttpd` neu starten.

## UCI-Zuordnung

Siehe [mwan6-npt-Dokumentation](https://github.com/nagual2/mwan6-npt): `globals.enabled`, Abschnittsname = Schnittstellenname, ein `default=1`.

## Lizenz

GPL-2.0
