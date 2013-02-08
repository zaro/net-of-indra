var canvas ;
var brushPalete;
var painter;

function saveImageMimeType() {
	return 'image/jpeg';
}

function saveImageToDisk() {
	var mimeType = saveImageMimeType();
	var data = canvas.obj.toDataURL(mimeType);
	var r= painter.getCurrentPicSize();
	r.width*=4;
	r.height*=4;
	var ri = fitImage(r, 200, 200);
	$('#imageToSave').attr('src', data);
	$('#imageToSave').attr('width', ri.width);
	$('#imageToSave').attr('height', ri.height);
	var dialog = $('#imageSavePane');
	dialog.dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		draggable: true,
	  close: function(event, ui) {
	  	$('#imageToSave').attr('src','data:,');
	  },
	});
	$('#imgSaveClose').button().unbind('click').bind('click', function() {
		dialog.dialog( "close" );
	});
	dialog.dialog( "open" );
}



function uploadToFacebook() {
	var uploading = false;
	if(!(MultiPartFormData.supported() || hasCORSXMLHttpRequest() )) {
		$('#noSendBinaryWarningDiv').show();
	}
	actionPages('#uploadToFBActions', '#pictureCommentDiv');
	var onPostCommentClicked = function() {
		if($('#postComment').is(':checked')){
			$('#pictureComment').removeAttr("disabled");
		} else {
			$('#pictureComment').attr("disabled", true);
		}
	};

	$('#postComment').unbind('click').bind('click', onPostCommentClicked);
	onPostCommentClicked();
	$('#closeUpload').button();
	$('#errorCloseUpload').button();
	var _thisSite = getSiteLocation();
	if( $('#pictureComment').text().indexOf(_thisSite) <0){
		$('#pictureComment').text($('#pictureComment').text() + ' ' + _thisSite);
	}
	$('#postTags').attr('checked', false);
	$('#tagProgress').progressbar();
	$('#uploadPicture').button().unbind('click').bind('click', function() {
		var comment = null;
		var tags = null;
		if( $('#postComment').is(':checked') ) {
			comment = $('#pictureComment').val();
		}
		if( $('#postTags').is(':checked') ) {
			tags = painter.getUsersList();
		}
		actionPages('#uploadToFBActions','#uploadIndicator');
		uploading = true;
		try {
			var postFunc;
			if(MultiPartFormData.supported()){
				postFunc = postToFacebookViaXMLHTTPRequest;
			} else {
				postFunc = postToFacebookViaURL;
			}
			postFunc(comment, null,
				function (response) {
					$('#uploadedPicUrl').attr('href', '#');
					$('#makeProfilePicUrl').attr('href', '#');
					dataProvider.getPhotoURL(response.id, function(photoID, link) {
						$('#uploadedPicUrl').attr('href', link);
						$('#makeProfilePicUrl').attr('href', link + '&makeprofile=1');
					});
					var uploadDone = function () {
						dataProvider.on('error', null);
						dataProvider.on('photoTagged', null);				
						actionPages('#uploadToFBActions','#uploadDone');
						uploading = false;
					};
					if( tags ){
						actionPages('#uploadToFBActions','#tagIndicator')
						var allTagIDs = Object.keys(tags);
						// Randomize array and get only the first 50 elements
						// as facebook allow 50 tags per picture
						fisherYates(allTagIDs);
						allTagIDs = allTagIDs.slice(0,50);
						var numTags = allTagIDs.length;
						var tagged = 0;
						var tagDone = function() {
							tagged += 1;
							$('#tagProgress').progressbar( "option", "value", 100*tagged/numTags );
							if(tagged == numTags) {
								uploadDone();
							}
						};
						dataProvider.on('error',function( error ){
							tagDone();
							//actionPages('#uploadToFBActions','#uploadError');
							//$('#uploadErrorText').text(error);
						});
						dataProvider.on('photoTagged',function( photoId, userID, response){
							tagDone();
						});
						var count = 0;
						var x=0, y=0, tag;
						for( var t in allTagIDs ){
							tagID = allTagIDs[t];
							x=0|(Math.random()*90), y=0|(Math.random()*90);
							// Non delayed tagging
							dataProvider.tagPhoto(response.id, tagID, x, y);

							// Delayed tagging
							/*
							var f = (function(tag,xp, yp) {
									return function() {
										dataProvider.tagPhoto(response.id, tag, xp, yp);
									}
								})(tagID,x,y);

							setTimeout( f, count*1000);
							count += 1;
							*/
						}
					} else {
						uploadDone();
					}
				}, function (data, error){
					actionPages('#uploadToFBActions','#uploadError');
					var r;
					if( typeof(data) == 'object'){
						r = data;
					} else {
						try {
							r = JSON.parse(data);
						} catch(e) {
						}
					}
					if(r && r.error) {
						error = r.error.message;
					}
					$('#uploadErrorText').text(error);
					uploading = false;
				}
			);
		} catch(e) {
			actionPages('#uploadToFBActions','#uploadError');
			$('#uploadErrorText').text(e.name + ' : ' + e.message);
			uploading = false;
		}
	});
	var dialog = $('#uploadToFBPane');
	dialog.dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		draggable: true,
		beforeClose: function(event, ui) {
			return !uploading;
		}
	});
	$('#closeUpload').button().unbind('click').bind('click', function() {
		dialog.dialog( "close" );
	});
	$('#errorCloseUpload').button().unbind('click').bind('click', function() {
		dialog.dialog( "close" );
	});
	dialog.dialog( "open" );
}

