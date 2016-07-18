var MultiPartFormData = (function() {

	// Base64 implementation >>
	/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
	 * Version: 1.0
	 * LastModified: Dec 25 1999
	 * This library is free.  You can redistribute it and/or modify it.
	 */

	//var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	var base64DecodeChars = new Array(
		  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
		  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
		  52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
		  -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
		  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
		  -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
		  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

	/*
	function base64encode(str) {
		  var out, i, len;
		  var c1, c2, c3;

		  len = str.length;
		  i = 0;
		  out = "";
		  while(i < len) {
		c1 = str.charCodeAt(i++) & 0xff;
		if(i == len)
		{
			  out += base64EncodeChars.charAt(c1 >> 2);
			  out += base64EncodeChars.charAt((c1 & 0x3) << 4);
			  out += "==";
			  break;
		}
		c2 = str.charCodeAt(i++);
		if(i == len)
		{
			  out += base64EncodeChars.charAt(c1 >> 2);
			  out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
			  out += base64EncodeChars.charAt((c2 & 0xF) << 2);
			  out += "=";
			  break;
		}
		c3 = str.charCodeAt(i++);
		out += base64EncodeChars.charAt(c1 >> 2);
		out += base64EncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
		out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >>6));
		out += base64EncodeChars.charAt(c3 & 0x3F);
		  }
		  return out;
	}
	*/
	function base64decode(str) {
		  var c1, c2, c3, c4;
		  var i, len, out;

		  len = str.length;
		  i = 0;
		  out = "";
		  while(i < len) {
		/* c1 */
		do {
			  c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
		} while(i < len && c1 == -1);
		if(c1 == -1)
			  break;

		/* c2 */
		do {
			  c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
		} while(i < len && c2 == -1);
		if(c2 == -1)
			  break;

		out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

		/* c3 */
		do {
			  c3 = str.charCodeAt(i++) & 0xff;
			  if(c3 == 61)
			return out;
			  c3 = base64DecodeChars[c3];
		} while(i < len && c3 == -1);
		if(c3 == -1)
			  break;

		out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

		/* c4 */
		do {
			  c4 = str.charCodeAt(i++) & 0xff;
			  if(c4 == 61)
			return out;
			  c4 = base64DecodeChars[c4];
		} while(i < len && c4 == -1);
		if(c4 == -1)
			  break;
		out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
		  }
		  return out;
	}
	// Base64 implementation <<

	// UTF8 >>
	/**
	*
	*  UTF-8 data encode / decode
	*  http://www.webtoolkit.info/
	*
	**/

	var Utf8 = {

		// public method for url encoding
		encode : function (string) {
			string = string.replace(/\r\n/g,"\n");
			var utftext = "";

			for (var n = 0; n < string.length; n++) {

				var c = string.charCodeAt(n);

				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}

			}

			return utftext;
		},

		// public method for url decoding
		decode : function (utftext) {
			var string = "";
			var i = 0;
			var c = c1 = c2 = 0;

			while ( i < utftext.length ) {

				c = utftext.charCodeAt(i);

				if (c < 128) {
					string += String.fromCharCode(c);
					i++;
				}
				else if((c > 191) && (c < 224)) {
					c2 = utftext.charCodeAt(i+1);
					string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
					i += 2;
				}
				else {
					c2 = utftext.charCodeAt(i+1);
					c3 = utftext.charCodeAt(i+2);
					string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
					i += 3;
				}

			}

			return string;
		}

	}
	// UTF8 <<

	var multiPartFormData = function () {
		this.finalized = false;
		this.body = '';
		this.boundary =
			'---------------------------MultiPartFormData'
			+ Math.floor(Math.random()*32768)
			+ Math.floor(Math.random()*32768)
			+ Math.floor(Math.random()*32768);

	}
	multiPartFormData.supported = function() {
		return multiPartFormData.hasBlob() || multiPartFormData.hasSendAsBinary() || multiPartFormData.hasBlobBuilder();
	}
	multiPartFormData.hasBlobBuilder = function () {
		return	(typeof WebKitBlobBuilder == "function") ||
				 		(typeof MozKitBlobBuilder == "function") ||
						(typeof MsKitBlobBuilder == "function") ||
						(typeof BlobBuilder == "function") ;
	};
	multiPartFormData.hasSendAsBinary = function () {
		return typeof XMLHttpRequest.prototype.sendAsBinary == "function";
	};
	multiPartFormData.hasBlob = function () {
		return typeof Blob == "function";
	};

	multiPartFormData.prototype = {
		addBase64File: function (name, data, mimeType) {
			var decoded = base64decode(data);
			mimeType = mimeType || 'application/octet-stream';
			this._addField(name, decoded, mimeType );
		},
		addField : function (name, data) {
			this._addField(name, data);
		},
		addTextField : function (name, data) {
			this._addField(name, Utf8.encode(data));
		},
		finalize: function() {
			this.body += '--' + this.boundary + '--\r\n';
			this.finalized = true;
		},
		_addField : function (name, data, mimeType, charEncoding) {
			var field = '';
			var filename = mimeType ? '; filename="some_file"' : '';
			field += '--' + this.boundary + '\r\n';
			field += 'Content-Disposition: form-data; name="' + name + '"' + filename + '\r\n';
			if(mimeType || charEncoding){
				mimeType = mimeType || "text/plain";
				if(charEncoding) {
					mimeType += ';charset=' + charEncoding;
				}
				field += 'Content-Type: ' + mimeType + '\r\n';
			}
			field += '\r\n';
			field += data;
			field += '\r\n';
			this.body += field;
		},
		getContentType: function() {
			return 'multipart/form-data; boundary=' + this.boundary;
		},
		getBody: function() {
			return this.body;
		},
		getBlobBuilder: function () {
			if (typeof WebKitBlobBuilder == "function") {
				return WebKitBlobBuilder;
			}
			if (typeof MozBlobBuilder == "function")  {
				return MozBlobBuilder;
			}
			if (typeof MsBlobBuilder == "function")  {
				return MsBlobBuilder;
			}
			if (typeof BlobBuilder == "function")  {
				return BlobBuilder;
			}
			throw new Error("BlobBuilder not supported by this browser");
		},

		post: function (url, onSuccess, onError){
			if(!this.finalized) {
				this.finalize();
			}
			var xhr = new XMLHttpRequest();
			xhr.open("POST", url, true);
			var data = this.getBody();

			if (multiPartFormData.hasSendAsBinary() ) { // Firefox 3 & 4
				var tmp = '';
				for (var i = 0; i < data.length; i++) tmp += String.fromCharCode(data.charCodeAt(i) & 0xff);
				data = tmp;
			}	else if(multiPartFormData.hasBlobBuilder()) {
				var bbFunc = this.getBlobBuilder();
				// http://javascript0.org/wiki/Portable_sendAsBinary
				XMLHttpRequest.prototype.sendAsBinary = function(text){
					var data = new ArrayBuffer(text.length);
					var ui8a = new Uint8Array(data, 0);
					for (var i = 0; i < text.length; i++) ui8a[i] = (text.charCodeAt(i) & 0xff);

					var bb = new bbFunc();
					bb.append(data);
					var blob = bb.getBlob();
					this.send(blob);
				}
			}	else if(multiPartFormData.hasBlob()) {
				// http://javascript0.org/wiki/Portable_sendAsBinary
				XMLHttpRequest.prototype.sendAsBinary = function(text){
					var data = new ArrayBuffer(text.length);
					var ui8a = new Uint8Array(data, 0);
					for (var i = 0; i < text.length; i++) ui8a[i] = (text.charCodeAt(i) & 0xff);

					var blob = new Blob([data]);
					this.send(blob);
				}
			} else {
				throw new Error('This browser cannot send binary XMLHTTPRequest');
			}

			xhr.onreadystatechange = function (aEvt) {
				if (xhr.readyState == 4) {
					 if (xhr.status == 200) {
						 onSuccess(xhr.responseText, xhr.statusText);
					 }else{
						 onError(xhr.responseText, xhr.statusText);
					 }
				}
			};

			xhr.setRequestHeader('Content-Type', this.getContentType());
			xhr.sendAsBinary(data);
		}

	}

	return multiPartFormData;
})();
