debugLog = function () {
    if (window.console != undefined) {
        console.log.apply(this,arguments);
    }
}

// Workaround problem with Chrome and console.log.apply()
if($.browser.webkit || $.browser.msie) {
	debugLog = function () {
		  if (window.console != undefined) {
		  		var a = [];
		  		for(var i=0;i<arguments.length;++i){
		  			a.push("arguments["+i+"]");
		  		}
		  		eval("console.log(" + a.join(",") + ")");
		  }
	}
}


function copyPrototype(descendant, parent) {
    var sConstructor = parent.toString();
    var aMatch = sConstructor.match( /\s*function (.*)\(/ );
    if ( aMatch != null ) { descendant.prototype[aMatch[1]] = parent; }
    for (var m in parent.prototype) {
        descendant.prototype[m] = parent.prototype[m];
    }
}

function actionPages(id, activePage) {
	activePage = activePage || 0;
	if( typeof activePage == "number") {
		$(id).children().each(function(index){
			if( index == activePage){
				$(this).show();
			} else {
				$(this).hide();
			}
		});
	} else {
		$(id).children(activePage).show();
		$(id).children().not(activePage).hide();
	}
}

function randomInt(max,min)  {  
	min = min || 0;
	return Math.floor(Math.random() * (max - min + 1)) + min;  
}

function fitImage(img, maxW, maxH){
	var w, h;
	if( img.width > img.height ){
		if( img.width > maxW ){
			w = maxW;
			h = Math.round(img.height * (maxW/img.width));
		} else {
			w = img.width;
			h = img.height;
		}
	} else {
		if( img.height > maxH ){
			w = Math.round(img.width  * (maxH/img.height));
			h = maxH;
		} else {
			w = img.width;
			h = img.height;
		}
	}
	return { width: w, height: h};
}

function getScrollerWidth() {
	if( ! this.__vvCACHED_SCROLLBAR_WIDTHvv__ ){
    var scr = null;
    var inn = null;
    var wNoScroll = 0;
    var wScroll = 0;

    // Outer scrolling div
    scr = document.createElement('div');
    scr.style.position = 'absolute';
    scr.style.top = '-1000px';
    scr.style.left = '-1000px';
    scr.style.width = '100px';
    scr.style.height = '50px';
    // Start with no scrollbar
    scr.style.overflow = 'hidden';

    // Inner content div
    inn = document.createElement('div');
    inn.style.width = '100%';
    inn.style.height = '200px';

    // Put the inner div in the scrolling div
    scr.appendChild(inn);
    // Append the scrolling div to the doc
    document.body.appendChild(scr);

    // Width of the inner div sans scrollbar
    wNoScroll = inn.offsetWidth;
    // Add the scrollbar
    scr.style.overflow = 'auto';
    // Width of the inner div width scrollbar
    wScroll = inn.offsetWidth;

    // Remove the scrolling div from the doc
    document.body.removeChild(
        document.body.lastChild);

    // Pixel width of the scroller
    this.__vvCACHED_SCROLLBAR_WIDTHvv__ =  (wNoScroll - wScroll);
  }
  return this.__vvCACHED_SCROLLBAR_WIDTHvv__;
}

function getSiteLocation(){
	var l = window.location;
	return  l.protocol + '//' + l.host;
}

function hasCORSXMLHttpRequest(){
	if(this.__hasCORSXMLHttpRequest == undefined){
		this.__hasCORSXMLHttpRequest = ("withCredentials" in (new XMLHttpRequest()));
	}
	return this.__hasCORSXMLHttpRequest;
}

function fisherYates(myArray) {
  var i = myArray.length;
  if ( i == 0 ) return false;
  while ( --i ) {
     var j = Math.floor( Math.random() * ( i + 1 ) );
     var tempi = myArray[i];
     var tempj = myArray[j];
     myArray[i] = tempj;
     myArray[j] = tempi;
   }
}