function postToFacebookViaXMLHTTPRequest(comment,tags,onSuccess, onError) {
	var mimeType = saveImageMimeType();
	var form= new MultiPartFormData();
	var imgDataURL=canvas.obj.toDataURL(mimeType);
	var urlSchema = 'data:' + mimeType + ';base64,';
	var imgData = imgDataURL.substr(urlSchema.length);
	form.addField('access_token', dataProvider.accessToken );
	//form.addBase64File('source', imgData, mimeType);
	form.addBase64File('image', imgData, mimeType);
	//form.addField('album', '272172049499624');
	if( comment ) {
		form.addTextField('message', comment);
	}
	if( tags ) {
		// It seems this is not working for now
		form.addField('tags', JSON.stringify(tags));
	}
	form.post( dataProvider.getPhotoUploadURL(),
			function (data, status) {
	  		onSuccess(JSON.parse(data));			
			},
			function (data, status) {
				onError(data, status);
	  		debugLog("uploading to FB error: " + data + "/" + status);
			}
	);
}

function postToFacebookViaURL(comment,tags,onSuccess, onError) {
	var imgDataURL=canvas.obj.toDataURL(saveImageMimeType()),
			imgUr = new ImgUr();
	var urlSchema = 'data:' + saveImageMimeType() + ';base64,';
	imgUr.uploadImg('http://indra-net.me reflection',imgDataURL.substr(urlSchema.length),
		// Success 	
		function(data) {
			if(data.url) {
				FB.api('/' + dataProvider.userID + '/photos', 'post', {
						message: comment ,
						url: data.url,       
				}, function(response){
					imgUr.deleteImg(data.deleteKey);
					if (!response || response.error) {
							onError(response, response.error.message);
					} else {
							onSuccess(response);
					}
				});			
			} else {
				onError('Failed to get ImgUr URL','???');
			}
		},
		// Error
		onError
	);
}

function postToFacebookViaURL_OLD(comment,tags,onSuccess, onError) {
	var imgDataURL=canvas.obj.toDataURL(saveImageMimeType());
	var key = 'fb-' + dataProvider.userID;
	$.post("/putImg",{ "data" : imgDataURL, "userid": key }, function (data, textStatus, jqXHR) {
		if( data.error ){
			onError(null, data.error);
		} else {
			var imgURL = getSiteLocation() + "/getImg/" + data.key;

			FB.api('/' + dataProvider.userID + '/photos', 'post', {
					message: comment ,
					url: imgURL,       
			}, function(response){
					$.getJSON("/delImg/" + data.key, function(data) {
						
					});
					
					if (!response || response.error) {
							onError(null, response.error);
					} else {
							onSuccess(response);
					}

			});
		} 
	}, 'json');
}

