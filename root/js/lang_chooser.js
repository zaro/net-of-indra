function LangChooser() {
	var current = APP_CONFIG.currentLang;
	this.selectBox = $('#langSelector');
	this.selectBox.find("option").each(function() {
		if(this.value == current) {
			this.selected = true;
		} else {
			this.selected = false;
		}
	});
	var self=this;
	this.selectBox.bind("change", function(){
		self._langSelected();
	});
}

LangChooser.prototype.getSelectBox = function() {
	return this.selectBox;
}

LangChooser.prototype._langSelected = function() {
	CfgStore.setKey("lang",this.selectBox.selectmenu("value"));
	window.location = '/';
}

