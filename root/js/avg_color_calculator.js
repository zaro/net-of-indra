function AvgColorCalculator() {
	this.offScrCanvas = document.createElement('canvas');
	this.offScrContext = this.offScrCanvas.getContext('2d');
}

AvgColorCalculator.get = function() {
	if(!AvgColorCalculator.prototype.__calculatorInstance) {
		AvgColorCalculator.prototype.__calculatorInstance = new AvgColorCalculator();
	}
	return AvgColorCalculator.prototype.__calculatorInstance;
}

AvgColorCalculator.prototype.calcImgDataAvgColor = function(imgData) {
	var red=0;
	var green=0;
	var blue=0;
	var numPixels = imgData.length/4;
	for (var i=0; i < imgData.length; i+=4) {
		red += imgData[i];
		green += imgData[i+1];
		blue += imgData[i+2];
	}
	return { 
		red : Math.round(red/numPixels) ,
		green : Math.round(green/numPixels),
		blue : Math.round(blue/numPixels),
	}
}

AvgColorCalculator.prototype.imageData = function (img, width, height) {
	width = width || img.width;
	height = height || img.height;
	if( this.offScrCanvas.width != width ) {
    this.offScrCanvas.width = width;
  }
	if( this.offScrCanvas.height != height ) {
    this.offScrCanvas.height = height;
  }
  this.offScrContext.drawImage(img, 0, 0, width, height);
	return this.offScrContext.getImageData( 0, 0, width, height);
}

AvgColorCalculator.prototype.imageAvgColor = function (img) {
	return this.calcImgDataAvgColor(this.imageData(img).data);
}


