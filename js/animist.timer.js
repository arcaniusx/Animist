/**
 * @file
 * @author              Filipe Araujo
 * @version             1.0
 */
var timer = [];

self.addEventListener('message', function(e) {
	var data = e.data,
		params = data.params,
		id = data.id,
		request = data.request;


	if(request === 'start'){
		timer[id] = setInterval(function(){
			data.request = 'animate';
			self.postMessage(data);
		}, 3000);
		//}, Math.ceil(1000 / (params.fps || params.speed)));
	}
//	if(e.data && e.data.request === 'stop'){
//		clearInterval(timer);
//		self.postMessage(e.data);
//	}
}, false);

