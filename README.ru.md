# luci-app-mwan6-npt

[English](README.md) | **Русский** | [Deutsch](README.de.md)

Веб-интерфейс LuCI для [mwan6-npt](https://github.com/nagual2/mwan6-npt) — NPTv6 для нескольких IPv6 WAN на OpenWrt.

Репозиторий: https://github.com/nagual2/mwan6-npt-luci

## Обзор

Пакет добавляет админку LuCI (JavaScript) поверх UCI-конфигурации **mwan6-npt**. Можно управлять общими настройками, префиксами NPTv6 по интерфейсам и просматривать/обновлять правила без ручного редактирования `/etc/config/mwan6-npt`.

## Возможности

- **Сеть → NPTv6 Multi-WAN** — сервис, LAN-префикс, таблица WAN
- **LAN-префикс** — определение из `network` (`detect-lan-prefix.sh`)
- **WAN-интерфейсы** — выпадающий список из `network`, поле префикса перед добавлением, подсказка `detect-wan-prefix.sh`
- **Статус → NPTv6 Multi-WAN** — `mwan6-npt status`, кнопки обновления/сброса
- **Сохранить и применить** — `/etc/init.d/mwan6-npt reload`
- `lan` всегда `default=1`; флаг «Источник LAN» скрыт в UI

## Требования

- OpenWrt 22.03+ с LuCI (`luci-base`)
- Установленный пакет **[mwan6-npt](https://github.com/nagual2/mwan6-npt)**

## Установка из релиза

Файлы: [GitHub Releases](https://github.com/nagual2/mwan6-npt-luci/releases).

### OpenWrt 25.12 и новее (`apk`)

Сначала установите **mwan6-npt**, затем LuCI-пакет:

```bash
cd /tmp
wget https://github.com/nagual2/mwan6-npt-luci/releases/download/v1.2.1/luci-app-mwan6-npt-1.2.1-r1.apk
apk add --allow-untrusted ./luci-app-mwan6-npt-*.apk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

Русский UI: установите пакет **[luci-i18n-mwan6-npt-ru](https://github.com/nagual2/luci-i18n-mwan6-npt-ru)** (отдельный репозиторий) или соберите через OpenWrt SDK с `CONFIG_LUCI_LANG_ru=y`. В standalone `.apk` приложения без i18n-пакета строки меню на английском.

### OpenWrt 23.x (`opkg` / `.ipk`)

```bash
opkg install /tmp/luci-app-mwan6-npt_1.2.1-1_all.ipk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

### OpenWrt 25.x — запасной способ (tarball из IPK)

На машине сборки:

```bash
make -f Makefile.build ipk
./scripts/install-tarball.sh 192.168.1.1
```

В админке: **Сеть → NPTv6 Multi-WAN**.

## Сборка standalone-пакетов

```bash
make -f Makefile.build ipk PROJECT_VERSION=1.0.0
chmod +x scripts/build-apk-mkpkg.sh
./scripts/build-apk-mkpkg.sh
ls dist/
```

## Сборка (OpenWrt SDK)

1. Симлинк в feed LuCI:

   ```bash
   ln -sf /path/to/mwan6-npt-luci $TOPDIR/feeds/luci/applications/luci-app-mwan6-npt
   ```

2. Пакет **mwan6-npt** должен быть в дереве сборки.

3. `make menuconfig` → **LuCI → Applications → luci-app-mwan6-npt**, затем:

   ```bash
   make package/luci-app-mwan6-npt/compile V=s
   ```

## Ручная установка (разработка)

Скопируйте `htdocs/` и `root/` на роутер, перезапустите `rpcd` и `uhttpd`.

## Соответствие UCI

См. [документацию mwan6-npt](https://github.com/nagual2/mwan6-npt): `globals.enabled`, имя секции = имя интерфейса, один `default=1`.

## Документация

Триязычные README: `/usr/share/doc/luci-app-mwan6-npt/` (`README.en.md`, `README.ru.md`, `README.de.md`).

## Лицензия

Apache-2.0 (как у [LuCI](https://github.com/openwrt/luci)). См. `LICENSE` и `NOTICE`.
