var connect = require('connect'),
		path = require('path'),
		jade = require('jade'),
		http = require('http'),
		https = require('https'),
		url = require('url'),
		nowww = require('connect-no-www'),
		querystring = require('querystring'),
		fs = require('fs'),
		clientJsFiles = require('./client_js_files').clientJsFiles,
		jadeCompile = require('./jade_compile'),
		normalizeLocale = require('./util').normalizeLocale,
		appConfig = require('./util').appConfig,
		loggly = require('loggly');

var inProduction  = process.env.NODE_ENV == 'production';

/*
var dotCloudEnv = {};
try {
	dotCloudEnv = JSON.parse(fs.readFileSync('/home/dotcloud/environment.json', 'utf-8'));
	console.log('dotCloud Application Name: ' + dotCloudEnv['DOTCLOUD_SERVICE_NAME']);
} catch(e) {
}
*/

/*
var redisURL = process.env.REDISTOGO_URL || dotCloudEnv['DOTCLOUD_DB_REDIS_URL'];
		
var imgStore = require('./redis_img_store').createStore(redisURL);
*/

var	STATIC_ROOT_DEV = __dirname + '/root/',
  	STATIC_ROOT_PROD = __dirname + '/prod_root/',
  	STATIC_ROOT,
 		STATIC_MAX_AGE = inProduction ? 86400000 : 0, // One day
 		DEFAULT_LOCALE = 'en_US';
 		
jadeCompile.cfg.TEMPLATE_EXT  = '.jade';
jadeCompile.cfg.TEMPLATE_CACHING = inProduction ? true : false;

var APP_CONFIG = appConfig(inProduction);

if(inProduction){
	try {
		var stat = fs.statSync(STATIC_ROOT_PROD);
		 jadeCompile.cfg.TEMPLATE_DIR = STATIC_ROOT = STATIC_ROOT_PROD;
	} catch(e) {
		jadeCompile.cfg.TEMPLATE_DIR = STATIC_ROOT = STATIC_ROOT_DEV;
	}
}else{
	jadeCompile.cfg.TEMPLATE_DIR = STATIC_ROOT = STATIC_ROOT_DEV;
}


APP_CONFIG['JS_FILES'] = clientJsFiles(path.join(STATIC_ROOT,'js')).map(function(file){
	return '/js/' + file;
});
APP_CONFIG['PRODUCTION'] = inProduction;


function renderTemplate(templateName, req ,resp, vars){
	try {
		jadeCompile.jadeRender(templateName, req.locale ,vars,function (str){
				resp.setHeader('Content-Type', 'text/html');
				resp.end(str);
		});
	} catch (err) {
		console.log("Error while rendering template '"+ templateName +"':\n" + err);
		resp.statusCode = 500;
		resp.end(String(err));
	}
}

var PROXY_HOSTS = [ 'graph.facebook.com', 'fbcdn.net'];
var allowedFilesRe = RegExp('\.(?:jpg|png|gif)$','i');
function httpProxy(method, headers, requestUrl, responseOut, redirect) {
	//console.log("Proxy request for ",requestUrl);
	//console.log("  with headers:", headers);
	if ( "host" in headers) {
		delete headers["host"];
	}
	var urlObj = url.parse(requestUrl);
	var options = {
		'host': urlObj['hostname'],
		'port': urlObj['port'],
		'path': urlObj['search'] ? urlObj['pathname'] + urlObj['search'] : urlObj['pathname'] ,
		'method' : method,
		'headers' : headers,
	};
	var	isHttps = (urlObj['protocol'].indexOf('https') == 0),
			client =  isHttps ? https : http;

	if( !redirect ){
		var found= false;
		for(var i in PROXY_HOSTS) {
			//console.log(urlObj['hostname'],'|',PROXY_HOSTS[i]);
			if( urlObj['hostname'].indexOf(PROXY_HOSTS[i], urlObj['hostname'].length - PROXY_HOSTS[i].length) !== -1 ){
				found = true;
				break;
			}
		}
		found = found || !!urlObj['pathname'].match(allowedFilesRe);
		if ( ! found ) {
				console.log("/proxy request rejected for " + requestUrl);
				responseOut.statusCode = 403;
				responseOut.end("URL not allowed :" + requestUrl);
				return;
		}
	}

	/* // Test for failing requests
	if(Math.random() < 0.10) {
		responseOut.statusCode = 503;
		responseOut.setHeader('Retry-After', '10');
		responseOut.end("Forced error");	
		return;
	}
	*/
	{
		var agent = client.getAgent(urlObj['hostname'], urlObj['port']);
		agent.maxSockets = 100;
	}
	var proxy_request = client.request(options, function(res) {
		//console.log("Got response " , res.statusCode, ",", typeof(res.statusCode));
		//console.log("  headers: " , res.headers);
		if( res.statusCode >= 400 ) {
			console.log("Error ", res.statusCode, " while retrieving ", requestUrl);
		} 
		switch(res.statusCode) {
			case 300:
			case 301:
			case 302:
			case 303:
			case 305:
			case 307:
				//console.log("Redirection in place, issuing a new request to:", res.headers.location);
				res.on('data', function (chunk) {
					responseOut.write(chunk, 'binary');
				});
				res.on('end', function () {
					httpProxy(method, headers, res.headers.location, responseOut, true);
				});
			return;
		}
		responseOut.statusCode = res.statusCode;
		for( header in res.headers ){
			responseOut.setHeader(header, res.headers[header]);
		}
		res.on('data', function (chunk) {
		  responseOut.write(chunk, 'binary');
		});
		res.on('end', function () {
			responseOut.end();
		});
	});
	
	proxy_request.on('error', function (e) {
		responseOut.statusCode = 503;
		responseOut.setHeader('Retry-After', '10');
		responseOut.end();
	});

	proxy_request.end();	

}

