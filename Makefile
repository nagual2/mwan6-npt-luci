#
# Copyright (C) 2025 OpenWrt Community
#
# This is free software, licensed under the GNU General Public License v2.

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for mwan6-npt (NPTv6 Multi-WAN)
LUCI_DEPENDS:=+luci-base +mwan6-npt
PKG_LICENSE:=GPL-2.0
PKG_MAINTAINER:=OpenWrt Community

# When this package lives outside the luci feed tree, set LUCI_DIR, e.g.:
#   make package/luci-app-mwan6-npt/compile LUCI_DIR=/path/to/luci
LUCI_DIR ?= $(TOPDIR)/feeds/luci

include $(LUCI_DIR)/luci.mk

# call BuildPackage - OpenWrt buildroot signature
