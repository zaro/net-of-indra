function PictureChooser(picListDiv, setsMenuDiv) {
	this.picListDiv = picListDiv;
	this.setsMenuDiv = setsMenuDiv;
	this.pictureSets = {};
	this.loader = new Image();
	this.loader.src = '/load.gif';
	$(this.loader).addClass('spinner');
}

PictureChooser.prototype.init = function() {
	$('#albumSelect').selectmenu();
}

PictureChooser.prototype.updatePictureSets = function(sets) {
	this.pictureSets = sets;
	var optsHtml = '<select id="albumSelect">';
	for(var i in sets){
		var selected = (sets[i].type == 'main') ? 'selected="selected"' : '';
		optsHtml +='<option value="'+sets[i].id+'" ' + selected + '>'+sets[i].name+'</option>';
	}
	optsHtml += '</select>';
	var selMenu = $(optsHtml);
	$(this.setsMenuDiv).empty().append(selMenu);
	var self=this;
	selMenu.bind("change", function(){
		self._setSelected();
	});
}

PictureChooser.prototype.numPicturesInSet = function(set) {
	return this.pictureSets[set] ? this.pictureSets[set].count : undefined;
}

PictureChooser.prototype.getSelectedPictureSet = function() {
	return $('#albumSelect').selectmenu("value");
}

PictureChooser.prototype.setPictureSource = function(picSource) {
	this.pictureSourse = picSource;
}

PictureChooser.prototype.beginLoadingSet = function() {
	$(this.picListDiv).empty().append(this.loader);
	$(window).resize();	
	$('#albumSelect').selectmenu("disable");
}

PictureChooser.prototype.endLoadingSet = function() {
	var pl = $(this.picListDiv).empty();
	var set= this.getSelectedPictureSet();
	// load pictures here
	var pics = this.pictureSourse.getPicturesForSet(this.getSelectedPictureSet());
	var picList = $(this.picListDiv);
	picList.empty();
	var maxW = 50,
			maxH = 50,
			self = this;
	for(var i in pics){
		var img= pics[i].img,
				r = fitImage(img, maxW, maxH);
		var imgBoxHtml = '<div class="sourcePictureBox ui-widget ui-widget-content ui-corner-all">' +
			'<img src="' + img.src + '" width="' + r.width + '" height="' + r.height +'" class="sourcePicture">' +
			'</div>';
		var imgBox = $(imgBoxHtml);
		imgBox.hover(
			function(){ 
				$(this).addClass("ui-state-hover clickable"); 
			},
			function(){ 
				$(this).removeClass("ui-state-hover clickable"); 
			}
		);
		imgBox.click((function(imgId) {
			return function() {
				self.setSelectedPictureSrc(imgId);
			}
		})(pics[i].info.id));
		picList.append(imgBox);
	}
	$('#albumSelect').selectmenu("enable");
	$(window).resize();
}

PictureChooser.prototype._setSelected = function() {
	console.log("Selected set " + this.getSelectedPictureSet());
	if(this.onSetSelected){
		this.onSetSelected(this.getSelectedPictureSet());
	}
}

PictureChooser.prototype.getSelectedPicture = function(){
	return this.selectedPictureId;
}

PictureChooser.prototype.setSelectedPictureSrc = function(imgId){
	this.selectedPictureId = imgId;
	this._pictureSelected();
}

PictureChooser.prototype._pictureSelected = function() {
	console.log("Selected picture " + this.getSelectedPicture());
	if(this.onPictureSelected){
		this.onPictureSelected(this.getSelectedPicture());
	}
}

