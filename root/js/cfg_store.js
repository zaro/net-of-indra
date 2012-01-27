function CfgStore() {	
}

CfgStore._createCookie = function (name,value,days) {
	days =  days || 1000;
	var date = new Date();
	date.setTime(date.getTime()+(days*24*60*60*1000));
	var expires = "; expires="+date.toGMTString();
	document.cookie = name + "=" + value + expires + "; path=/";
}

CfgStore._readCookie = function(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

CfgStore._eraseCookie = function (name) {
	return CfgStore._createCookie(name,"",-1);
}

CfgStore.getKey = function(key) {
	return CfgStore._readCookie(key);
}

CfgStore.setKey = function(key, value) {
	return CfgStore._createCookie(key, value);
}

CfgStore.deleteKey = function(key) {
	return CfgStore._eraseCookie(key);
}

