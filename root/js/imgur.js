function ImgUr(){
	this.key = '828697b42c22b2645d01115814c30809';
	if(hasCORSXMLHttpRequest()){
		this.uploadURL = 'http://api.imgur.com/2/upload.json';
		this.deleteURL = 'http://api.imgur.com/2/delete/';
	} else {
		this.uploadURL = getSiteLocation() + '/putImg';
		this.deleteURL = getSiteLocation() + '/delImg/';
	}
}

ImgUr.prototype.uploadImg = function (title, base64Image, resultCallback, errorCallback) {
	$.ajax({
		type: 'POST',
		url: this.uploadURL,
		data: {
			key : this.key,
			image : base64Image,
			//type : 'base64',
			//title : title ,
		},
		success: function(data, textStatus, jqXHR) {
			if(!data || !data.upload) {
				errorCallback("Failed to upload image to ImgUr(maybe site is down.)");
				return;			
			}
			resultCallback({
				url: data.upload.links.original,
				page: data.upload.links.imgur_page,
				key: data.upload.image.hash,
				deleteKey: data.upload.image.deletehash,
			})
		},
		error: function(jqXHR, textStatus, errorThrown){
			errorCallback(textStatus, errorThrown);
		},
		dataType: 'json',
	});
}

ImgUr.prototype.deleteImg = function (deleteKey, resultCallback, errorCallback) {
	$.get(this.deleteURL + deleteKey);
}

