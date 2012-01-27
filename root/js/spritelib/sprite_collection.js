function SpriteCollection() {
	this.sprites = [];
	this.modified = false;
	this._deletedCount = 0;
	this.deletedSpritesCompactCount = 1000;
}

SpriteCollection.prototype.addSprite = function (sprite) {
	this.modified = true;
	this.sprites.push(sprite);
}
	
SpriteCollection.prototype.removeAll = function() {
	this.sprites = [];
	this.modified = true;
	this._deletedCount = 0;
}

SpriteCollection.prototype.removeSprites = function () {
	for (var i in arguments) {
		var index = this.sprites.indexOf(arguments[i]);
		if (index >= 0) {
			this._deletedCount += 1;
			this.modified = true;
			this.sprites[index] = null;
		}
	}
}

SpriteCollection.prototype.compact = function(force) {
	if(!force && this._deletedSpritesCount < this.deletedSpritesCompactCount) {
		return;
	}
	var a = [];
	for(var i in this.sprites) {
		if(this.sprites[i]) {
			a.push(this.sprites[i]);
		}
	}
	this._deletedSpritesCount = 0;
	this.sprites = a;
}

SpriteCollection.prototype.draw = function (ctx) {
	//var time = new Date().getTime();
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
		s.draw(ctx);
	}
}

SpriteCollection.prototype.applyActors = function (timeDelta) {
	var somethingMoving = false;
	//var time = new Date().getTime();
	for(var i in this.sprites) {
		var s = this.sprites[i];
		if(!s) {
			continue;
		}
		somethingMoving = s.applyActor(timeDelta) || somethingMoving ;
	}
	return somethingMoving;
}
