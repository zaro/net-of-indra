function findImageByColor(red, green, blue) {
	//colorDistance = this.colorCache[this.hashColor(red,green,blue)];
	var	colorHash = ((red << 16) | (green << 8) | blue),
			index = this.colorCache[colorHash];
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
		this.colorCache[colorHash] = index;
	}
	//var img = this.imgList[colorDistance.getRandom()];
	//var img = this.imgList[index];
	//return img;
	return index;
}

function findImageByColorArray(array){
	var r = [];
	for(var i in array){
		var e = array[i];
		r.push(findImageByColor.apply(this,e));
	}
	return r;
}
	
if( typeof window == "undefined" ) {
	importScripts('long_running_task_stub.js');
}

