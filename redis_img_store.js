
function RedisImgStore(url) {
	this.redis = require('redis-url').createClient(url);
	this.expireTime = 240;
}

RedisImgStore.prototype.putImg = function (key, mimeType, imgData, resposeCb) {
	var self=this;
	self.redis.hmset(key,'img', imgData, 'mime', mimeType, function (err, replies) {
		if( err ) {
			console.log("/putImg hmset: ", err);
			resposeCb({"error":err});
		} else {
			resposeCb({"key": key});
			self.redis.expire(key, self.expireTime);
		}
	});
}

RedisImgStore.prototype.getImg = function (key, resposeCb) {
	this.redis.hmget(key, 'img', 'mime', function (err, reply) {
			if( err ) {
				console.log("/getImg/" + key + " hmget: ", err);
				resposeCb({"error":err});
			} else if(reply[0]){
				resposeCb({'data': reply[0], 'mimeType': reply[1]});
			} else {
				console.log("/getImg/" + key + " hmget: "+ "Does not exist");
				resposeCb({"error":"Does not exist"});
			}
	});
}

RedisImgStore.prototype.delImg = function (key, resposeCb) {
	this.redis.del(key, function (err, reply) {
			if( err ) {
				console.log("/delImg/" + key + " del: ", err);
				resposeCb({"error":err});
			} else {
				resposeCb({"success":true});
			}
	});
}

module.exports.createStore = function (url) {
	return new RedisImgStore(url);
}

