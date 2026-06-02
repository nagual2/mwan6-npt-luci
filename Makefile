#
# Copyright (C) 2025 OpenWrt Community
#
# Licensed under the Apache License, Version 2.0 (same as LuCI).

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for mwan6-npt (NPTv6 Multi-WAN)
LUCI_DEPENDS:=+luci-base +mwan6-npt
PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=LICENSE NOTICE
PKG_MAINTAINER:=OpenWrt Community
PKG_VERSION?=1.2.2
PKG_RELEASE?=1

# When this package lives outside the luci feed tree, set LUCI_DIR, e.g.:
#   make package/luci-app-mwan6-npt/compile LUCI_DIR=/path/to/luci
LUCI_DIR ?= $(TOPDIR)/feeds/luci

include $(LUCI_DIR)/luci.mk

# call BuildPackage - OpenWrt buildroot signature
