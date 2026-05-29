#!/bin/sh
# Align globals.enabled with rc.d autostart (one-time per router).

[ -f /etc/config/mwan6-npt ] || exit 0

uci -q get mwan6-npt.globals.luci_autostart_sync >/dev/null && exit 0

uci -q get mwan6-npt.globals >/dev/null || {
	uci set mwan6-npt.globals='globals'
	uci set mwan6-npt.globals.enabled='0'
}

if [ -L /etc/rc.d/S99mwan6-npt ]; then
	enabled="$(uci -q get mwan6-npt.globals.enabled)"
	[ "$enabled" = "0" ] && uci set mwan6-npt.globals.enabled='1'
fi

uci set mwan6-npt.globals.luci_autostart_sync='1'
uci commit mwan6-npt

if [ "$(uci -q get mwan6-npt.globals.enabled)" = "1" ]; then
	/etc/init.d/mwan6-npt start >/dev/null 2>&1
fi

exit 0
