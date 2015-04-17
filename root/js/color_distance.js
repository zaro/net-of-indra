function ColorDistance() {
	this.distances = [];
	this.values = [];
}

ColorDistance.prototype = {
	deltaDistance : 10,
	maxDistances: 5,
	addDistance : function (distance, value) {
		var od = this.distances,
				ov = this.values,
				insertAt;
		for (insertAt=0; od[insertAt] != undefined; insertAt++) {
			if(distance < od[insertAt]) {
				break;
			}
		}
		//  2nd try
		if (insertAt < this.distances.length || this.distances.length < this.maxDistances) {
			var nd = new Array(this.maxDistances), nv = new Array(this.maxDistances);
			var minDistance = (insertAt == 0) ? distance : od[0] ;
			var i=0,j=0;
			for(; i < od.length || i == 0; ++i){
				if( i == insertAt ){
					nd[i] = distance;
					nv[i] = value;
				} else {
					nd[i] = od[j];
					nv[i] = ov[j];
					j++;
				}
				if( Math.abs(nd[i] - minDistance) > this.deltaDistance ){
					++i;
					break;
				}
			}
			nd.length = i ;
			nv.length = i ;
			this.distances = nd;
			this.values = nv;
		}
		/* // 1st try
		if (insertAt < this.distances.length || this.distances.length < this.maxDistances) {
			this.distances.splice(insertAt, 0, distance);
			this.values.splice(insertAt, 0, value);
			var minDistance = this.distances[0];
			for (var i=1;i < this.distances.length;) {
				if( Math.abs(this.distances[i] - minDistance) > this.deltaDistance ){
					this.distances.splice(i,1);
					this.values.splice(i,1);
				} else {
					i += 1;
				}
			}
		}
		*/
	},

	getClosest: function() {
		return this.values[0];
	},

	getRandom: function() {
		return this.values[Math.floor(this.values.length*Math.random()) ];
	},
};
