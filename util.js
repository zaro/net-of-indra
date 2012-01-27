#!/usr/bin/env node

module.exports.normalizeLocale = function(locale) {
	var l  = locale.split(/[-_]/);
	l[0] = l[0].toLowerCase();
	if( l[1] ){
		l[1]  =l[1].toUpperCase();
	} else {
		if(l[0] == 'en') {
			l[1] = 'US';
		} else {
			l[1] = l[0].toUpperCase();
		}
	}
	return l[0] + '_' + l[1];
}

var appConfig = module.exports.appConfig = function(inProduction) {
	var file = process.env.APP_CONFIG ;
	file = file || require('fs').readFileSync(__dirname + '/app_config'+(inProduction?'.prod':'') +'.json');
	return JSON.parse( file );
}


if (!module.parent) {
	var argv = require('optimist').boolean('dev').boolean('json').argv,
			sys = require('sys'),
			path = require('path'),
			APP_CONFIG = appConfig(!argv.dev);	
	if(argv._[0] == 'readCfg') {
		var node = APP_CONFIG;
		for(var i=1; i<argv._.length && node; ++i){
			node = node[argv._[i]]
		}
		if(node){
			if(argv.json) {
				sys.puts(JSON.stringify(node));
			} else {
				if(typeof(node) == 'string') {
					sys.puts(node);
				} else if(typeof(node) == 'number') {
					sys.puts(node);
				} else {
					for(var i in node){
						sys.puts(node[i]);
					}
				}
			}
		}
	}else if(argv._[0] == "herokuCfg"){
		var child_exec = require('child_process').exec;
		child_exec("heroku config:add APP_CONFIG='" + JSON.stringify(APP_CONFIG) +"'",
			function(error, stdout, stderr){
				if (error !== null) {
				  console.log('exec error: ' + error);
				} else {	
					console.log(stdout);
					console.log(stderr);
				}
			}
		);
	}
}
