'use strict';
'require fs';
'require poll';
'require ui';
'require uci';
'require view';

function statusOutput() {
	return fs.exec('/usr/sbin/mwan6-npt', ['status']).then(function(res) {
		if (res.code !== 0 && !res.stdout)
			throw new Error(res.stderr || _('mwan6-npt status failed'));

		return res.stdout || res.stderr || '';
	});
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('mwan6-npt'),
			statusOutput()
		]);
	},

	render: function(data) {
		var text = data[1] || '',
		    view = this;

		var body = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('NPTv6 Multi-WAN — Status')),
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-section-descr' },
					_('Live output from mwan6-npt. Use the buttons to regenerate or clear nftables hook files.')),
				E('div', { 'class': 'cbi-section-node' }, [
					E('pre', {
						'id': 'mwan6-npt-status',
						'class': 'cbi-output',
						'style': 'white-space:pre-wrap;max-height:32em;overflow:auto'
					}, text)
				]),
				E('div', { 'class': 'cbi-page-actions' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action important',
						'click': ui.createHandlerFn(view, 'runUpdate')
					}, _('Update rules')),
					E('button', {
						'class': 'cbi-button cbi-button-negative',
						'click': ui.createHandlerFn(view, 'runFlush')
					}, _('Flush rules')),
					E('button', {
						'class': 'cbi-button cbi-button-neutral',
						'click': ui.createHandlerFn(view, 'refreshStatus')
					}, _('Refresh'))
				])
			])
		]);

		poll.add(L.bind(this.pollStatus, this));

		return body;
	},

	pollStatus: function() {
		return statusOutput().then(function(text) {
			var el = document.getElementById('mwan6-npt-status');
			if (el)
				el.textContent = text;
		});
	},

	refreshStatus: function() {
		return this.pollStatus().then(function() {
			ui.addNotification(null, E('p', _('Status refreshed.')), 'info');
		});
	},

	runUpdate: function() {
		return fs.exec('/usr/sbin/mwan6-npt', ['update']).then(L.bind(function(res) {
			if (res.code !== 0)
				throw new Error(res.stderr || _('Update failed'));

			ui.addNotification(null, E('p', _('Rules updated and firewall reloaded.')), 'info');
			return this.pollStatus();
		}, this)).catch(function(err) {
			ui.addNotification(null, E('p', '%s'.format(err.message || err)), 'danger');
		});
	},

	runFlush: function() {
		return fs.exec('/usr/sbin/mwan6-npt', ['flush']).then(L.bind(function(res) {
			if (res.code !== 0)
				throw new Error(res.stderr || _('Flush failed'));

			ui.addNotification(null, E('p', _('Rules flushed.')), 'warning');
			return this.pollStatus();
		}, this)).catch(function(err) {
			ui.addNotification(null, E('p', '%s'.format(err.message || err)), 'danger');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