/*
var IMAGE_TYPES={'image/jpeg' : '.jpg', 'image/png' : '.png' };
function getImageData(request) {
	for( var mimeType in IMAGE_TYPES ) {
		var urlSchema = 'data:' + mimeType + ';base64,';
		if(request.body.data.indexOf(urlSchema) == 0) {
			return [ new Buffer(request.body.data.substr(urlSchema.length), 'base64'), mimeType];
		}
	}
	return [ null, request.body.data.substr(0,20) ];
}
*/

function sendJson(resp, obj) {
	resp.setHeader('Content-type', 'application/json');
	resp.end(JSON.stringify(obj));
}

var logglyLogger;
if(APP_CONFIG['LOGGLY_CONFIG']) {
 logglyLogger= loggly.createClient(APP_CONFIG['LOGGLY_CONFIG']);
}
var serverPort = process.env.PORT /*|| dotCloudEnv['PORT_NODEJS']*/  ||   3000;
var serverHostname = process.env.HOSTNAME;

var server = connect.createServer();
server.use(nowww(false));
if( !inProduction ){
	var fmt = 'dev';
	server.use(connect.logger({format: fmt}));
} else if (logglyLogger) {
	console.log("Logging HTTP errors to loggly");
	server.use(connect.logger(function(tokens, req, res){
		if(res.statusCode >= 400) {
			var logmsg = req.method
		  + ' ' + req.originalUrl + ' '
		  + res.statusCode
		  + ' '
		  + (new Date - req._startTime)
			logglyLogger.log(APP_CONFIG['LOGGLY_CONFIG'].token, logmsg ,function(err, result){
				if (err) {
					console.log("Failed to log to loggly.")
					console.log(err);
					console.log(JSON.stringify(result));
				}
				//console.log("Loggly:" + JSON.stringify(result) )
			});
		}
		return null;
		/*
		if (status >= 500) color = 31
		else if (status >= 400) color = 33
		else if (status >= 300) color = 36;

		return '\033[90m' + req.method
		  + ' ' + req.originalUrl + ' '
		  + '\033[' + color + 'm' + res.statusCode
		  + ' \033[90m'
		  + (new Date - req._startTime)
		  + 'ms\033[0m';
		*/
	}));

}

server.use(connect.favicon(STATIC_ROOT + 'favicon.ico'));
server.use(connect.cookieParser());
server.use(function (req, res, next){
	if(req.headers["X-Facebook-Locale"]){
		req.locale = req.headers["X-Facebook-Locale"];
	} else if(req.cookies['lang']) {
		req.locale = req.cookies['lang'];
	} else if (req.headers['accept-language']) {
		var locales=[];
		req.headers['accept-language'].split(',').forEach(function (lang) {
			locales.push(lang.split(';', 1)[0]);
    });
    for(var i in locales) {
			var l= normalizeLocale(locales[i]);
			//console.log("Checking for locale " +l )
			//console.log(APP_CONFIG['LANGS'])
			if (APP_CONFIG['LANGS'].indexOf(l) >=0 ){
				//console.log("set " + l)
				req.locale = l;
				break;
    	}
    }
    if(!req.locale) {
    	req.locale = DEFAULT_LOCALE;
    }
	} else {
		req.locale = DEFAULT_LOCALE;
	}
	next();
});

