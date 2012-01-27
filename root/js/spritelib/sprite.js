function Canvas(id) {
	this.canvasID = id;
	this.obj = document.getElementById(id);
	if (this.obj.getContext) {
		this.context = this.obj.getContext('2d');
	}
	this.sprites = [];
	this.animateIntervalId = undefined;
	this.translateX = 0;
	this.translateY = 0;
	this.scale = 1;
	this.animationRunning = false;
	this.blurRadius = 0;
	//this.spritesModified = false;
	this.clearCanvasOnFrame = true;
	//this._deletedSpritesCount = 0;
	//this.deletedSpritesCompactCount = 1000;
	this.spritesCollection = new SpriteCollection();
  // shim layer with setTimeout fallback
	window.requestAnimFrame = (function(){
		return  window.requestAnimationFrame       || 
						window.webkitRequestAnimationFrame || 
						window.mozRequestAnimationFrame    || 
						window.oRequestAnimationFrame      || 
						window.msRequestAnimationFrame     || 
						function(/* function */ callback, /* DOMElement */ element){
							return window.setTimeout(callback, 1000 / 60);
						};
	})();	
}

Canvas.prototype = {
	setSize : function (x,y) {
		this.obj.width = x ? x : this.obj.parentNode.scrollWidth;
		this.obj.height = y ? y : this.obj.parentNode.scrollHeight;
	},
	
	width : function() {
		return this.obj.width;
	},

	height : function() {
		return this.obj.height;
	},
	
	clear : function () {
		this.context.clearRect(0, 0, this.obj.width, this.obj.height);
	},

	setBlurRadius: function(radius) {
		this.blurRadius = radius;
	},

	startAnimation : function () {
		if ( !this.animationRunning ) {
			var canvas = this;
			this.animationRunning = true;
			this.somethingMoving = true;
			this.lastRenderEnd = new Date().getTime();
			debugLog("Starting animation at " + new Date().getTime());
			requestAnimFrame(function(time) {
				canvas.animationTimerTick();
			},this.obj);
		}
	},
	
	animationTimerTick: function(obj) {
		var delta = new Date().getTime() - this.lastRenderEnd;
		this.lastRenderEnd += delta;		
		var animationRunning = this.animationRunning;

		this.drawScene(delta);

		if( !animationRunning ) {
			return;
		}		
		var canvas = this;
		requestAnimFrame(function(time) {
				canvas.animationTimerTick();
		},this.obj);
	},
	
	stopAnimation : function () {
		this.animationRunning = false;
		debugLog("Request stop animation at " + new Date().getTime());
	},
	
	resetAnimationTime : function () {
		this.lastRenderEnd = new Date().getTime();
	},

	drawScene: function(timeDelta) {
		if(this.clearCanvasOnFrame){
			this.clear();
		}
		this.context.save();
		this.context.scale(this.scale, this.scale);
		this.context.translate( this.translateX, this.translateY);
		//this.spritesModified = false;
		var time = new Date().getTime();
		/*
		for(var i in this.sprites) {
			var s = this.sprites[i];
			if(!s) {
				continue;
			}
			//debugLog("Draw %o at %i,%i sid:%i a:%f time: ", s, s.x, s.y, s.sid, s.a, time);
			//if(( s.x >= 0 && s.x <10) && ( s.y >= 0 && s.y <10)  ){
			//	debugLog("Draw %o at %i,%i sid:%i a:%f time: ", s, s.x, s.y, s.sid, s.a, time);
			//	debugLog("  scaleX:%f scaleY:%f : ", s.scaleX, s.scaleY);
			//}
			s.draw(this.context);
			somethingMoving = s.applyActor(timeDelta) || somethingMoving ;
		}
		*/
		//console.profile('draw');
		this.spritesCollection.modified = false;
		this.spritesCollection.draw(this.context);
		var somethingMoving = this.spritesCollection.applyActors(timeDelta);
		//console.profileEnd();
		//debugLog("Draw time: ", new Date().getTime() - time);		
		this.context.restore();
		if (!this.somethingMoving && !this.spritesCollection.modified) {
			if(this.blurRadius >= 1){
				stackBlurCanvasRGB(this.canvasID, 0, 0, this.obj.width, this.obj.height, this.blurRadius);
			}
			this.stopAnimation();
		}
		this.somethingMoving = somethingMoving;
		this.spritesCollection.compact();
		/*
		if( this._deletedSpritesCount >= this.deletedSpritesCompactCount) {
			debugLog("Compacting sprite array with size:" + this.sprites.length);
			this._spriteArrayCompact();
			debugLog("  New size:" + this.sprites.length);
		}
		*/
	},

	drawSprite: function (sprite) {
		this.context.save();	
		this.context.scale(this.scale, this.scale);
		this.context.translate( this.translateX, this.translateY);
		sprite.draw(this.context);
		this.context.restore();		
	},
	
	addSprite: function (sprite) {
		//this.spritesModified = true;
		//this.sprites.push(sprite);
		this.spritesCollection.addSprite(sprite);
	},
	
	removeSprites: function () {
		this.spritesCollection.removeSprites.apply(this.spritesCollection,arguments);
		/*
		for (var i in arguments) {
			var index = this.sprites.indexOf(arguments[i]);
			if (index >= 0) {
				this._deletedSpritesCount += 1;
				this.spritesModified = true;
				//this.sprites.splice(index,1);
				this.sprites[index] = null;
			}
		}
		*/
	},
	
	removeAllSprites: function() {
		this.spritesCollection.removeAll();
		/*
		this.spritesModified = true;
		this._deletedSpritesCount = 0;
		this.sprites = [];
		*/
	},
	
	/*
	_spriteArrayCompact : function() {
		var a = [];
		for(var i in this.sprites) {
			if(this.sprites[i]) {
				a.push(this.sprites[i]);
			}
		}
		this._deletedSpritesCount = 0;
		this.sprites = a;
	},
	*/
	
	// Panning and zooming

	updateMousePos:	function (evt){
			// get canvas position
			var obj = this.obj;
			var top = 0;
			var left = 0;
			while (obj.tagName != 'BODY') {
			    top += obj.offsetTop;
			    left += obj.offsetLeft;
			    obj = obj.offsetParent;
			}
	 
			this.mouseX = evt.clientX - left + window.pageXOffset;
			this.mouseY = evt.clientY - top + window.pageYOffset;
	},
	
	enablePanAndZoom: function () {
		var self = this;
		var onMouseMove = function (event) {
			self.updateMousePos(event);
			self.doPan();
		};
		var dragEnd = function (event) {
			self.obj.removeEventListener('mousemove', onMouseMove);
			self.translateX += self.mouseX - self.startMouseX;
			self.translateY += self.mouseY - self.startMouseY;
		};
		var mouseWheelHandler = function (event){
        var delta = 0;
        if (!event) event = window.event;
        if (event.wheelDelta) {
		      delta = event.wheelDelta/120;
		      if (window.opera) delta = -delta;
        } else if (event.detail) {
          delta = -event.detail/3;
        }
        if (delta) {
            self.doZoom(delta);
        };
		};
		
		this.obj.addEventListener('mousedown', function (event) {
			self.updateMousePos(event);
			self.startMouseX = self.mouseX;
			self.startMouseY = self.mouseY;
			self.obj.addEventListener('mousemove', onMouseMove);
		}); 
		this.obj.addEventListener('mouseup',dragEnd); 
		this.obj.addEventListener('mouseout',dragEnd); 
		this.obj.addEventListener('mousewheel',mouseWheelHandler); 
		this.obj.addEventListener('DOMMouseScroll',mouseWheelHandler); 
	},
	
	doPan : function() {
		var tx = this.translateX;
		var ty = this.translateY;
		this.translateX += this.mouseX - this.startMouseX;
		this.translateY += this.mouseY - this.startMouseY;
		this.drawScene();
		this.translateX = tx;
		this.translateY = ty;
	},
	
	doZoom : function (delta) {
		this.scale += delta/50;
		this.drawScene();
	},
}


