function LongRunningTask(options) {
	this.hasWW = options.type ? (options.type == 'webworker') : (typeof Worker == "function");
	this.scriptFile = options.scriptFile;
	this.func = options.func;
	this.funcName = options.funcName;
	this._results = [];
	this._queue = [];
}

LongRunningTask.prototype.results = function() {
	return this._results;
}

LongRunningTask.prototype.getProgress = function() {
	var total = this._queued + this._queue.length;
	return {
		finished  : this._finished,
		total: total,
	};
}

LongRunningTask.prototype.reset = function() {
	this._results = [];
	this._queue = [];
	this._queued = 0;
	this._finished = 0;
}

LongRunningTask.prototype._chunkFinished = function(data) {
	this._results.push(data);
	this._finished += 1;
	if( this.onChunkFinished ) {
		this.onChunkFinished(data);
	}
	if( this._queue.length == 0 ) {
		if((this._finished == this._queued) && this.onAllFinished){
			this.onAllFinished();
		}
	} else {
		this._queueNext();
	}
}

LongRunningTask.prototype._error = function(error) {
	if( this.onError ) {
		this.onError(error);
	}
}

LongRunningTask.prototype._queueNext = function() {
	var args = this._queue.shift();
	this._queued += 1;
	if( this.hasWW ){
		this.worker.postMessage({cmd:'call', funcName:this.funcName, arguments:args});
	} else {
		var self = this;
		setTimeout(function() {
			var r = self.func.apply(self,args);
			self._chunkFinished(r);
		},0);
	}
}

LongRunningTask.prototype.init = function(options) {
	if( this.hasWW ){
		var self = this;
		this.worker = new Worker(this.scriptFile);
		this.worker.addEventListener('message', function(e) {
			self._chunkFinished(e.data);
		}, false);
		this.worker.addEventListener('error', function(e) {
			self._error(e);
		}, false);
		for(var key in options){
			this.worker.postMessage({cmd:'data', key:key, data:options[key]});
		}		
	} else {
		for(var key in options){
			this[key] = options[key];
		}
	}
	this._queued = 0;
	this._finished = 0;
}

LongRunningTask.prototype.queueWork = function() {
	var args = Array.prototype.slice.call(arguments);
	this._queue.push(args);
	if( this._queued == this._finished ){
		this._queueNext();
	}
}