if(inProduction) {
	// Redirect root based on locale
	server.use(function (req, res, next) {
		var urlObj = url.parse(req.url),
				uriPath = decodeURIComponent(urlObj.pathname);
		if (path.normalize('/') == uriPath){
			var newLocation = 'http://' + req.headers.host + '/' + jadeCompile.getTranslatedDir(STATIC_ROOT, req.locale) + '/' ;
		  res.writeHead(307, { 'Location': newLocation });
      return res.end();
		} else {
			next();
		}
	});
}
if(inProduction){
	server.use(connect.staticCache())
}
server.use(connect.static(STATIC_ROOT, { maxAge: STATIC_MAX_AGE }))
  		.use(connect.bodyParser())
			.use(connect.router(function (app) {
					if(!inProduction) {
						app.get('/', function (req, resp) {
							var vars = {};

							for( var key in APP_CONFIG ){
									 vars[key] = APP_CONFIG[key];
							}
							vars.locale = req.locale;
						 	renderTemplate('index', req, resp, APP_CONFIG);
						});
					}
					app.get(new RegExp('/proxy/(.*)'), function (req, resp) {
						httpProxy('GET', req.headers, querystring.unescape(req.params[0]), resp)
					});
					/*
					app.post('/download',function (req, resp) {
						var arr = getImageData(req);
						var buf = arr[0] , mimeType = arr[1];
						if(buf) {
							var fileName = "indra-net-me" + IMAGE_TYPES[mimeType];
							resp.setHeader('Content-type', mimeType);
							resp.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');
							resp.end(buf.toString('binary'),'binary');
						} else {
							console.log("Unsupported image data type :" + mimeType);
							resp.statusCode = 500;
							resp.end("Unsupported image data type :" + mimeType);
						}
					});
					*/		
					app.post('/putImg',function (req, resp) {
						var buf = req.body.image;
						if(buf) {
							var post_data = querystring.stringify({
								'key' : APP_CONFIG["IMGUR_KEY"],
								'image': buf,
							});
							var post_options = {
								host: 'api.imgur.com',
								port: '80',
								path: '/2/upload.json',
								method: 'POST',
								headers: {
									'Content-Type': 'application/x-www-form-urlencoded',
									'Content-Length': post_data.length
								}
							};
							var post_req = http.request(post_options, function(pres) {
								pres.setEncoding('utf8');
								var response = "";
								pres.on('data', function (chunk) {
									//console.log('ImgUr data: ' + chunk);								
									response += chunk;
								});
								pres.on('end', function() {
									//console.log('ImgUr Response: ' + response);
									resp.end(response);
								});
							});
							post_req.on('error', function(e) {
								console.log("/putImg Got error: " + e.message);
							});
							post_req.write(post_data);
							post_req.end();
						} else {
							console.log("/putImg : No data uploaded");
							resp.end(JSON.stringify({"error":"No data uploaded"}));
						}
					});
					app.get('/delImg/:id', function (req, resp) {
						var key = req.params.id;
						var options = {
							host: 'api.imgur.com',
							port: '80',
							path: '/2/delete/' + key,
						};
						http.get(options, function(res) {
							resp.statusCode = res.statusCode;
							for( header in res.headers ){
								resp.setHeader(header, res.headers[header]);
							}
							res.on('data', function (chunk) {
								resp.write(chunk, 'binary');
							});
							res.on('end', function () {
								resp.end();
							});						
							//console.log("Got response: " + res.statusCode);
						}).on('error', function(e) {
							console.log("/delImg Got error: " + e.message);
						});
					});
				}));
server.listen(serverPort/*, serverHostname*/);
console.log('Running in ' + (inProduction?'production':'development') + ' mode.');
console.log('Listening on http://' + (serverHostname?serverHostname:'0.0.0.0') + ':' + serverPort + '/');

