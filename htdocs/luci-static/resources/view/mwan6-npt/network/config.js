'use strict';
'require dom';
'require form';
'require fs';
'require ui';
'require uci';
'require view';

var map;

var serviceStatus = {
	initStatus: '',
	running: false,
	rulesActive: false,
	snatRules: 0
};

var PREFIX_PATTERN = /^[0-9a-fA-F:]+::\/[0-9]+$/;

var SKIP_NETWORK_IFACES = {
	loopback: true,
	globals: true
};

function ensureGlobalsSection() {
	if (!uci.get('mwan6-npt', 'globals'))
		uci.set('mwan6-npt', 'globals', 'globals');
}

function ensureLanSection() {
	if (!uci.get('mwan6-npt', 'lan')) {
		uci.add('mwan6-npt', 'interface', 'lan');
		uci.set('mwan6-npt', 'lan', 'enabled', '1');
		uci.set('mwan6-npt', 'lan', 'default', '1');
	}
}

function syncGlobalsEnabledFromAutostart() {
	return L.resolveDefault(
		fs.exec('/usr/share/luci/mwan6-npt/sync-autostart.sh', []),
		null
	).then(function() {
		uci.unload('mwan6-npt');
		return uci.load('mwan6-npt');
	});
}

function parseRulesStatus(text) {
	var snatRules = 0;

	if (!text)
		return snatRules;

	text.split('\n').forEach(function(line) {
		if (/^\t\t.*oifname.*snat/.test(line))
			snatRules++;
	});

	return snatRules;
}

function loadRuntimeStatus() {
	return Promise.all([
		fs.exec('/etc/init.d/mwan6-npt', ['status']),
		fs.exec('/usr/sbin/mwan6-npt', ['status'])
	]).then(function(res) {
		var statusText = res[1].stdout || res[1].stderr || '';
		var initStatus = (res[0].stdout || res[0].stderr || '').trim();

		serviceStatus.initStatus = initStatus || _('unknown');
		serviceStatus.running = (initStatus === 'running');
		serviceStatus.snatRules = parseRulesStatus(statusText);
		serviceStatus.rulesActive = serviceStatus.snatRules > 0;
	});
}

function renderRuntimeStatus() {
	var serviceLabel, rulesLabel, initStatus = serviceStatus.initStatus;

	if (serviceStatus.running)
		serviceLabel = '<span class="label success">%s: %h</span>'.format(_('Service'), initStatus);
	else if (serviceStatus.rulesActive && /not running|active with no instances/i.test(initStatus))
		serviceLabel = '<span class="label notice">%s: %h</span>'.format(_('Service'), _('idle (rules applied)'));
	else if (/inactive|not running/i.test(initStatus))
		serviceLabel = '<span class="label">%s: %h</span>'.format(_('Service'), initStatus);
	else
		serviceLabel = '<span class="label notice">%s: %h</span>'.format(_('Service'), initStatus);

	if (serviceStatus.rulesActive)
		rulesLabel = '<span class="label success">%s</span>'.format(
			_('Rules: active (%d SNAT)').format(serviceStatus.snatRules));
	else
		rulesLabel = '<span class="label warning">%s</span>'.format(_('Rules: none'));

	return '%s %s'.format(serviceLabel, rulesLabel);
}

function getNetworkInterfaceNames() {
	return uci.sections('network', 'interface')
		.map(function(s) { return s['.name']; })
		.filter(function(name) {
			return name && !SKIP_NETWORK_IFACES[name];
		})
		.sort();
}

function getConfiguredMwanInterfaces() {
	return uci.sections('mwan6-npt', 'interface')
		.map(function(s) { return s['.name']; });
}

function getAvailableWanInterfaceNames() {
	var used = getConfiguredMwanInterfaces();
	return getNetworkInterfaceNames().filter(function(name) {
		return name !== 'lan' && used.indexOf(name) < 0;
	});
}

function normalizeMwanSections() {
	ensureLanSection();
	uci.set('mwan6-npt', 'lan', 'enabled', '1');
	uci.set('mwan6-npt', 'lan', 'default', '1');

	uci.sections('mwan6-npt', 'interface').forEach(function(s) {
		if (s['.name'] === 'lan')
			return;
		uci.set('mwan6-npt', s['.name'], 'default', '0');
	});
}

function validatePrefix(section_id, value) {
	if (!value)
		return _('IPv6 prefix is required');

	if (!PREFIX_PATTERN.test(value))
		return _('Invalid prefix (example: 2001:db8::/56 or fd00:1111::/64)');

	return true;
}

