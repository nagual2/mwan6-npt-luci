'use strict';
'require form';
'require fs';
'require ui';
'require uci';
'require view';

var map;

var PREFIX_PATTERN = /^[0-9a-fA-F:]+::\/[0-9]+$/;

function validatePrefix(section_id, value) {
	if (!value)
		return _('IPv6 prefix is required');

	if (!PREFIX_PATTERN.test(value))
		return _('Invalid prefix (example: 2001:db8::/56 or fd00:1111::/64)');

	return true;
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

return view.extend({
	load: function() {
		return uci.load('network');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('mwan6-npt', _('NPTv6 Multi-WAN — Interfaces'),
			_('Each section name must match the OpenWrt interface/device name (e.g. lan, tb6). '
			  + 'Exactly one interface should be marked as LAN/source prefix (Default). '
			  + 'Other enabled interfaces receive SNAT/DNAT prefix rules when the link is up.'));

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

		o = s.option(form.Value, 'wan_prefix', _('WAN / LAN prefix'),
			_('IPv6 prefix for this path. On the default (LAN source) interface this is the LAN prefix used for NPTv6 translation.'));
		o.rmempty = false;
		o.validate = validatePrefix;
		o.placeholder = 'fd00:1111:2222:f000::/64';

		o = s.option(form.Flag, 'default', _('LAN source (default)'),
			_('Mark exactly one enabled interface as the LAN/source prefix. It is excluded from outbound SNAT rules.'));
		o.default = '0';

		o = s.option(form.DummyValue, '_hint', _('Note'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			return '<span class="hint">%s</span>'.format(
				_('Disable an interface here if it already carries a routed LAN prefix and does not need NPT.')
			);
		};

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
		return this.handleSave().then(function() {
			return fs.exec('/etc/init.d/mwan6-npt', ['reload']);
		}).then(function() {
			ui.addNotification(null, E('p', _('NPTv6 rules reloaded.')), 'info');
			return ui.changes.apply(mode == '0');
		}).catch(function(err) {
			ui.addNotification(null, E('p', '%s'.format(err.message || err)), 'danger');
		});
	}
});
