function BrushPalete(canvas) {
	this.canvas = canvas;
	this.imgList = [];
	this.colorCache = [];
}

BrushPalete.prototype = {
	
	showProgress: function (ratio) {
		//this.progressBar.value = ratio;
		//this.canvas.drawSprite(this.progressBar);
	},
	loadBrushesBegin : function(imageLoadPreview) {
		var self = this;
		var loader = ImageLoader.getLoader();
		loader.loadImagesBegin('bp');
		loader.onLoaded$('bp',this.imageLoaded, this);
		loader.onFailed$('bp',this.imageLoadFailed, this);
		this.imageLoadPreview = imageLoadPreview;
	},

	loadBrushesEnd : function() {
		var self = this;
		var loader = ImageLoader.getLoader();		
		loader.loadImagesEnd('bp');
		loader.onAllLoaded$('bp', function(){
			loader.offLoaded$('bp',self.imageLoaded);
			loader.offFailed$('bp',self.imageLoadFailed);
		});
	},
	
	loadBrushes : function (imgSrcList) {
		ImageLoader.getLoader().loadImages('bp', imgSrcList);
	},


	
	imageLoadFailed : function (userPic, loaded, toLoad) {
	},



	imageLoaded : function (userPic, loaded, toLoad) {
		var img = userPic.img;
		var fBegin = new Date().getTime();
		var avg = AvgColorCalculator.get().imageAvgColor(img);
		//debugLog("<1>imageAvgColor took:" + (new Date().getTime() - fBegin) + "ms");					
		userPic.avgRed = avg.red;
		userPic.avgGreen = avg.green;
		userPic.avgBlue = avg.blue;		

		// draw the image
		this.imageLoadPreview.addPicture(userPic);
		
		if( !this.canvas.animationRunning ){
			this.canvas.startAnimation();
		}

		// Update progress bar
		this.showProgress(loaded/toLoad);
		
		this.imgList.push(userPic);
	},

	getBrushIndex: function() {
		if( !this.brushIndex ){
			var len = this.imgList.length;
			var brushIndex = new Array(len);
			for(var i=0; i<len; ++i){
				brushIndex[i] = {
					avgRed : this.imgList[i].avgRed,
					avgGreen : this.imgList[i].avgGreen,
					avgBlue : this.imgList[i].avgBlue,
				};
			}
			this.brushIndex = brushIndex;
		}
		return this.brushIndex;
	},
	
	getBrush: function(index) {
		return this.imgList[index];
	},
	
	hashColor: function (red, green, blue) {
		return (red << 16) | (green << 8) | blue; 
	},	

	findImageByColor: function (red, green, blue) {
		//colorDistance = this.colorCache[this.hashColor(red,green,blue)];
		var index = this.colorCache[this.hashColor(red,green,blue)];
		if(!index){
			var colorDistance;
			//colorDistance = new ColorDistance();
			colorDistance = 999999;
			var imgList = this.imgList;
			for(var i in imgList) {
				var p = imgList[i],
						dR = red - p.avgRed,
						dG = green - p.avgGreen,
						dB = blue - p.avgBlue,
						dist = Math.sqrt(dR*dR + dG*dG + dB*dB);
				//colorDistance.addDistance(dist, i);
				if(dist  < colorDistance){
					colorDistance = dist;
					index = i;
				}
			}
			//this.colorCache[this.hashColor(red,green,blue)] = colorDistance;
			this.colorCache[this.hashColor(red,green,blue)] = index;
		}
		//var img = this.imgList[colorDistance.getRandom()];
		var img = this.imgList[index];
		return img;
	},
	
}

