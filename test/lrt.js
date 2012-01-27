function doSomething(count) {
	var r=count + ':';
	for(var i=0; i<10000000; ++i){
		if(i%1000000 == 0){
			r += this.something;
		}
	}
	return r;
}

if( typeof window == "undefined" ) {
	importScripts('../root/js/long_running_task_stub.js');
}

