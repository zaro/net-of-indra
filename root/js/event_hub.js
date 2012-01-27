function EventHub(){
	this.events = {};
	this.contexts = {};
}

EventHub.addEventHub = function(eventList) {
	this.events = new EventHub();
	
	this.on = function() {
		return this.events.on.apply(this.events, arguments);
	}

	this.trigger = function() {
		return this.events.trigger.apply(this.events, arguments);
	}
	
	var __slice = Array.prototype.slice;
	
	for(var i in eventList){
		var event = eventList[i];
		
		this['on' + event] = (function(ev) {
			return function() {
				return this.events.on.apply(this.events, [ev].concat(__slice.call(arguments)));
			}
		})(event);
		this['on' + event + '$'] = (function(ev) {
			return function() {
				var c=__slice.call(arguments);
				c[0] = {tag:arguments[0],name:ev};
				return this.events.on.apply(this.events, c);
			}
		})(event);
		
		this['off' + event] = (function(ev) {
			return function() {
				return this.events.off.apply(this.events, [ev].concat(__slice.call(arguments)));
			}
		})(event);
		this['off' + event + '$'] = (function(ev) {
			return function() {
				var c=__slice.call(arguments);
				c[0] = {tag:arguments[0],name:ev};
				return this.events.off.apply(this.events, c);
			}
		})(event);
		
		this['_fire' + event] = (function(ev) {
			return function() {
				return this.events.trigger.apply(this.events, [ev].concat(__slice.call(arguments)));
			}
		})(event);
		this['_fire' + event + '$'] = (function(ev) {
			return function() {
				var c=__slice.call(arguments);
				c[0] = {tag:arguments[0],name:ev};
				return this.events.trigger.apply(this.events,c);
			}
		})(event);
		
		this['_fire' + event + '$All'] = (function(ev) {
			return function() {
				return this.events.triggerAll.apply(this.events,[ev].concat(__slice.call(arguments)));
			}
		})(event);
	}
	return this;
}

EventHub.prototype.on = function(event, callback, context) {
	if(!callback){
		return;
	}
	var hasCfg = event instanceof Object,
			tag = hasCfg ? event.tag || 0 : 0,
			name = hasCfg ? event.name : event,
			oneTime = hasCfg ? event.oneTme || false : false 
			evt = this.events[tag],
			ctx =  this.contexts[tag],
			rv = [ tag, name,];
	if(!evt || !evt[name]) {
		(this.events[tag] = evt || {})[name] = [ callback ];
		(this.contexts[tag] = ctx || {})[name] = [ context ];
		rv.push(0);
	} else {
		if(evt[name].indexOf(callback) == -1) {
			evt[name].push(callback);
			ctx[name].push(context);
			rv.push(evt.length-1);
		} else {
			return;
		}
	}
	return rv;
}

EventHub.prototype.off = function(event, callback) {
	if(!callback){
		return;
	}
	var hasCfg = event instanceof Object ,
			tag = hasCfg ? event.tag : 0,
			name = hasCfg ? event.name : event,
			evt = this.events[tag] ? this.events[tag][name] : undefined,
			ctx = this.contexts[tag] ? this.contexts[tag][name] : undefined;
	var idx = evt.indexOf(callback);
	var r=0;
	while( idx >= 0 ){
		evt.splice(idx,1);
		ctx.splice(idx,1);
		idx = evt.indexOf(callback);
		r += 1; 
	}
	return r;
}

EventHub.prototype.trigger = function(event) {
	var hasCfg = event instanceof Object,
			tag = hasCfg ? event.tag : 0,
			name = hasCfg ? event.name : event,
			evt = this.events[tag] ? this.events[tag][name] : undefined,
			ctx = this.contexts[tag] ? this.contexts[tag][name] : undefined;
	for(var i in evt) {
		var e = evt[i],
				c = ctx[i],
				_this ;
				if(c instanceof Array){
					_this = c.shift();
					c = c.slice(0);
				} else {
					_this = c;
					c = [];
				}
				e.apply(_this, c.concat(Array.prototype.slice.call(arguments,1)));
	}
	//debugLog("Event "+tag+'.'+name +" triggered");
}

EventHub.prototype.triggerAll = function() {
	for(var tag in this.events) {
		this.trigger.apply(this, arguments);
	}
}