function RotateTransformation(angle, angleIsRadians, pivotX, pivotY) {
	if(!angleIsRadians){
		angle = angle * Math.PI / 180;
	}
	this.angle = angle || 0;
	this.pivotX = pivotX || 0;
	this.pivotY = pivotY || 0;
}

RotateTransformation.prototype = {
	apply: function(ctx) {
		ctx.translate(this.pivotX, this.pivotY);
		ctx.rotate(this.angle);
		ctx.translate(-this.pivotX, -this.pivotY);		
	},
}


function SpriteBase() {
	this.x = 0;
	this.y = 0;
	this.w = 0;
	this.h = 0;
	this.a = 1;
	this.scaleX = 1;
	this.scaleY = 1;
	this.rotateAngleRad = 0;
	this.actors = [];
	this.transformations = [];
	this.sid = SpriteBase.prototype.sidGen++;
}

SpriteBase.prototype = {
	sidGen : 0,
	setPosition: function (x,y) {
		this.x = 0|(x+0.5);
		this.y = 0|(y+0.5);
	},

	setSize: function (w,h) {
		this.w = 0|(w+0.5);
		this.h = 0|(h+0.5);
	},
	
	setBox: function(x,y,w,h) {
		this.setPosition(x,y);
		this.setSize(w,h);
	},

	moveBy: function (x,y) {
		this.x = 0|(this.x + x + 0.5);
		this.y = 0|(this.y + y + 0.5);
	
	},

	setRotate : function (angleDeg) {
		this.setRotateRad(angleDeg * Math.PI / 180);
	},

	setRotateRad : function (angleRad) {
		this.rotateAngleRad = angleRad ;
	},

	setScale : function (scaleX, scaleY) {
		this.scaleX = scaleX;
		this.scaleY = scaleY;
	},

	setScaleAsSize : function (scaleXpx, scaleYpx) {
		this.scaleX = scaleXpx/this.w;
		this.scaleY = scaleYpx/this.h;
	},

	setAlpha :  function (a) {
		this.a = a;
	},

	draw: function (ctx) {
		if( this.w == 0 || this.h == 0 || this.scaleX==0 || this.scaleY==0 ) {
			return;
		}
		ctx.save();
		for(var i in this.transformations){
			this.transformations[i].apply(ctx);
		}
		var dw = 0|(this.scaleX * this.w/2);
		var dh = 0|(this.scaleY * this.h/2);
		ctx.translate(this.x + dw, this.y + dh);
		ctx.rotate(this.rotateAngleRad);
		ctx.translate(-dw, -dh);

		ctx.scale(this.scaleX, this.scaleY);
		ctx.globalAlpha = this.a;
		this.doDraw(ctx);
		ctx.restore();
	},

	doDraw: function (ctx) {
	},
	
	applyActor: function(timeDelta) {
		var actor;
		if(actor = this.actors[0]) {
			if (!actor.run(this,timeDelta)){
				actor.end(this);
				this.actors.splice(0,1);
			}
		}
		return this.actors.length > 0;
	},
	
	addActor: function (actor) {
		actor.init(this);
		this.actors.push(actor);
	},
	
	addTransformation:  function(transformation) {
		this.transformations.push(transformation);
	},

	removeTransformation:  function(transformation) {
		var i=this.transformations.indexOf(transformation);
		if( i>=0 ){
			this.transformations.splice(i,1);
		}
	},
}