function detectLanPrefix() {
	return fs.exec('/usr/share/mwan6-npt/detect-lan-prefix.sh', []).then(function(res) {
		var prefix = (res.stdout || '').trim();
		if (!prefix)
			throw new Error(_('Could not detect LAN prefix from network configuration'));
		return prefix;
	});
}

function detectWanPrefix(iface) {
	return fs.exec('/usr/share/mwan6-npt/detect-wan-prefix.sh', [ iface ]).then(function(res) {
		return (res.stdout || '').trim();
	});
}

function makeDetectLanButton(mapRef) {
	return E('button', {
		'class': 'cbi-button cbi-button-apply',
		'click': ui.createHandlerFn(null, function() {
			return detectLanPrefix().then(function(prefix) {
				var field = mapRef.lookupOption('wan_prefix', 'lan')[0];
				field.getUIElement('lan').setValue(prefix);
				ui.addNotification(null, E('p', _('Detected LAN prefix: %h').format(prefix)), 'info');
			}).catch(function(err) {
				ui.addNotification(null, E('p', '%h'.format(err.message || err)), 'danger');
			});
		})
	}, _('Detect from network'));
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('mwan6-npt'),
			uci.load('network')
		]).then(function() {
			ensureGlobalsSection();
			ensureLanSection();
			normalizeMwanSections();
			return syncGlobalsEnabledFromAutostart();
		}).then(function() {
			return loadRuntimeStatus();
		});
	},

	render: function() {
		var m, s, o;

		m = new form.Map('mwan6-npt', _('NPTv6 Multi-WAN'),
			_('Configure NPTv6 prefix translation. The LAN prefix is the single source prefix for clients; '
			  + 'WAN entries only define outbound translation targets and are not written to network/ip6prefix. '
			  + 'Enable the service after adding WAN tunnels.'));

		s = m.section(form.NamedSection, 'globals', 'globals', _('Service'));
		s.addremove = false;

		o = s.option(form.DummyValue, '_runtime_status', _('Runtime status'),
			_('Procd service state and whether NPTv6 nftables rules are currently installed.'));
		o.rawhtml = true;
		o.cfgvalue = renderRuntimeStatus;

		o = s.option(form.Flag, 'enabled', _('Enable mwan6-npt service'),
			_('When enabled, procd starts the service on boot and applies rules after reload.'));
		o.default = '0';

		s = m.section(form.NamedSection, 'lan', 'interface', _('LAN prefix (NPT source)'),
			_('Prefix used for NPTv6 translation only. Configure PD/RA for clients in Network → Interfaces (single ip6prefix in the system).'));

		o = s.option(form.Value, 'wan_prefix', _('LAN prefix'),
			_('IPv6 prefix of LAN clients (NPT source). Must match the delegated prefix on the LAN.'));
		o.rmempty = false;
		o.validate = validatePrefix;
		o.placeholder = '2001:db8::/56';

		o = s.option(form.DummyValue, '_detect_lan', null);
		o.rawhtml = true;
		o.optional = true;
		o.cfgvalue = function() {
			return makeDetectLanButton(m);
		};

		s = m.section(form.GridSection, 'interface', _('WAN interfaces (NPT targets)'),
			_('Add tunnels from Network → Interfaces. Prefixes here are used for NPT only and are not written to network configuration.'));
		s.addremove = true;
		s.anonymous = false;
		s.nodescriptions = true;
		s.max_cols = 1;

		s.cfgsections = function() {
			return uci.sections('mwan6-npt', 'interface')
				.filter(function(sec) { return sec['.name'] !== 'lan'; })
				.map(function(sec) { return sec['.name']; });
		};

		s.renderSectionPlaceholder = function() {
			return E('em', {}, _('No WAN interfaces configured. Add a tunnel below.'));
		};

		s.handleRemove = function(section_id, ev) {
			if (section_id === 'lan')
				return;
			return form.GridSection.prototype.handleRemove.apply(this, arguments);
		};

		s.renderSectionAdd = function(extra_class) {
			var available = getAvailableWanInterfaceNames(),
			    createEl = E('div', { 'class': 'cbi-section-create' }),
			    selectEl, prefixEl, addBtn,
			    mapRef = m;

			if (extra_class != null)
				createEl.classList.add(extra_class);

			if (!available.length) {
				createEl.appendChild(E('em', {}, _('No available network interfaces to add.')));
				return createEl;
			}

			selectEl = E('select', {
				'class': 'cbi-section-create-name',
				'style': 'width:auto; min-width:12em'
			}, available.map(function(name) {
				return E('option', { 'value': name }, name);
			}));

			prefixEl = E('input', {
				'type': 'text',
				'class': 'cbi-input-text',
				'placeholder': '2001:db8:1::/56',
				'style': 'width:auto; min-width:16em'
			});

			selectEl.addEventListener('change', function() {
				return detectWanPrefix(selectEl.value).then(function(prefix) {
					if (prefix)
						prefixEl.value = prefix;
				}).catch(function() {});
			});

			/* Suggest prefix for the initially selected interface */
			detectWanPrefix(selectEl.value).then(function(prefix) {
				if (prefix)
					prefixEl.value = prefix;
			}).catch(function() {});

			addBtn = E('button', {
				'class': 'cbi-button cbi-button-add',
				'click': ui.createHandlerFn(this, function() {
					var name = selectEl.value,
					    prefix = (prefixEl.value || '').trim(),
					    section_id,
					    validation;

					if (!name)
						return;

					if (prefix) {
						validation = validatePrefix(null, prefix);
						if (validation !== true) {
							ui.addNotification(null, E('p', '%h'.format(validation)), 'danger');
							return;
						}
					}

					section_id = uci.add('mwan6-npt', 'interface', name);
					uci.set('mwan6-npt', section_id, 'enabled', '1');
					uci.set('mwan6-npt', section_id, 'default', '0');

					if (prefix) {
						uci.set('mwan6-npt', section_id, 'wan_prefix', prefix);
						return mapRef.save().then(function() {
							ui.changes.apply(true);
						});
					}

					return detectWanPrefix(name).then(function(detected) {
						if (detected)
							uci.set('mwan6-npt', section_id, 'wan_prefix', detected);
						return mapRef.save().then(function() {
							ui.changes.apply(true);
						});
					}).catch(function() {
						return mapRef.save().then(function() {
							ui.changes.apply(true);
						});
					});
				})
			}, _('Add WAN interface'));

			dom.append(createEl, [
				E('label', {}, _('Interface')),
				E('div', {}, selectEl),
				E('label', {}, _('WAN NPT prefix')),
				E('div', {}, prefixEl),
				addBtn
			]);

			return createEl;
		};

		o = s.option(form.Value, 'wan_prefix', _('WAN NPT prefix'),
			_('Target prefix for NPTv6 on this tunnel. Used for translation only — not written to network configuration.'));
		o.rmempty = false;
		o.validate = validatePrefix;
		o.placeholder = '2001:db8:1::/56';
		o.editable = true;
		o.modalonly = false;

		o = s.option(form.Flag, 'enabled', _('Enabled'),
			_('Include this interface in NPTv6 rule generation.'));
		o.default = '1';
		o.modalonly = true;

		o = s.option(form.DummyValue, '_detect_wan', null);
		o.rawhtml = true;
		o.optional = true;
		o.modalonly = true;
		o.cfgvalue = function(section_id) {
			return E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': ui.createHandlerFn(null, function() {
					var field = map.lookupOption('wan_prefix', section_id)[0];
					return detectWanPrefix(section_id).then(function(prefix) {
						if (!prefix)
							throw new Error(_('No global IPv6 address found on this interface'));
						field.getUIElement(section_id).setValue(prefix);
					}).catch(function(err) {
						ui.addNotification(null, E('p', '%h'.format(err.message || err)), 'danger');
					});
				})
			}, _('Suggest from interface'));
		};

		map = m;
		return m.render();
	},

	handleSave: function() {
		return map.save().then(function() {
			normalizeMwanSections();
			return uci.save();
		});
	},

	handleSaveApply: function(ev, mode) {
		var enabled = uci.get('mwan6-npt', 'globals', 'enabled');

		return this.handleSave().then(function() {
			return fs.exec('/etc/init.d/mwan6-npt', ['reload']);
		}).then(function() {
			if (enabled === '1')
				return fs.exec('/etc/init.d/mwan6-npt', ['start']);

			return fs.exec('/etc/init.d/mwan6-npt', ['stop']);
		}).then(function() {
			return loadRuntimeStatus();
		}).then(function() {
			ui.addNotification(null, E('p', _('NPTv6 rules reloaded.')), 'info');
			return ui.changes.apply(mode == '0');
		}).catch(function(err) {
			ui.addNotification(null, E('p', '%s'.format(err.message || err)), 'danger');
		});
	}
});
