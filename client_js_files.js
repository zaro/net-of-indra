#!/usr/bin/env node
var fs = require('fs'),
		path = require('path');


function getConfig(jsRoot) {
	var cfgFile = path.join(jsRoot, 'js_dir.json');
	var hasCfg = false;
	try {
		fs.statSync(cfgFile);
		hasCfg = true;
	} catch(e) {
	}
	if( hasCfg ) {
		try {
			return JSON.parse(fs.readFileSync(cfgFile, 'utf-8'));
		} catch(e) {
			console.log(e.message);
		}
	}
}

function clientJsFiles(jsRoot) {
	jsRoot = path.join(jsRoot,'/');
	var JS_DIR = jsRoot ;
	var loadList = [];
	var cfg = getConfig(jsRoot);
	var load_order = cfg ? cfg.preLoad : [];
	for(var i in load_order) {
		if(load_order[i].length > 0 && load_order[i].indexOf('#') != 0){
			loadList.push(load_order[i]);
		}
	}	
	var dirs = [ JS_DIR ];
	var files = [];
	while(dirs.length){
		var dir = dirs.shift();
		var el = fs.readdirSync(dir);
		for(var i in el){
			var fullName = path.join(dir, el[i]); 
			if(fs.statSync(fullName).isDirectory()){
				dirs.push(fullName);
			} else {
				files.push(fullName);
			}
		}
	}
	for(var i in files){
		var f = files[i].replace(jsRoot,'');
		if(loadList.indexOf(f) == -1 && f.match('\.js$')){
			loadList.push(f);
		}
	}
	return loadList;
}

if (!module.parent) {
	var argv = require('optimist')
							.boolean('json').argv,
			sys = require('sys'),
			jsRoot = path.join(argv._[1], '/'),
			files;
	switch(argv._[0]){
		case 'listAll':
			files = clientJsFiles(jsRoot);
			break;
		case 'listBundle':
			var allFiles = clientJsFiles(jsRoot);
			var notInBundle = getConfig(jsRoot).excludeFromBundle;
			files = allFiles.filter(function (file) {
				return notInBundle.indexOf(file) == -1;
			});
			break;
		case 'listNotInBundle':
			files = getConfig(jsRoot).excludeFromBundle;
			break;
		default:
			console.log("Unknown option :" + argv._[0]);
			process.exit(1);
			break;
	}
	if(argv.prefix) {
		files = files.map(function(file) {
			return argv.prefix + file;
		});
	}
	if(argv.json) {
		sys.puts(JSON.stringify(files));
	} else {
		for(var i in files){
			sys.puts(files[i]);
		}
	}
} else {
	module.exports.clientJsFiles = clientJsFiles;
}

