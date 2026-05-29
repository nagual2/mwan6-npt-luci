# luci-app-mwan6-npt

[English](README.md) | **Русский**

Веб-интерфейс LuCI для [mwan6-npt](https://github.com/nagual2/mwan6-npt) — NPTv6 для нескольких IPv6 WAN на OpenWrt.

## Возможности

- **Сеть → NPTv6 Multi-WAN → Общие** — включение procd-сервиса `mwan6-npt`
- **Сеть → NPTv6 Multi-WAN → Интерфейсы** — секции UCI `interface` (`enabled`, `wan_prefix`, `default`)
- **Статус → NPTv6 Multi-WAN** — вывод `mwan6-npt status`, кнопки обновления и сброса правил
- **Сохранить и применить** вызывает `/etc/init.d/mwan6-npt reload`

## Требования

- OpenWrt 22.03+ с LuCI (`luci-base`)
- Установленный пакет **mwan6-npt**

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
/etc/init.d/rpcd restart
/etc/init.d/uhttpd restart
```

В админке: **Сеть → NPTv6 Multi-WAN**.

## Соответствие UCI

См. документацию mwan6-npt: секция `globals.enabled`, для каждого интерфейса имя секции = имя Linux-интерфейса, ровно один `default=1` как источник LAN-префикса.

## Лицензия

GPL-2.0
