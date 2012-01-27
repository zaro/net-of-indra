function Picture(receiver, tag, picInfo) {
	this.img = new Image();
	var userPic = this;
	this.tag = tag;
	this.imgDlRetried = picInfo.retryCount || 0;
	this.info  = picInfo;
	this.avgRed = 0;
	this.avgGreen = 0;
	this.avgBlue = 0;
	this.useCount = 0;
	// Now trigger image download
	this.img.onload = function() {
		receiver.imageLoaded(userPic, tag);
		this.onload = null;
		this.onerror = null;
		this.onabort = null;
	}
	this.img.onerror = function() {
		debugLog("Failed to load image for user[ " + userPic.info.domain + "/" + userPic.info.id + "]");
		debugLog("  error fetching URL: " + this.src);
		receiver.imageLoadFailed(userPic, tag);
		this.onload = null;
		this.onerror = null;
		this.onabort = null;
	}
	this.img.onabort = function() {
		debugLog("Failed to load image for user[ " + userPic.info.domain + "/" + userPic.info.id + "]");
		debugLog("  abort while fetching URL: " + this.src);
		receiver.imageLoadFailed(userPic, tag);
		this.onload = null;
		this.onerror = null;
		this.onabort = null;
	}
	this.img.src = picInfo.picture;
}

Picture.prototype.retry = function(brushPalete) {
	this.info.retryCount = this.info.retryCount ? this.info.retryCount + 1 : 1;
	debugLog("PIcture - retry -" + this.info);
	return  new Picture(brushPalete, this.tag, this.info);
}

