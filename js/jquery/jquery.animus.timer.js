/**
 * @file                jquery.animus.timeline
 * @author              Filipe Araujo
 * @version             1.0
 */


(function(){
	var tracker = {},
		timer = {},

	interval = function(params){
		timer[params.id] = setTimeout(function(){
			self.postMessage(params);
			interval(params);
		}, parseInt(params.fps), 10);
	};

	self.addEventListener('message', function(e) {
		var id = e.data.id;

		switch(e.data.request){
			case 'start':
				tracker[id] = id;
				interval({
					eventName : 'onFrame',
					fps : Math.ceil(1000 / (e.data.params.fps || e.data.params.speed)),
					id : id
				});
				break;
			case 'stop':
				clearTimeout(timer[id]);
				self.postMessage({
					eventName : 'onStop',
					id : id
				});
				break;
			case 'kill':
				self.postMessage({
					eventName :  'onKil.'
				});
				break;
			default :
				break;
		}
	}, false);

})();