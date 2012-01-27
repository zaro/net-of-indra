

function PainterZoomInEffect(animationTime, canvas, srcImgWidth, srcImgHeight){
	this.animationTime = animationTime;
	this.canvasWidth = canvas.width();
	this.canvasHeight = canvas.height();
	this.canvas = canvas;
	this.mid = new Point(this.canvasWidth/2, this.canvasHeight/2);
	this.picX = 0|(this.mid.x-srcImgWidth/2);
	this.picY = 0|(this.mid.y- srcImgHeight/2);
	var effects = [];
	for( var i in this){
		if(typeof this[i] == 'function' && i.indexOf('Effect') > 0){
			effects.push(i);
		}
	}
	var randomEff = effects[randomInt(effects.length-1)];
	debugLog("[PainterZoomInEffect]Using random effect: " + randomEff);
	this.randomEffect = this[randomEff];
	this.rotations =  Math.random()*(3);
	this.easing = 'easeOutCubic';
}

PainterZoomInEffect.prototype.simpleZoomInEffect = function(img, cx, cy, x, y, w, h) {
	// Make picture zoom in
	var sprite = new Sprite(img.img);
	sprite.setPosition(this.picX + cx, this.picY + cy);
	sprite.setScaleAsSize(1,1);	
	sprite.addActor(new AnimateSprite(this.animationTime,{
						'x' : {
							'endValue': x,
							'easing' : this.easing,
						},
						'y' : {
							'endValue': y,
							'easing' : this.easing,
						},
						'scaleX' : {
							'endValue' : w/sprite.w,
							'easing' : this.easing,
						},
						'scaleY' : {
							'endValue' : h/sprite.h,
							'easing' : this.easing,
						},
	}));
	this.canvas.addSprite(sprite);	
}

PainterZoomInEffect.prototype.rotateZoomInEffect = function(img, cx, cy, x, y, w, h) {
	// Spiraling zoom in
	var sprite = new Sprite(img.img);
	//sprite.setPosition(this.picX + cx, this.picY + cy);
	sprite.setPosition(this.mid.x, this.mid.y);	
	sprite.setScaleAsSize(1,1);
	sprite.addActor( new CompositeActor(
		new SpiralPathActor(this.animationTime, {
					'x' : x,
					'y' : y,
					'numRotations' : this.rotations,
					'easing' : this.easing,
		}),
		new AnimateSprite(this.animationTime, {
						'scaleX' : {
							'endValue' : w/sprite.w,
							'easing' : this.easing,
						},
						'scaleY' : {
							'endValue' : h/sprite.h,
							'easing' : this.easing,
						},
		})
	));
	this.canvas.addSprite(sprite);	
}

PainterZoomInEffect.prototype.whirlpoolZoomInEffect = function(img, cx, cy, x, y, w, h) {
	// Whirpooling zoom in
	var sprite = new Sprite(img.img);	
	//sprite.setPosition(this.picX + cx, this.picY + cy);
	sprite.setPosition(this.mid.x, this.mid.y);
	sprite.setScaleAsSize(1,1);
	var maxDistance = this.mid.distance();
	var distance = new Point(x,y).distance(this.mid);
	sprite.addActor(new AnimateSprite(this.animationTime*(1-(distance/maxDistance)), {}));
	sprite.addActor( new CompositeActor(
		new SpiralPathActor(this.animationTime*(distance/maxDistance),{
					'x' : x,
					'y' : y,
					'numRotations' : this.rotations,
					'easing' : this.easing,
		}),
		new AnimateSprite(this.animationTime*(distance/maxDistance), {
						'scaleX' : {
							'endValue' : w/sprite.w,
							'easing' : this.easing,
						},
						'scaleY' : {
							'endValue' : h/sprite.h,
							'easing' : this.easing,
						},
		})
	));
	this.canvas.addSprite(sprite);	
}

PainterZoomInEffect.prototype.whirlpoolZoomInEffect2 = function(img, cx, cy, x, y, w, h) {
	var sprite = new Sprite(img.img);
	var sx,sy;
	if(x < this.mid.x) {
		sx = -w;
	} else {
		sx = this.canvasWidth;
	}
	if(y < this.mid.y) {
		sy = -h;
	} else {
		sx = this.canvasHeight;
	}
	sprite.setPosition(sx, sy);
	sprite.setScaleAsSize(1,1);
	var maxDistance = this.mid.distance();
	var distance = new Point(x,y).distance(this.mid);
	sprite.addActor(new AnimateSprite(this.animationTime*(distance/maxDistance), {}));
	sprite.addActor( new CompositeActor(
		new SpiralPathActor(this.animationTime*(1-(distance/maxDistance)),{
					'x' : x,
					'y' : y,
					'numRotations' : this.rotations,
					'direction' : -1,
					'easing' : this.easing,
		}),
		new AnimateSprite(this.animationTime*(1-(distance/maxDistance)), {
						'scaleX' : {
							'endValue' : w/sprite.w,
							'easing' : this.easing,
						},
						'scaleY' : {
							'endValue' : h/sprite.h,
							'easing' : this.easing,
						},
		})
	));
	this.canvas.addSprite(sprite);	
}

