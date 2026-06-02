'use strict';
'require view';

return view.extend({
	load: function() {
		window.location = L.url('admin/network/mwan6-npt');
	}
});
