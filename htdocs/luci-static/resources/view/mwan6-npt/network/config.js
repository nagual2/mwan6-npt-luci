'use strict';
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

function ensureGlobalsSection() {
	if (!uci.get('mwan6-npt', 'globals'))
		uci.set('mwan6-npt', 'globals', 'globals');
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

function ensureSingleDefault() {
	var sections = uci.sections('mwan6-npt', 'interface'),
	    first;

	sections.forEach(function(s) {
		if (uci.get('mwan6-npt', s['.name'], 'default') != '1')
			return;

		if (!first)
			first = s['.name'];
		else
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

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('mwan6-npt'),
			uci.load('network')
		]).then(function() {
			ensureGlobalsSection();
			return syncGlobalsEnabledFromAutostart();
		}).then(function() {
			return loadRuntimeStatus();
		});
	},

	render: function() {
		var m, s, o;

		m = new form.Map('mwan6-npt', _('NPTv6 Multi-WAN'),
			_('Enable the service, then configure NPTv6 prefixes per interface. '
			  + 'Section names must match OpenWrt interface names (see Network → Interfaces). '
			  + 'Mark exactly one interface as LAN/source prefix. '
			  + 'Disable interfaces that already carry a routed LAN prefix and do not need NPT.'));

		s = m.section(form.NamedSection, 'globals', 'globals', _('Service'));
		s.addremove = false;

		o = s.option(form.DummyValue, '_runtime_status', _('Runtime status'),
			_('Procd service state and whether NPTv6 nftables rules are currently installed.'));
		o.rawhtml = true;
		o.cfgvalue = renderRuntimeStatus;

		o = s.option(form.Flag, 'enabled', _('Enable mwan6-npt service'),
			_('When enabled, procd starts the service on boot and applies rules after reload.'));
		o.default = '0';

		s = m.section(form.GridSection, 'interface', _('NPT interfaces'));
		s.addremove = true;
		s.anonymous = false;
		s.nodescriptions = true;

		s.renderSectionAdd = function(extra_class) {
			var el = form.GridSection.prototype.renderSectionAdd.apply(this, arguments),
			    nameEl = el.querySelector('.cbi-section-create-name');

			ui.addValidator(nameEl, 'uciname', true, function(v) {
				var sections = uci.sections('mwan6-npt', 'interface'),
				    i;

				for (i = 0; i < sections.length; i++) {
					if (sections[i]['.name'] == v)
						return _('This interface name is already used');
				}

				return true;
			}, 'blur', 'keyup');

			return el;
		};

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = '0';
		o.editable = true;
		o.modalonly = false;

		o = s.option(form.Value, 'wan_prefix', _('WAN / LAN prefix'),
			_('IPv6 prefix for this path. On the default (LAN source) interface this is the LAN prefix used for NPTv6 translation.'));
		o.rmempty = false;
		o.validate = validatePrefix;
		o.placeholder = 'fd00:1111:2222:f000::/64';
		o.editable = true;
		o.modalonly = false;

		o = s.option(form.Flag, 'default', _('LAN source (default)'),
			_('Mark exactly one enabled interface as the LAN/source prefix. It is excluded from outbound SNAT rules.'));
		o.default = '0';
		o.editable = true;
		o.modalonly = false;

		map = m;
		return m.render();
	},

	handleSave: function() {
		return map.save().then(function() {
			ensureSingleDefault();
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