PainterZoomInEffect.prototype.sideSlideInEffect = function(img, cx, cy, x, y, w, h) {
	var sprite = new Sprite(img.img);
	// Sliding in from sides
	sprite.setScale(w/sprite.w,h/sprite.h);
	var sx,sy;
	var delayCoef;
	if(cx >= cy){
		sx = this.canvasWidth + w;
		sy = y;
		delayCoef = x/this.canvasWidth;
	}else{
		sx = x;
		sy = this.canvasHeight + h;
		delayCoef = y/this.canvasHeight;
	}
	sprite.setPosition(sx,sy);
	sprite.addActor(new AnimateSprite(this.animationTime*delayCoef, {}));
	sprite.addActor(
		new AnimateSprite(this.animationTime*(1-delayCoef), {
						'x' : {
							'endValue': x,
							'easing' : this.easing,
						},
						'y' : {
							'endValue': y,
							'easing' : this.easing,
						},
		})
	);
	this.canvas.addSprite(sprite);	
}

PainterZoomInEffect.prototype.dropInEffect = function(img, cx, cy, x, y, w, h) {
	var sprite = new Sprite(img.img);
	// Sliding in from sides
	if( !this.columnDelay ) {
		this.columnDelay = [];
	}
	sprite.setScale(w/sprite.w,h/sprite.h);
	var sx,sy;
	var delayCoef, columnCoef;
	sx = x;
	sy = -sprite.h;
	delayCoef = (1 - y/this.canvasHeight);
	if( !this.columnDelay[cx] ) {
		columnCoef = this.columnDelay[cx] = Math.random()/3;
	} else {
		columnCoef = this.columnDelay[cx];
	}
	delayCoef += columnCoef;
	sprite.setPosition(sx,sy);
	sprite.addActor(new AnimateDelay((this.animationTime)*delayCoef));
	sprite.addActor(
		new AnimateSprite(this.animationTime*(1-delayCoef), {
						'x' : {
							'endValue': x,
							'easing' : this.easing,
						},
						'y' : {
							'endValue': y,
							'easing' : this.easing,
						},
		})
	);
	this.canvas.addSprite(sprite);	
}


PainterZoomInEffect.prototype.popInEffect = function(img, cx, cy, x, y, w, h) {
	var sprite = new Sprite(img.img);
	// Tiles popping in
	sprite.setScaleAsSize(0,0);
	sprite.setPosition(x+w/2,y+h/2);
	var delayCoef = Math.random()/3 +.05;
	sprite.addActor(new AnimateDelay(this.animationTime*delayCoef));
	sprite.addActor( 
		new AnimateSprite(this.animationTime*(delayCoef), {
						'x' : {
							'endValue': x,
							'easing' : this.easing,
						},
						'y' : {
							'endValue': y,
							'easing' : this.easing,
						},		
						'scaleX' : {
							'endValue' : w/sprite.w,
							'easing' : this.easing,
						},
						'scaleY' : {
							'endValue' : h/sprite.h,
							'easing' : this.easing,
						},
		})
	);
	this.canvas.addSprite(sprite);	
}

PainterZoomInEffect.prototype.randomPlaceEffect = function(img, cx, cy, x, y, w, h) {
	var sprite = new Sprite(img.img);
	// Random placement
	sprite.setScale(1,1);
	sprite.setPosition(this.canvasWidth*Math.random(),this.canvasHeight*Math.random());
	var delayCoef = 1;
	//sprite.addActor(new AnimateSprite(this.animationTime*delayCoef, {}));
	sprite.addActor( 
		new AnimateSprite(this.animationTime*(delayCoef), {
						'x' : {
							'endValue': x,
							'easing' : this.easing,
						},
						'y' : {
							'endValue': y,
							'easing' : this.easing,
						},		
						'scaleX' : {
							'endValue' : w/sprite.w,
							'easing' : this.easing,
						},
						'scaleY' : {
							'endValue' : h/sprite.h,
							'easing' : this.easing,
						},
		})
	);
	this.canvas.addSprite(sprite);	
}

PainterZoomInEffect.prototype.colorZoomInEffect = function(img, cx, cy, x, y, w, h) {
	// Color zoom in, and then show picture
	var rect = new FillRectSprite(img.avgRed, img.avgGreen,img.avgBlue);
	rect.setSize(img.img.width,img.img.height);
	rect.setPosition(this.picX + cx, this.picY + cy);
	rect.setScaleAsSize(1,1);
	rect.addActor(new AnimateSprite(this.animationTime/2,{
						'x' : {
							'endValue': x,
							'easing' : this.easing,
						},
						'y' : {
							'endValue': y,
							'easing' : this.easing,
						},
						'scaleX' : {
							'endValue' : w/rect.w,
							'easing' : this.easing,
						},
						'scaleY' : {
							'endValue' : h/rect.h,
							'easing' : this.easing,
						},
	}));
	var self = this;
	rect.addActor( new SpriteDrawnCallback(function(sprite) {
		sprite.addActor(new AnimateSprite(self.animationTime/2,{
			'a' : {
							'endValue' : 0,
							'easing' : this.easing,
						}
		}));
		sprite.addActor(new SpriteDrawnCallback(function(s) {
			self.canvas.removeSprites(s);
		}));
		var s = new Sprite(img.img);
		s.setPosition(x, y);
		s.setScale(w/s.w,h/s.h);
		s.setAlpha(0);
		s.addActor(new AnimateSprite(self.animationTime/2,{
			'a' : { 
							'endValue' : 1,
							'easing' : this.easing,
						}
		}));
		self.canvas.addSprite(s);
	}));

	this.canvas.addSprite(rect);	
}


