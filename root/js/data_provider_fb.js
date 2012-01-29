
function DataProviderFb(fb_app_id, locale) {
	this.fbAppId = fb_app_id;
	this.locale = locale || 'en_US';
	this.events =  new EventHub();
}

DataProviderFb.prototype = {
	userID: null,
	accessToken: null,
	init: function() {
		var fbProvider = this;
		window.fbAsyncInit = function() {
			FB.init({
				appId  : fbProvider.fbAppId,
				status : true, // check login status
				cookie : true, // enable cookies to allow the server to access the session
				xfbml  : true, // parse XFBML
				channelUrl : getSiteLocation() + '/channel.html', // channel.html file
				oauth  : true // enable OAuth 2.0
			});
			fbProvider.events.trigger('fetchingStatus');
			FB.getLoginStatus(function(response) {
				if (!response || response.error) {
					fbProvider.events.trigger('error', response ? response.error : undefined);
				}
				fbProvider.onLoginStatus(response);
				// if we are not logged in add handler to listen for authChage
				if( !response.authResponse ) {
					FB.Event.subscribe('auth.authResponseChange', function(response) {
						fbProvider.onLoginStatus(response);
					});
				}
			});
		};
		(function(d, s, id) {
			var js, fjs = d.getElementsByTagName(s)[0];
			if (d.getElementById(id)) return;
			js = d.createElement(s); js.id = id;
			js.src = "//connect.facebook.net/" + fbProvider.locale + "/all.js#xfbml=1&appId=" + fbProvider.fbAppId;
			fjs.parentNode.insertBefore(js, fjs);
		}(document, 'script', 'facebook-jssdk'))

	},

	loggedIn: false,
	onLoginStatus: function fbLoginStatus(response) {;
		if (response.authResponse) {
			this.userID = response.authResponse.userID;
			this.loggedIn = true;
			this.accessToken = response.authResponse.accessToken
		} else {
			this.userID = null;
			this.loggedIn = false;
			this.accessToken = null;
		}
		this.events.trigger('statusAvailable');
	},
	
	
	on: function (event, callback, context) {
		this.events.on(event, callback, context);
	},

	_picURL: function(id) {
		return 'http://graph.facebook.com/' + id+ '/picture';
	},
	selfPicture : function() {
		return this._picURL(this.userID);
	},
	
	fetchPictureList: function() {
		var offset = 0;
		var limit = 10000;
		var self = this;
		var loadNextChunk = function () {
			FB.api('/me/friends?fields=name,picture&limit=' + limit + '&offset=' + offset, function(response) {
				if (!response || response.error) {
					self.events.trigger('error', response ? response.error : undefined);
				}
				var imgs =[] ;
				for (var i in response.data) {
					imgs.push({
						'domain': 'fb',
						'id' : response.data[i].id,
						//'picture' : response.data[i].picture ? response.data[i].picture : self._picURL(response.data[i].id),
						'picture' : self._picURL(response.data[i].id),
						'name' : response.data[i].name,
						'set' : '_brushes',
					});
				}
				if(imgs.length > 0) {
					self.events.trigger('pictureListChunck', imgs);
				}
				if(response.data.length > 0 && response.data.length >= limit) {
					offset += limit;
					loadNextChunk();
				} else {
					self.events.trigger('pictureListEnd');
				}
			});
		};
		loadNextChunk();
	},

	getPhotoUploadURL: function(includeAccessToken) {
		return 'https://graph.facebook.com/me/photos' 
			+ (includeAccessToken ? '?access_token=' + this.accessToken : '');
	},
	
	tagPhoto: function(photoID, userID, xPerc, yPerc) {
		var self = this;
		var params = {}
		if( xPerc >=0 && xPerc <=100 ){
			params['x']= xPerc;
		}
		if( yPerc >=0 && yPerc <=100 ){
			params['y'] = yPerc;
		}
		params['to'] = userID;
		FB.api('/'+photoID+'/tags', 'POST', params , function(response) {
			if (response != true && response != false) {
				self.events.trigger('error', response ? response.error : undefined);
			}
			self.events.trigger('photoTagged', photoID, userID, response);
		});
	},
	
	getPhotoURL: function(photoID, callback) {
		var self = this;
		FB.api('/'+photoID+'/?fields=link', function(response) {
			callback(photoID, response ? response.link : null);
		});
	},

	getSourcePictureSets : function() {
		var self = this;
		FB.api('/me/albums', function(response) {
			if (!response || response.error) {
				self.events.trigger('error', response ? response.error : undefined);
			}
			var sets = {};
			for(var i in response.data){
				sets[response.data[i].id] = {
					id : response.data[i].id,
					name: response.data[i].name,
					type: (response.data[i].type == 'profile') ? 'main' : 'additional',
					count: response.data[i].count,
				};
			}
			self.events.trigger('sourcePictureSets', sets);
		});	
	},
	
	getSourceSetPictures : function(set) {
		var self = this;
		FB.api('/'+set+'/photos', function(response) {
			if (!response || response.error) {
				self.events.trigger('error', response ? response.error : undefined);
			}
			var imgs =[] ;
			for (var i in response.data) {
				var images = response.data[i].images;
				var minHeight = 999999, index;
				for(var j in images) {
					if( minHeight > images[j].height ) {
						minHeight = images[j].height;
						index = j
					}
				}
				imgs.push({
					'domain': 'fb',
					'id' : response.data[i].id,
					//'picture' : response.data[i].picture ? response.data[i].picture : self._picURL(response.data[i].id),
					'picture' : images[index].source,
					'name' : response.data[i].name,
					'set' : set
				});
			}
			self.events.trigger('sourcePictures', imgs);
		});	
	}	
}
