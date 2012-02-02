#!/usr/bin/env node
var fs = require('fs'),
		path = require('path'),
		jade = require('jade'),
	  utils = require('jade/lib/utils'),
    nodes = jade.nodes,
    runtime = require('jade/lib/runtime'),
    selfClosing = require('jade/lib/self-closing'),
    appConfig = require('./util').appConfig,
    Compiler = jade.Compiler;

var cfg = {
	TEMPLATE_EXT : ".jade",
	TEMPLATE_CACHING : true,
	TEMPLATE_DIR : './',
	TEMPALTE_DEFAULT_LANG : 'en',
};


// :varstore filter

jade.filters.varstore = function(block, compiler){
  return new VarStoreVisitor(block, compiler.options).compile();
};

function VarStoreVisitor(node, options) {
    Compiler.call(this, node, options);
}

// Inherit from Compiler
VarStoreVisitor.prototype.__proto__ = Compiler.prototype;

// Overwrite visitTag method 
VarStoreVisitor.prototype.visitTag = function(node){
    var parent = Compiler.prototype.visitTag;
		var id = node.getAttribute('id');
		if(id) {
  		id = id.replace(/^[\"']/,'');
  		id = id.replace(/[\"']$/,'');
  		id = id.replace(/-/g,'_');	  		
  		var val = '';
  		if (node.text) {
  		 val += utils.escape(node.text.nodes[0].trimLeft());
  		}
  		if (node.block) {
				var compiler = new Compiler(node.block, this.options)
					,	js = compiler.compile()
					,	fnBody = [
									'var __jade = [{ lineno: -1, filename: "' + this.options.filename + '" }];'
								, 'try {'
								, 'var buf = [];\n'
								, (this.options.self
									? 'var self = locals || {};\n' + js
									: 'with (locals || {}) {\n' + js + '\n}\n')
								, 'return buf.join("");'
								, '} catch (err) {'
								, '  rethrow(err, __jade[0].filename, __jade[0].lineno);'
								, '}'
						].join('\n')								
			  	,	fn = new Function('locals, attrs, escape, rethrow', fnBody);
			  val += utils.escape(fn(undefined, runtime.attrs, runtime.escape, runtime.rethrow)).replace(/\n/g, '\\n');
  		}
      var  varAssign = new nodes.Code("var " + id + " = '" + val +"';", false , false);
      Compiler.prototype.visitCode.call(this, varAssign);
    }
};

// :varstoreassign filter
jade.filters.varstoreassign = function(block, compiler){
    return new VarStoreAssign(block, compiler.options).compile();
};

function VarStoreAssign(node, options) {
    Compiler.call(this, node, options);
}

// Inherit from Compiler

VarStoreAssign.prototype.__proto__ = Compiler.prototype;

// Overwrite visitTag method, copied from Compiler with slight modification
VarStoreAssign.prototype.visitTag = function(tag){
    this.indents++;
    var name = tag.name;

    if (!this.hasCompiledTag) {
      if (!this.hasCompiledDoctype && 'html' == name) {
        this.visitDoctype();
      }
      this.hasCompiledTag = true;
    }

    // pretty print
    if (this.pp && inlineTags.indexOf(name) == -1) {
      this.buffer('\\n' + Array(this.indents).join('  '));
    }

    if (~selfClosing.indexOf(name) && !this.xml) {
      this.buffer('<' + name);
      this.visitAttributes(tag.attrs);
      this.terse
        ? this.buffer('>')
        : this.buffer('/>');
    } else {
      // Optimize attributes buffering
      if (tag.attrs.length) {
        this.buffer('<' + name);
        if (tag.attrs.length) this.visitAttributes(tag.attrs);
        this.buffer('>');
      } else {
        this.buffer('<' + name + '>');
      }
      if (tag.code) this.visitCode(tag.code);
      // >>> Here is the only difference from parent
      if (tag.text) {
      	this.buffer(utils.text(tag.text.nodes[0].trimLeft()));
      } else {
    		var id = tag.getAttribute('id');    		
				if ( (tag.block.nodes.length == 0) && id ) {
		  		id = id.replace(/^[\"']/,'');
		  		id = id.replace(/[\"']$/,'');
		  		id = id.replace(/-/g,'_');	  		
					var code = '!{(typeof('+id+')!="undefined"?'+id+':"")}';
      		this.buffer(utils.text(code));
				}
      }
      // <<< end.
      this.escape = 'pre' == tag.name;
      this.visit(tag.block);

      // pretty print
      if (this.pp && !~inlineTags.indexOf(name) && !tag.textOnly) {
        this.buffer('\\n' + Array(this.indents).join('  '));
      }

      this.buffer('</' + name + '>');
    }
    this.indents--;
};

var getTranslatedDirCache = {};
function getTranslatedDir(rootPath, lang){
	if(!getTranslatedDirCache[path+lang]) {
		var dirs = [
			lang
		];
		var langOnly = lang.match(/^([^-_]+)[-_]/);
		if(langOnly) {
			dirs.push(langOnly[1]);
		}
		var trDir= '';
		//console.log("test " + dirs);
		for(var i in dirs) {
			try {
				var f = path.join(rootPath, dirs[i]);
				//console.log("test " + f);
				var stat = fs.statSync(f);
				if(stat) {
					trDir = dirs[i];
					break;
				}
			} catch(e) {};
		}
		getTranslatedDirCache[path+lang] = trDir;
	}
	return getTranslatedDirCache[path+lang];
}

function getTranslatedFile(templateName , lang) {
	var dir;
	if(path.extname(templateName) == cfg.TEMPLATE_EXT) {
		dir = path.dirname(templateName);	
		var p = path.basename(templateName);
		templateName = p.replace(cfg.TEMPLATE_EXT,'');
	} else {
		dir = cfg.TEMPLATE_DIR;
	}
	var files = [
		[ templateName +'.' + lang+ cfg.TEMPLATE_EXT, lang]
	];
	var langOnly = lang.match(/^([^-_]+)[-_]/);
	if(langOnly) {
		files.push(
			[ templateName +'.' + langOnly[1]+ cfg.TEMPLATE_EXT, lang ]
		);
	}
	files.push(
		[ templateName +'.' + cfg.TEMPALTE_DEFAULT_LANG + cfg.TEMPLATE_EXT,
			cfg.TEMPALTE_DEFAULT_LANG
		]
	);
	files.push(
		[  templateName + cfg.TEMPLATE_EXT, '' ]
	);
	for(var i in files) {
		try {
			var f = path.join(dir, files[i][0]);
			var stat = fs.statSync(f);
			if(stat) {
				return {
					fileRelative: files[i][0],
					file: f,
					lang: files[i][1],
				}
			}
		} catch(e) {};
	}
	throw new Error("Template '" + templateName +"' not found in '" + dir +"'! Tried +" + JSON.stringify(files));
}

function jadeRender(templateName, lang , vars, callback) {
	var templateInfo = getTranslatedFile(templateName, lang);
	var templatePath =  templateInfo.file;
	data = {};
	for(var i in vars){
		data[i] = vars[i];
	}
	data.cache = data.cache || cfg.TEMPLATE_CACHING;
	data.compileDebug = data.compileDebug || false;
	data.locale = data.locale || templateInfo.lang || lang;
	jade.renderFile(templatePath, data,function (err, str){
		if( err ) {
			throw (err);
		} else {
			callback(str);
		}
	});
}

module.exports.jadeRender = jadeRender;
module.exports.getTranslatedFile = getTranslatedFile;
module.exports.getTranslatedDir = getTranslatedDir;
module.exports.cfg = cfg;

if (!module.parent) {
	var argv = require('optimist').argv,
			sys = require('sys'),
			normalizeLocale = require('./util').normalizeLocale,
			jsRoot = path.join(argv._[1], '/'),
			clientJsFiles = require('./client_js_files').clientJsFiles,
			APP_CONFIG = appConfig(!argv.dev);
			APP_CONFIG['JS_FILES'] = clientJsFiles(path.join(__dirname + '/prod_root/','js')).map(function(file){
				return '/js/' + file;
			});
			APP_CONFIG['PRODUCTION'] = true;
	if(argv._[0]) {
		// Deduce the locale from fileName
		var l = path.extname(argv._[0]);
		if(l = path.extname(argv._[0].replace(l,''))) {
			l = l.replace(/\./,'');
			l = normalizeLocale(l);
		}
		jadeRender(argv._[0], l ,APP_CONFIG,function(str){
			process.stdout.write(str);
		})
	}
}