function startApplication(){
	$('#saveImg').button().click(saveImageToDisk);
	$('#fbUpload').button().click(uploadToFacebook);
	$('#seeMoreAbout').button().click(function(){
		$('#aboutPagePane').dialog({
				modal: true,
				minHeight : 400,
				minWidth  : 400,
				resize: function() {
					$( "#aboutPageAccordion" ).accordion( "resize" );
				}				
		});
		$('#aboutPageAccordion').accordion({
			fillSpace: true,
			icons: false,
		});
		$('#aboutPagePane').dialog('option', 'position', 'center');
	});
	canvas = new Canvas('picCanvas');
	var pictureChooser = new PictureChooser('#sourcePictures','#albumSelectBox');
	var imageLoadPreview = new ImageLoadPreview();
	canvas.addSprite(imageLoadPreview);
	brushPalete = new BrushPalete(canvas);
	painter = new ThePainter(canvas, brushPalete);
	var uinfo = {
		name: '',
		domain: 'fb',
		id: '',
		picture: dataProvider.selfPicture() ,		
	};
	painter.loadPicturesBegin();
	painter.loadPictures([uinfo]);
	painter.loadPicturesEnd();
	pictureChooser.setPictureSource(painter);

	ImageLoader.getLoader().onProgressUpdate(imageLoadPreview.updateProgress, imageLoadPreview);
	var resizeCanvas = function (tileW, tileH, noRedraw) {
		var tilesX =50 ,tilesY=50;
		var p = painter.getCurrentPicSize();
		if( p ) {
			tilesX = p.width;
			tilesY = p.height;
		}
		if( (tilesX * tileW) != canvas.width() || (tilesY * tileH) != canvas.height()){
			canvas.setSize(tilesX * tileW,tilesY * tileH);
			$(window).resize();
		}
		canvas.clear();
		painter.tileWidth = tileW;
		painter.tileHeight = tileH;
		if( !noRedraw ) {
			painter.drawPicture();
		}
	};
	
	$('#picSizeSmall').click(function() {
		resizeCanvas(10,10);
	}).filter('[checked="checked"]').click();
	$('#picSizeLarge').click(function() {
		resizeCanvas(25,25);
	}).filter('[checked="checked"]').click();
	$('#picSizeHuge').click(function() {
		resizeCanvas(50,50);
	}).filter('[checked="checked"]').click();

	imageLoadPreview.setSize(canvas.width(),canvas.height());
	
	$('#blurRadius').bind( "slidestop", function(event, ui) {
		canvas.setBlurRadius(ui.value);
		canvas.drawScene();
	});

	//brushPalete.resize();
	actionPages('#picControlsPane','#pcImagesLoading');
	$(window).resize();
	brushPalete.loadBrushesBegin(imageLoadPreview);
	dataProvider.on('pictureListChunck', function (picList) {
		brushPalete.loadBrushes(picList);
	});
	dataProvider.on('pictureListEnd', function (picList) {
		brushPalete.loadBrushesEnd();
	});
	dataProvider.fetchPictureList();
	dataProvider.on('sourcePictureSets', pictureChooser.updatePictureSets, pictureChooser);	
	dataProvider.getSourcePictureSets();
	ImageLoader.getLoader().onAllDone(function() {
		pictureChooser.endLoadingSet();
	});		
	dataProvider.on('sourcePictures', function(picList) {
		painter.loadPicturesBegin();
		painter.loadPictures(picList);
		painter.loadPicturesEnd();

	});
	var loadAlbum = function(set) {
		set = set || pictureChooser.getSelectedPictureSet();
		var loadedCount = painter.numPicturesInSet(set);
		var toLoadCount = pictureChooser.numPicturesInSet(set);
		if( toLoadCount != undefined && loadedCount != toLoadCount){
			pictureChooser.beginLoadingSet();
			dataProvider.getSourceSetPictures(set);
		} else {
			pictureChooser.beginLoadingSet();
			pictureChooser.endLoadingSet();
		}
	}
	var loadPicture = function(picId){
		painter.setCurrentPicture(pictureChooser.getSelectedPictureSet(), picId);
		resizeCanvas(painter.tileWidth, painter.tileHeight, true);		
		painter.paint();
	}
	
	pictureChooser.onSetSelected = loadAlbum;
	pictureChooser.onPictureSelected = loadPicture;
	
	
	var allDone = function() {
		actionPages('#picControlsPane','#picControls');
		if(typeof gapi != "undefined"){
			gapi.plusone.go();
		}
		pictureChooser.init();		
		$(window).resize();
		painter.initBrushes();
		painter.paint();
		//painter.drawPicture();
		loadAlbum();
		ImageLoader.getLoader().offAllDone(allDone);
		ImageLoader.getLoader().offProgressUpdate(imageLoadPreview.updateProgress);
	};
	ImageLoader.getLoader().onAllDone(allDone);

	var paintProgress = new ProgressBar(0);
	paintProgress.text  = false;
	painter.onStartPaint(function() {		
		canvas.removeAllSprites();
		canvas.clear();
		canvas.addSprite(paintProgress);
		paintProgress.setBox(0,0,canvas.width(),50);
		paintProgress.value = 0;
	});	

	painter.onPaintProgress(function(done, total) {
		paintProgress.value = done/total;
		canvas.drawSprite(paintProgress);
	});

	painter.onEndPaint(function() {
		canvas.removeSprites(paintProgress);
		painter.drawPicture();
	});
}