function Sprite(img) {
	this.SpriteBase();
	this.img = img;
	this.setSize( img.width, img.height );
}

copyPrototype(Sprite, SpriteBase);
 
Sprite.prototype.doDraw = function (ctx) {
	/*
	var s = this;
	if(( s.x >= 0 && s.x <10) && ( s.y >= 0 && s.y <10) && s.scaleX>0 ){
		debugLog("Draw %o at %i,%i sid:%i a:%f ", s, s.x, s.y, s.sid, s.a);
		debugLog("  scaleX:%f scaleY:%f : ", s.scaleX, s.scaleY);
		//ctx.scale(1,1);
	}
	*/
	ctx.drawImage(this.img, 0, 0);
};

function FillRectSprite(r,g,b,a) {
	this.SpriteBase();
	this.r = r || 0;
	this.g = g || 0;
	this.b = b || 0;
	this.a = a || this.a;
}

copyPrototype(FillRectSprite, SpriteBase);
 
FillRectSprite.prototype.doDraw = function (ctx) {
	ctx.fillStyle = 'rgb(' 
		+ (0|this.r) +',' 
		+ (0|this.g) +','
		+ (0|this.b) +')';
	ctx.fillRect(0, 0, this.w, this.h);
};

function ProgressBar(value, padding) {
	this.SpriteBase();
	this.value = value;
	this.padding = padding || 3;
	this.text = true;
}

