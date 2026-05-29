# luci-app-mwan6-npt

[English](README.md) | **Русский** | [Deutsch](README.de.md)

Веб-интерфейс LuCI для [mwan6-npt](https://github.com/nagual2/mwan6-npt) — NPTv6 для нескольких IPv6 WAN на OpenWrt.

Репозиторий: https://github.com/nagual2/mwan6-npt-luci

## Обзор

Пакет добавляет админку LuCI (JavaScript) поверх UCI-конфигурации **mwan6-npt**. Можно управлять общими настройками, префиксами NPTv6 по интерфейсам и просматривать/обновлять правила без ручного редактирования `/etc/config/mwan6-npt`.

## Возможности

- **Сеть → NPTv6 Multi-WAN → Общие** — включение procd-сервиса `mwan6-npt`
- **Сеть → NPTv6 Multi-WAN → Интерфейсы** — секции UCI `interface` (`enabled`, `wan_prefix`, `default`)
- **Статус → NPTv6 Multi-WAN** — вывод `mwan6-npt status`, кнопки обновления, сброса и refresh
- **Сохранить и применить** вызывает `/etc/init.d/mwan6-npt reload`
- Валидация префикса в форме (тот же формат, что в CLI)
- Автоматически оставляет только один интерфейс с `default=1` (источник LAN)

## Требования

- OpenWrt 22.03+ с LuCI (`luci-base`)
- Установленный пакет **[mwan6-npt](https://github.com/nagual2/mwan6-npt)**

## Установка из релиза

Файлы: [GitHub Releases](https://github.com/nagual2/mwan6-npt-luci/releases).

### OpenWrt 25.12 и новее (`apk`)

Сначала установите **mwan6-npt**, затем LuCI-пакет:

```bash
cd /tmp
wget https://github.com/nagual2/mwan6-npt-luci/releases/download/v1.0.0/luci-app-mwan6-npt-1.0.0-r1.apk
apk add --allow-untrusted ./luci-app-mwan6-npt-*.apk
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

Русский UI (опционально): соберите через OpenWrt SDK с `CONFIG_LUCI_LANG_ru=y`; в standalone `.apk` строки меню на английском.

### OpenWrt 23.x (`opkg` / `.ipk`)

```bash
opkg install /tmp/luci-app-mwan6-npt_1.0.0-1_all.ipk
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

## Лицензия

GPL-2.0
