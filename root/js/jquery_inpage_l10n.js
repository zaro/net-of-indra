;
 (function($) {
$.selectorTranslate = {

	setTranslateSource : function (selector) {
		this.source = selector;
		this.currentLang = undefined;
	},
	
	getTranslateSource : function () {
		return this.source;
	},
	
	getAvailableLanguages : function () {
		var langDivs = $(this.source).find('div[lang]'),
				langs = [];
		langDivs.each(function(index){
			 langs.push( $(this).attr('lang') );
		});
		return langs;
	},

	getCurrentLanguage : function () {
		return this.currentLang;
	},

	getMessage : function (mid, lang) {
		lang  = lang || this.currentLang;
		var trRoot = $(this.source).find('div[lang="' + lang +'"]');
		if (trRoot) {
			var div = trRoot.find('div[mid="'+mid+'"]');
			if(div) {
				return div.html();
			}	
			return "*** Unknown messageId in getMessage() ***"
		}
		return "*** Unknown language in getMessage() ***"
	},

	translate: function (lang) {
		if( lang.indexOf('-') != -1) {
			lang = lang.substring(0,2);
		}
		var trRoot = $(this.source).find('div[lang="' + lang +'"]');
		this.currentLang = lang;
		if(trRoot.length == 0) {
			trRoot = $(this.source).find('div[lang="en"]');
			this.currentLang = 'en';
		}
		var setElText = function (el, attr, text) {
			if(attr) {
				el.attr(attr, text);
			} else {
				el.html(text);
			}
		};
		var divs = trRoot.find('div[tid]');
		divs.each(function(index){
			var tid = $(this).attr('tid'),
					attr = $(this).attr('attr');
			if (tid) {
				var trText = $(this).html();
				var el = $('#'+tid);
				if(!el || el.length == 0){
					debugLog("Cannot find element for "+tid)
					return;
				} else if( el.attr('role') && (el.attr('role').toLowerCase() == 'button') ){
					el.find('span').html(trText);
				} else if(el[0].tagName.toLowerCase() == "input"){
					var label = $('label[for="'+tid+'"]');
					if(label) {
						var span = label.find('span');
						if(span.length > 0) {
							span.html(trText);
						} else {
							label.html(trText);
						}
					} else {
						setElText(el,attr,trText);
					}
				} else {
					setElText(el,attr,trText);
				}
			}
		});
		divs = trRoot.find('div[cid]');
		divs.each(function(index){
				var cid = $(this).attr('cid'),
						attr = $(this).attr('attr'),
						el = $('.'+cid),
						trText = $(this).html();
					setElText(el,attr,trText);
		});
	},

};

})(jQuery);

