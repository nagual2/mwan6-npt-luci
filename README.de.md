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

## Build (OpenWrt SDK / Image Builder)

1. Dieses Verzeichnis in den Build einbinden, z. B. Symlink in den LuCI-Feed:

   ```bash
   ln -sf /path/to/mwan6-npt-luci $TOPDIR/feeds/luci/applications/luci-app-mwan6-npt
   ```

2. Sicherstellen, dass **mwan6-npt** in `package/` oder einem anderen Feed verfügbar ist.

3. In `make menuconfig`: **LuCI → Applications → luci-app-mwan6-npt**, dann:

   ```bash
   make package/luci-app-mwan6-npt/compile V=s
   ```

Liegt der LuCI-Feed nicht unter `feeds/luci`, `LUCI_DIR` angeben:

```bash
make package/luci-app-mwan6-npt/compile LUCI_DIR=/path/to/luci V=s
```

## Installation auf einem laufenden Router

```bash
opkg install luci-app-mwan6-npt_*.ipk
# oder unter OpenWrt 24+ mit apk:
apk add luci-app-mwan6-npt
```

LuCI neu laden (bzw. rpcd-Cache leeren):

```bash
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

In der Admin-Oberfläche: **Netzwerk → NPTv6 Multi-WAN**.

## Manuelle Installation (Entwicklung)

Inhalt von `htdocs/` und `root/` auf das laufende System kopieren (Pfade entsprechen dem OpenWrt-Paketlayout), danach `rpcd` und `uhttpd` wie oben neu starten.

## UCI-Zuordnung

Die LuCI-Formulare bearbeiten dieselbe UCI-Datei wie die CLI. Details in der [mwan6-npt-Dokumentation](https://github.com/nagual2/mwan6-npt):

- Abschnitt `globals` → Option `enabled`
- Abschnitt `interface '<name>'` → `enabled`, `wan_prefix`, `default`
- Abschnittsname = Linux-Schnittstellenname (z. B. `lan`, `tb6`)

Bei der Erstinstallation legt `root/etc/uci-defaults/60_luci-mwan6-npt` den Abschnitt `globals` an, falls er fehlt.

## Lizenz

GPL-2.0