function fbLoginStatus(dataProvider) {
	if (dataProvider.loggedIn) {
		$("#fbLogin").hide();
		$("#enterButton").button().show().position({
			my : 'center',
			at : 'center',
			of : '#enterButtons',
		}).click(function() {
			$('#greetingMessagePane').dialog('close');
			startApplication();
		});
		$('#greetingMessagePane').dialog('option', 'position', 'center')
	} else {
		$("#fbLogin").show();
	}
}

var dataProvider;

function loadApplication(appConfig) {
	// Browser detect
	var recentBrowser = false;
	recentBrowser = recentBrowser || ($.browser.mozilla && (parseFloat($.browser.version) >= 2.0));
	recentBrowser = recentBrowser || (($.browser.webkit || $.browser.safari) && (parseFloat($.browser.version) >= 534.0));
	recentBrowser = recentBrowser || ($.browser.msie && (parseFloat($.browser.version) >= 9.0));
	recentBrowser = recentBrowser || ($.browser.opera && (parseFloat($.browser.version) >= 11.5));
	if(!recentBrowser){
		$('#oldBrowserButton').button().click(function () {
			actionPages('#greetingMessagePane','#greetingMessage');
			$(window).resize();
		});
		actionPages('#greetingMessagePane','#browserWarning');
	}
	
	var language = CfgStore.getKey("lang");
	if(!language) {
	 language = window.navigator.userLanguage || window.navigator.language;
	}
	$.selectorTranslate.setTranslateSource('#translationsRoot');
	$.selectorTranslate.translate(language);

	actionPages('#picControlsPane','#picControls');
	$('#moreSourcePictures').button({
		icons: {
			primary: "ui-icon-circle-triangle-e"
		},
		text: false
  });
  //$('#albumSelect').selectmenu();

	$('#enterButton').button();
	$('#picSize').buttonset();
	$('#saveImg').button();
	$('#fbUpload').button();
	$('#seeMoreAbout').button();
	$('#blurRadius').slider({
		value:0,
		min: 0,
		max: 10,
		step: 1,
	});
	var langChooser = new LangChooser();
	langChooser.getSelectBox().show();
	$('#greetingMessagePane').dialog({
		minHeight: 300,
		autoOpen: false,
		modal: true,
		resizable: false,
		draggable: false,
		closeOnEscape: false,
	});
	$('#greetingMessagePane').parent().children('.ui-dialog-titlebar').remove();			
	$('#greetingMessagePane').dialog( "open" )
	langChooser.getSelectBox().selectmenu();
	$('#enterButton').hide().css('visibility','visible');

	$(window).resize(function(){

		var lDiv=$('#mainDiv');
		lDiv.width( 
			$("body").width()
				-parseInt(lDiv.css("border-left-width"))
				-parseInt(lDiv.css("border-right-width"))
				-parseInt(lDiv.css("margin-left"))
				-parseInt(lDiv.css("margin-right"))
		);
		lDiv.height( 
			$("body").height()
				-parseInt(lDiv.css("border-top-width"))
				-parseInt(lDiv.css("border-bottom-width"))
				-parseInt(lDiv.css("margin-top"))
				-parseInt(lDiv.css("margin-bottom"))
		);

		var pc = $('#picControlsPane');
		var cs=$('#canvasScroll');
		var canv = $('#picCanvas');
		var posBoxW = Math.floor(lDiv.width() * 0.97);
		var posBoxH = Math.floor(lDiv.height() * 0.97);
		var posBoxX = Math.floor((lDiv.width() - posBoxW)/2);
		var posBoxY = Math.floor((lDiv.height() - posBoxH)/2);
		var pcWidth = 
				pc.width() 
				+parseInt(pc.css("border-left-width"))
				+parseInt(pc.css("border-right-width"))
				+parseInt(pc.css("margin-left"))
				+parseInt(pc.css("margin-right"))
				+parseInt(pc.css("padding-left"))
				+parseInt(pc.css("padding-right"));
		var csWidth = 
				+ cs.width()
				+parseInt(cs.css("border-left-width"))
				+parseInt(cs.css("border-right-width"))
				+parseInt(cs.css("margin-left"))
				+parseInt(cs.css("margin-right"))
				+parseInt(cs.css("padding-left"))
				+parseInt(cs.css("padding-right"));
		var pcHeight = 
				pc.height()
				+parseInt(pc.css("border-top-width"))
				+parseInt(pc.css("border-bottom-width"))
				+parseInt(pc.css("margin-top"))
				+parseInt(pc.css("margin-bottom"))
				+parseInt(pc.css("padding-top"))
				+parseInt(pc.css("padding-bottom"));
		var csHeight = 
				cs.height()
				+parseInt(cs.css("border-top-width"))
				+parseInt(cs.css("border-bottom-width"))
				+parseInt(cs.css("margin-top"))
				+parseInt(cs.css("margin-bottom"))
				+parseInt(cs.css("padding-top"))
				+parseInt(cs.css("padding-bottom"));
				
		var centerBoxW = pcWidth + csWidth;
		var centerBoxH = pcHeight > csHeight ? pcHeight : csHeight ;
		var centerBoxX = Math.floor((posBoxW - centerBoxW)/2);
		var centerBoxY = Math.floor((posBoxH - centerBoxH)/2);
		if(centerBoxX < 0){
			centerBoxX = 0;
		}
		if(centerBoxY < 0){
			centerBoxY = 0;
		}
		pc.css({
			'max-height' : posBoxH,
		});;
		var csMaxWidth = posBoxW - pcWidth; 
		var canvVscroll = canv.height() > cs.height(),
				canvHscroll = canv.width() > cs.width();
		if (canvVscroll && canvHscroll) {
			cs.css({'min-height': '', 'min-width': '' });
		}else if (canvVscroll) {
			if( canv.width() < csMaxWidth ){
				cs.css({'min-width': canv.width() + getScrollerWidth() });
			} else {
				cs.css({'min-width': '' });
			}
			cs.css({'min-height': '' });
		} else if (canvHscroll) {
			if( canv.height() < posBoxH ){
				cs.css({'min-height': canv.height() + getScrollerWidth() });
			} else {
				cs.css({'min-height': '' });
			}
			cs.css({'min-width': '' });
		}
		cs.css({
			'max-width' : csMaxWidth,
			'max-height' : posBoxH,
		});
		pc.position({
			my : 'left top',
			at : 'left top',
			of : lDiv,
			collision : 'none',			
			offset: (centerBoxX + posBoxX) + ' ' + (centerBoxY + posBoxY),
		});			
		cs.position({
			my : 'left top',
			at : 'left top',
			of : lDiv,
			collision : 'none',
			offset: (pcWidth + centerBoxX +posBoxX) + ' ' + (centerBoxY + posBoxY),
		});
		
		var centeredDialogs = ['#greetingMessagePane', '#imageSavePane', '#uploadToFBPane', '#aboutPagePane'];
		for( var i in centeredDialogs) {
			// Center the dialog if it is visible
			$(centeredDialogs[i]).filter(":visible").dialog('option', 'position', 'center');
		}
	});

	$(document).ready( function() {
		$('#mainDiv').show();
		$(window).resize();
	  //$('#albumSelect').selectmenu();
	});
	debugLog("Application starting...");
	var loginSpinner = new LoginSpinner('#spinner');
	dataProvider = new DataProviderFb(appConfig.FB_APP_ID,appConfig.currentLang);
	dataProvider.on('fetchingStatus', loginSpinner.incUse, loginSpinner);
	dataProvider.on('statusAvailable', function() {
		loginSpinner.decUse();
		fbLoginStatus(dataProvider);
	});
	dataProvider.init();
}

