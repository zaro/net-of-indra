function ImageLoadPreview() {
	this.SpriteBase();
	this.sprites = new SpriteCollection();
	this.imageWidth = 50;
	this.imageHeight = 50;
	this.imageCursorX = 0;
	this.imageCursorY = 0;	
	this.progressBar = new ProgressBar(0);
	this.progressBar.setBox(0, 0, this.imageWidth, this.imageHeight);
}

copyPrototype(ImageLoadPreview, SpriteBase);

ImageLoadPreview.prototype.setSize = function(w,h) {
	SpriteBase.prototype.setSize.call(this,w,h);
	var progressBarHeight = this.imageHeight;
	this.progressBar.setSize(w,progressBarHeight);
	
	this.imgLoadAreaX = (this.w % this.imageWidth)/2;
	this.imgLoadAreaY = progressBarHeight + (this.h % this.imageHeight)/2;
	this.imgLoadAreaWidth = this.w - (this.w % this.imageWidth);
	this.imgLoadAreaHeight = this.w - progressBarHeight - ((this.w - progressBarHeight) % this.imageHeight);
	this.imageCursorX = this.imgLoadAreaX;
	this.imageCursorY = this.imgLoadAreaY;
	this.numTilesX = this.imgLoadAreaWidth / this.imageWidth;
	this.numTilesY = this.imgLoadAreaHeight / this.imageHeight;
}

ImageLoadPreview.prototype.moveImageCursor = function () {
	var numX = this.imgLoadAreaWidth / this.imageWidth;
	var numY = this.imgLoadAreaHeight / this.imageHeight;
	this.imageCursorX = this.imgLoadAreaX + randomInt(this.numTilesX-1)*this.imageWidth;
	this.imageCursorY = this.imgLoadAreaY + randomInt(this.numTilesY-1)*this.imageHeight;
}

ImageLoadPreview.prototype.doDraw = function(ctx) {
	if( this.progressBar ){
		this.progressBar.draw(ctx);
	}
	this.sprites.draw(ctx);
}

ImageLoadPreview.prototype.applyActor = function(timeDelta) {
	var active = false;
	if( this.progressBar ){
		active = this.progressBar.applyActor(timeDelta);
	}
	return this.sprites.applyActors(timeDelta) || active;
}

ImageLoadPreview.prototype.updateProgress = function(stats) {
	this.progressBar.value = stats._total.loaded/stats._total.total;
	//this.canvas.drawSprite(this.progressBar);
}

ImageLoadPreview.prototype.removeObjects = function() {
	this.sprites.removeSprites.apply(this.sprites, arguments);
}

ImageLoadPreview.prototype.addPicture = function(pic) {
	var img = pic.img;
	// Move the cursor for next image
	this.moveImageCursor();
	var s = new Sprite(img);
	var self = this;
	s.setPosition(this.imageCursorX, this.imageCursorY);
	if(s.w > this.imageWidth || s.h > this.imageHeight) {
		var scale=1;
		if( s.w > s.h ){
			scale = this.imageWidth/s.w;
		}else {
			scale = this.imageHeight/s.s;
		}
		s.setScale(scale, scale);
		// center image
		s.moveBy((this.imageWidth-s.w*scale)/2,(this.imageHeight-s.h*scale)/2);		
	}
	this.sprites.addSprite(s);
	var fr = new FillRectSprite(pic.avgRed, pic.avgGreen, pic.avgBlue, 0);
	fr.setBox(s.x, s.y, this.imageWidth, this.imageHeight);
	fr.a = 0;
	fr.addActor(new AnimateSprite(3000,{ 'a' : { 'endValue' : 1}}));
	fr.addActor(new SpriteDrawnCallback(function (sprite){
		self.removeObjects(s, fr);
	}));
	this.sprites.addSprite(fr);
}
