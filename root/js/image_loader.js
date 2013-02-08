function ImageLoader() {
	this.imagesLoaded = {};
	this.imagesToLoad = {};
	this.imgesLoadingFinished = {};
	EventHub.addEventHub.call(this,['Loaded', 'Failed', 'AllLoaded','ProgressUpdate','AllDone']);
}

ImageLoader.getLoader = function() {
	if(!ImageLoader.prototype.__loaderInstance) {
		ImageLoader.prototype.__loaderInstance = new ImageLoader();
	}
	return ImageLoader.prototype.__loaderInstance;
}

ImageLoader.prototype.getProxyForURL = function(url){
	//return "/proxy/" + escape(url);
	return url;
}

/*
ImageLoader.prototype.loadImagesBegin = function(tag, onLoaded, onFailed, context) {
	this.imagesLoaded[tag] = 0;
	this.imagesToLoad[tag] = 0;
	this.imgesLoadingFinished[tag] = false;
	this.onLoaded$(tag, onLoaded, context);
	this.onFailed$(tag, onFailed, context);
}

ImageLoader.prototype.loadImagesEnd = function(tag, onAllLoaded, context) {
	this.imgesLoadingFinished[tag] = true;
	this.onAllLoaded$(tag, onAllLoaded, context)
}

*/

ImageLoader.prototype.loadImagesBegin = function(tag) {
	this.imagesLoaded[tag] = 0;
	this.imagesToLoad[tag] = null;
	this.imgesLoadingFinished[tag] = false;
}

ImageLoader.prototype.loadImagesEnd = function(tag) {
	this.imgesLoadingFinished[tag] = true;
	this._allLoaded(tag)
}

ImageLoader.prototype.loadImages = function (tag, imgSrcList) {
	var toLoad=0;
	for (var i in imgSrcList) {
		imgSrcList[i].picture = this.getProxyForURL(imgSrcList[i].picture);
		var pic = new Picture(this, tag, imgSrcList[i]);
		toLoad += 1;
	}
	this.imagesToLoad[tag] += toLoad;
}

ImageLoader.prototype._allLoaded = function(tag) {
	if(this.imgesLoadingFinished[tag] && this.imagesLoaded[tag] == this.imagesToLoad[tag]) {
		debugLog("ImageLoader all loaded for: " +tag);
		this._fireAllLoaded$(tag);
		this._allTagsLoaded();
	}
}

ImageLoader.prototype._allTagsLoaded = function() {
	var allDone = true;
	for(var tag in this.imagesLoaded){
		if(!(this.imgesLoadingFinished[tag] && this.imagesLoaded[tag] == this.imagesToLoad[tag])) {
			allDone = false;
		}	
	}
	if(allDone){
		debugLog("ImageLoader invoking allDone");
		this._fireAllDone();
	}
}

//ImageLoader.prototype.onAllDone = function (callback, context) {
//	this.events.on('onAllDone', callback, context);
//}

//ImageLoader.prototype.onProgressUpdate = function (callback, tag) {
//	if(tag != undefined && tag != null) {
//		this.events.on({tag:tag, name:'onProgressUpdate'}, callback);
//	}
//	this.events.on('onProgressUpdate', callback);
//}

ImageLoader.prototype.getProgressStat = function() {
	var stat = {};
	var allLoaded=0, allTotal=0;
	for(var tag in this.imagesLoaded){
		allLoaded += this.imagesLoaded[tag];
		allTotal += this.imagesToLoad[tag];
		stat[tag] = { loaded: this.imagesLoaded[tag], total: this.imagesToLoad[tag] };
	}
	stat._total = { loaded: allLoaded, total: allTotal };
	return stat;
}

ImageLoader.prototype.imageLoadFailed = function (pic, tag) {
	debugLog("Failed to load image : %o", pic);
	var t = new Date().getTime();
	// Retry here
	if( pic.imgDlRetried < 3) {
		debugLog("  Retry to download it.["+ pic.imgDlRetried+ "] - "+t );
		pic.retry(this);
		return;
	} else {
		debugLog("  Retry limit reached. ["+ pic.imgDlRetried+"] - "+t);
	}
	
	
	this.imagesLoaded[tag] += 1;
	this._fireFailed$(tag, pic, this.imagesLoaded[tag], this.imagesToLoad[tag]);
	this._fireProgressUpdate$All(this.getProgressStat());
	this._allLoaded(tag);
}

ImageLoader.prototype.imageLoaded = function (pic, tag) {
	this.imagesLoaded[tag] += 1;
	this._fireLoaded$(tag, pic, this.imagesLoaded[tag], this.imagesToLoad[tag]);
	this._fireProgressUpdate$All(this.getProgressStat());
	this._allLoaded(tag);		
}

