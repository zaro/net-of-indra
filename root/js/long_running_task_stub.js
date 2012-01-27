// Check if we are in webworker context, and add the stub only if so
if( typeof window == "undefined" ) {
	// Webworker context
	self.addEventListener('message', function(e) {
		var data = e.data;
		switch (data.cmd) {
			case 'data':
				self[data.key] = data.data;
				break;
			case 'call':
				var f = self[data.funcName],
						r = f.apply(self, data.arguments);
				self.postMessage(r);
				break;
		};
	}, false);
}