copyPrototype(ProgressBar, SpriteBase);

ProgressBar.prototype._roundedRect = function(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
      ctx.stroke();
  }
  if (fill) {
      ctx.fill();
  }
  if( this.text ){
		ctx.textAlign = "center";
		ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
		ctx.fillText((Math.floor(this.value*10000)/100) + '%', x+width/2,y+height/2);  
	}
}
	
ProgressBar.prototype._rainbowGradient = function(ctx) {
	if( !this._cachedRainbowGradient ){
		var m = this.h/2;
		var lingrad = ctx.createLinearGradient(0, m, this.w, m);
		lingrad.addColorStop(0, 'rgba(255, 0, 0, 0.62)');
		lingrad.addColorStop(0.16666, 'rgba(255, 121, 0, 0.62)');
		lingrad.addColorStop(0.33333, 'rgba(255, 250, 0, 0.62)');
		lingrad.addColorStop(0.5, 'rgba(0, 255, 0, 0.62)');
		lingrad.addColorStop(0.66666, 'rgba(0, 255, 255, 0.62)');
		lingrad.addColorStop(0.83, 'rgba(0, 0, 255, 0.62)');
		lingrad.addColorStop(1, 'rgba(255, 0, 255, 0.62)');
		this._cachedRainbowGradient = lingrad;
	}
	return this._cachedRainbowGradient;
}

ProgressBar.prototype.doDraw = function (ctx) {
	var padding = this.padding;
	var radius = (this.h - padding*2)/2
	var filledWidth = (this.w - (radius*2)) * this.value;
	ctx.clearRect(0, 0, this.w, this.h);
	ctx.fillStyle = this._rainbowGradient(ctx);
	ctx.strokeStyle =  'rgba(0, 0, 0, 0.4)'
	this._roundedRect(ctx, padding, padding,
												(radius*2) + filledWidth - padding*2, this.h - padding*2,
												radius,true, true );
}



function AnimateProperty(property, endValue, easing) {
	this.property = property;
	this.endValue = endValue;
	this.easing = easing;
}

AnimateProperty.prototype = {
	init: function (obj) {
		this.startValue = obj[this.property];
		this.dV = this.endValue - this.startValue;
	},

	animate: function (obj, currentTime, movementTime) {
		obj[this.property] =  this.easing(undefined, currentTime, this.startValue, this.dV, movementTime);
	},
	
	end: function (obj) {
		obj[this.property] = this.endValue;
	},
}


function AnimateDelay(animateTime, animateDescription) {
	this.animateTime = animateTime;
}

AnimateDelay.prototype.init = function(sprite) {
	this.currentTime = 0;
}

AnimateDelay.prototype.run = function(sprite, timeDelta) {
	this.currentTime += timeDelta;
	return this.currentTime < this.animateTime;
}

AnimateDelay.prototype.end = function(sprite) {
}


function AnimateSprite(animateTime, animateDescription) {
	this.animateTime = animateTime;
	this.animators = [];
	for (var property in animateDescription) {
		var descr = animateDescription[property];
		var easeFunc = easingFunctions[ descr['easing'] || 'easeOutQuad' ];
		var endValue = descr['endValue'] || 0;
		//console.log(' adding %s -> %o ,EV = %f , EF=%o ', property,  descr, endValue, easeFunc);
		this.animators.push(
			new AnimateProperty(property, endValue, easeFunc)
		);
	}
}

AnimateSprite.prototype = {
	init: function (sprite) {
		this.currentTime = 0;
		for(var i in this.animators) {
			this.animators[i].init(sprite);
		}
	},

	run: function (sprite, timeDelta) {
		this.currentTime += timeDelta;
		var t = this.currentTime < this.animateTime ?  this.currentTime : this.animateTime;
		for(var i in this.animators) {
			this.animators[i].animate(sprite, t, this.animateTime);
		}		
		return this.currentTime < this.animateTime;
	},
	
	end: function (sprite) {
		for(var i in this.animators) {
			this.animators[i].end(sprite);
		}
	}
}

