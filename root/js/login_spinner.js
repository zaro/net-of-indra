function LoginSpinner(spinnerId) {
	this.spinner = $(spinnerId);
	this.spinner.inUseCount = 0;
}

LoginSpinner.prototype = {
	incUse: function () {
		this.spinner.inUseCount += 1;
		if( this.spinner.inUseCount > 0 ) {
			this.spinner.show();
		}
	},
	decUse: function () {
		this.spinner.inUseCount -= 1;
		if( this.spinner.inUseCount <= 0 ) {
			this.spinner.hide();
		}
	}
}

