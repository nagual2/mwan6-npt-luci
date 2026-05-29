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

## Сборка (OpenWrt SDK)

1. Добавьте каталог в feed LuCI:

   ```bash
   ln -sf /path/to/mwan6-npt-luci $TOPDIR/feeds/luci/applications/luci-app-mwan6-npt
   ```

2. Убедитесь, что пакет **mwan6-npt** доступен в дереве сборки.

3. В `make menuconfig`: **LuCI → Applications → luci-app-mwan6-npt**, затем:

   ```bash
   make package/luci-app-mwan6-npt/compile V=s
   ```

При другом пути к LuCI:

```bash
make package/luci-app-mwan6-npt/compile LUCI_DIR=/path/to/luci V=s
```

## Установка на роутер

```bash
opkg install luci-app-mwan6-npt_*.ipk
# или на OpenWrt 24+ с apk:
apk add luci-app-mwan6-npt
```

Перезапуск LuCI:

```bash
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

В админке: **Сеть → NPTv6 Multi-WAN**.

## Ручная установка (разработка)

Скопируйте содержимое `htdocs/` и `root/` на роутер (пути совпадают с layout пакета OpenWrt), затем перезапустите `rpcd` и `uhttpd`.

## Соответствие UCI

Формы LuCI редактируют тот же UCI, что и CLI. Подробнее — в [документации mwan6-npt](https://github.com/nagual2/mwan6-npt):

- Секция `globals` → опция `enabled`
- Секция `interface '<имя>'` → `enabled`, `wan_prefix`, `default`
- Имя секции = имя Linux-интерфейса (например `lan`, `tb6`)

При первой установке `root/etc/uci-defaults/60_luci-mwan6-npt` создаёт секцию `globals`, если её ещё нет.

## Лицензия

GPL-2.0
