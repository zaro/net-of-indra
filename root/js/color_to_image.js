(function (self){

	var findImageByColor = function(red, green, blue) {
		var index = this.colorCache[this.hashColor(red,green,blue)];
		if(!index){
			var colorDistance;
			colorDistance = 999999;
			var imgList = this.imgList;
			for(var i in imgList) {
				var p = imgList[i],
						dR = red - p.avgRed,
						dG = green - p.avgGreen,
						dB = blue - p.avgBlue,
						dist = Math.sqrt(dR*dR + dG*dG + dB*dB);
				if(dist  < colorDistance){
					colorDistance = dist;
					index = i;
				}
			}
			this.colorCache[this.hashColor(red,green,blue)] = index;
		}
		return this.imgList[index];
	}
	self.findImageByColor = findImageByColor;

	if( typeof window == "object" ) {
		// We are in the page context
	} else {
		// Webworker context
		self.addEventListener('message', function(e) {
			var data = e.data;
			switch (data.cmd) {
				case 'data':
					self[data.key] = data.data;
				  break;
				case 'call':
					var f = self[funcName],
							r = f.apply(self, data.arguments);
				  self.postMessage(r);
				  break;
			};
		}, false);
	}
})(this);