function SpriteDrawnCallback(callback) {
	this.callback = callback;
}

SpriteDrawnCallback.prototype = {
	init: function (sprite) {
	},

	run: function (sprite, timeDelta) {
		this.callback(sprite, this.currentTime, this.animateTime);
		return false;
	},
	
	end: function (sprite) {
	}
}

function Point(x,y) {
	this.x = x || 0;
	this.y = y || 0;
}

Point.prototype.distance = function () {
	var x = arguments[0] || 0,
			y = arguments[1] || 0;
	if(x instanceof Point) {
		y = x.y;
		x = x.x;
	}
	return Math.sqrt((this.x-x)*(this.x-x) + (this.y-y)*(this.y-y));
}

Point.prototype.toPolar = function() {
	return new PolarPoint(this.distance(), Math.atan2(this.y, this.x));
}

Point.prototype.moveBy = function(x,y){
	if(x instanceof Point) {
		this.x += x.x;
		this.y += x.y;
	} else {
		this.x += x;
		this.y += y;
	}
}

function PolarPoint(r,a) {
	this.r = r || 0;
	this.a = a || 0;
}

PolarPoint.prototype.toPoint = function() {
	return new Point(this.r*Math.cos(this.a), this.r*Math.sin(this.a));
}

function SpiralPathActor(animateTime, options) {
	this.animateTime = animateTime;
	this.easeFunc = easingFunctions[ options['easing'] || 'easeOutQuad' ];	
	this.numRot = options['numRotations'] || 1;
	this.endX = options['x'];
	this.endY = options['y'];
	var d=options['direction'];
	if(d == 1 || d == -1) {
		this.dir = d;
	} else if(d == 'out') {
		this.dir = 1;
	} else if(d == 'in') {
		this.dir = -1;
	} else{
		this.dir = 1;
	}
}

SpiralPathActor.prototype = {
	init: function (sprite) {
		this.currentTime = 0;
		if(this.dir > 0) {
			this.startPoint = new Point(sprite.x, sprite.y);
		} else {
			this.startPoint = new Point(this.endX, this.endY);
		}
		//var endPoint = new Point(sprite.x - this.endX, sprite.y - this.endY).toPolar();
		var endPoint = new Point(this.dir*(this.endX - sprite.x), this.dir*(this.endY - sprite.y)).toPolar();
		this.dRadius = endPoint.r;
		this.endAngle = endPoint.a;
		this.startRadius = 0;
		this.dAngle = (2*Math.PI*this.numRot);
		this.dCAngle = (2*Math.PI*(1 - this.numRot - Math.floor(this.numRot)));
	},

	run: function (sprite, timeDelta) {
		this.currentTime += timeDelta;
		var t = this.currentTime < this.animateTime ?  this.currentTime : this.animateTime;
		var r = this.easeFunc(undefined, t, (this.dir>0)?0:this.dRadius, this.dir*this.dRadius, this.animateTime)
		var a =  this.endAngle + 
			this.dCAngle + 
			this.easeFunc(undefined,t,(this.dir>0)?0:this.dAngle,this.dir*this.dAngle, this.animateTime );
		var p = new PolarPoint (r,a).toPoint();
		p.moveBy(this.startPoint);
		sprite.setPosition(p.x, p.y);
		return this.currentTime < this.animateTime;
	},
	
	end: function (sprite) {
		sprite.setPosition(this.endX, this.endY);
	}
}

function CompositeActor() {
	this.actors = [];
	for(var i in arguments){
		this.actors.push( arguments[i] );
	}
}

CompositeActor.prototype.init = function(sprite) {
	for(var i in this.actors){
		this.actors[i].init(sprite);
	}
	this.finished = [];
}

CompositeActor.prototype.run = function(sprite, timeDelta) {
	var active = false;
	for(var i in this.actors){
		if(this.actors[i]){
			if(!this.actors[i].run(sprite, timeDelta)){
				this.finished.push(this.actors[i]);
				this.actors[i] = null;
			} else {
				active = true;
			}
		}
	}
	return active;
}

CompositeActor.prototype.end = function(sprite) {
	for(var i in this.finished){
		this.finished[i].end(sprite);
	}
}
