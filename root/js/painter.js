function ThePainter(canvas, brushPalete) {
	this.canvas = canvas;
	this.brushes = brushPalete;
	this.tileWidth = 10;
	this.tileHeight = 10;
	this.mosaic = [];
	this.mosaicCache = {};
	this.sourcePictures = {};
	this.imageMaxW = 200;
	this.imageMaxH = 200;
	EventHub.addEventHub.call(this,['StartPaint', 'PaintProgress', 'EndPaint']);
}

ThePainter.prototype = {
	workerError: function(e) {
		console.log(e.message);
	},
	workerChunkFinished: function(data) {
		var p = this.worker.getProgress();
		this._firePaintProgress(p.finished,p.total);			
	},
	workerAllFinished: function() {
		var r = this.worker.results();
		var imgList = this.brushes.imgList;
		this.mosaic = [];
		var cx=0,cy=0;			
		for(var i in r) {
			cx=0;
			var row = r[i];
			if(!this.mosaic[cy]) {
				this.mosaic[cy] = [];
			}			
			for(var j in row){	
				this.mosaic[cy][cx++] = imgList[row[j]];
			}
			cy += 1;
		}
		this.mosaicCache[this.img.src] = this.mosaic;
		this._fireEndPaint();	
	},
	
	initBrushes:  function() {
		this.worker = new LongRunningTask({
			scriptFile: getSiteLocation() + "/js/brush_palette_findbycolor.js",
			func : findImageByColorArray,
			funcName : "findImageByColorArray",
			//type: "timeout",
		});
		var self = this;
		this.worker.onError = function (e) {
			self.workerError(e);
		};
		this.worker.onChunkFinished = function(data) {
			self.workerChunkFinished(data);
		};
		this.worker.onAllFinished = function() {
			self.workerAllFinished();
		};
		this.worker.init({
			colorCache: [],
			imgList: brushPalete.getBrushIndex(),
		});	
	},
	
	loadPicturesBegin: function() {
		var loader = ImageLoader.getLoader();
		loader.loadImagesBegin('tp');
		loader.onLoaded$('tp',this.onPictureLoaded, this);
		loader.onFailed$('tp',this.onPictureLoadFailed, this);
	},
	
	loadPictures: function (picInfoList) {
		ImageLoader.getLoader().loadImages('tp',picInfoList);
	},

	loadPicturesEnd: function() {
		var loader = ImageLoader.getLoader();
		loader.loadImagesEnd('tp');
		//loader.offLoaded$('tp',this.onPictureLoaded, this);
		//loader.offFailed$('tp',this.onPictureLoadFailed, this);
		//loader.onAllDone(this.applicationLoaded, this);
	},

	numPicturesInSet: function(set) {
		return this.sourcePictures[set] ? this.sourcePictures[set].length : undefined;
	},

	onPictureLoaded : function(pic, loaded, toLoad) {
		var set = pic.info.set || 0;
		if(!this.sourcePictures[set]) {
			this.sourcePictures[set] = [];
		}
		for( var i in this.sourcePictures[set]) {
			if(this.sourcePictures[set][i].info.picture == pic.info.picture) {
				return;
			}
		}
		this.sourcePictures[set].push(pic);
	},

	onPictureLoadFailed:  function() {
	},

	getPicturesForSet: function(set) {
		set = set || 0;
		return this.sourcePictures[set];
	},
	
	countPicturesForSet: function(set) {
		set = set || 0;
		return this.sourcePictures[set].length;
	},

	getCurrentPicSize: function() {
		if(this.img) {
			return fitImage(this.img, this.imageMaxW, this.imageMaxH);
		} else {
			return undefined;
		}
	},

	setCurrentPicture: function(set,id) {
		for( var i in this.sourcePictures[set]) {
			if(this.sourcePictures[set][i].info.id == id) {
				this.img = this.sourcePictures[set][i].img;
			}
		}
	},

	paint: function(set,pic) {
		if(!this.img){
			this.setCurrentPicture(0,0);
		}
		if( this.mosaicCache[this.img.src] ) {
			this.mosaic = this.mosaicCache[this.img.src];
			this._fireEndPaint();
			return;
		}
		var r = fitImage(this.img, this.imageMaxW, this.imageMaxH);
		this.createMosaic(
			AvgColorCalculator.get().imageData(this.img, r.width, r.height)
		);	
	},

	createMosaic: function(imgData) {
		var cx=0,cy=0;
		//this.mosaic = [];
		this._fireStartPaint();
		//console.profile("Create Mosaic");
		var argArray = [];
		this.worker.reset();
		for (var i=0; i < imgData.data.length; i+=4) {
			var red = imgData.data[i];
			var green = imgData.data[i+1];
			var blue = imgData.data[i+2];
			//console.log(" Searching image for pixel %i %i %i ", red, green, blue);
			//var img = this.brushes.findImageByColor(red, green, blue);
			//if(!this.mosaic[cy]) {
			//	this.mosaic[cy] = [];
			//}
			//this.mosaic[cy][cx] = img;
			//img.useCount += 1;
			argArray.push([red,green,blue]);
			cx += 1;
			if (cx >= imgData.width) {
				cx = 0 ;
				cy += 1;
				this.worker.queueWork(argArray);
				argArray = [];
			}
		}
		if(argArray.length){
			this.worker.queueWork(argArray);
		}
		//console.profileEnd();
	},

	_drawPicture: function(cb) {
		var dx=this.tileWidth,dy=this.tileHeight;		
		for(var cy=0; cy < this.mosaic.length; cy++){
			for(var cx=0; cx < this.mosaic[cy].length; cx++){
				cb(this.mosaic[cy][cx], cx, cy, cx*dx, cy*dy, dx, dy);
			}
		}
	},

	drawPicture: function() {
		if(!this.img) {
			// Nothing to do if there is no picture loaded
			return;
		}
		
		var effect = new PainterZoomInEffect(3000, this.canvas, this.img.width, this.img.height);
		this.canvas.removeAllSprites();
		this._drawPicture(function(img, cx, cy, x, y, w, h) {

			effect.randomEffect(img, cx, cy, x, y, w, h);	
			//effect.dropInEffect(img, cx, cy, x, y, w, h);
			
		});
		this.canvas.resetAnimationTime();
		this.canvas.startAnimation();
	},

	getUsersList: function() {
		if(!this.img) {
			// Nothing to do if there is no picture loaded
			return;
		}
		var users = {};
		this._drawPicture(function(img, cx, cy, x, y, w, h) {
			users[img.info.id] = img.info.name || '';
		});
		return users;
	},

}

