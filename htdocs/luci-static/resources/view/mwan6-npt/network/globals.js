'use strict';
'require form';
'require fs';
'require ui';
'require uci';
'require view';

var map;

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
	render: function() {
		var m, s, o;

		m = new form.Map('mwan6-npt', _('NPTv6 Multi-WAN — Globals'),
			_('Enable the procd service and reload rules after saving configuration. '
			  + 'Interface sections must use the same names as Linux interfaces (see Network → Interfaces).'));

		s = m.section(form.NamedSection, 'globals', 'globals', _('Service'));
		s.addremove = false;
		s.anonymous = false;

		o = s.option(form.Flag, 'enabled', _('Enable mwan6-npt service'),
			_('When enabled, the init script regenerates NPTv6 rules on boot and on config reload.'));

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
