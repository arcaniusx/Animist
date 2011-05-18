/**
 * @file
 * @author              Filipe Araujo
 * @version             1.0
 */


Animist = (function($){

	var

	//---
	animi = {},

	defaults = {
		sprite : {
			frames : 2,
			fps : 12,
			level : 1,
			type : 'sprite'
		},
		pan : {
			direction : 'left',
			type : 'pan',
			speed : 60
		}
	},

	//---
	expando = $.expando,

	//---
	worker = new Worker('js/animist.timer.js'),

	//---
	_animus = function(el){
		var animus = el.data('animus');

		if(!animus){
			el.data('animus', true);// set expando
			animus = expando + ":" + el.prop(expando);
			animi[animus] = {
				config : {
					el : el,
					id : animus,
					animating : false,
					height : el.height(),
					width : el.width(),
					queue : []
				}

			};

			el.data('animus', animus)
				.bind('onStart', { animus : animi[animus] }, start)
				.bind('onFrame', { animus : animi[animus] }, animate);
		}

		return animi[animus];
	},

	animate = function(e){
		var animus = e.data.animus,
			action = animus.config.animating;

		console.log(animus)
	},

	start = function(e){
		var animus = e.data.animus,
			queue = animus.config.queue,
			animating = animus.config.animating;

		console.info('starting', animus[queue[0]]);
		animus.config.animating = animus[queue[0]];
		worker.postMessage({
			id : animus.config.id,
			action : animating,
			request : 'start'
		});
	},

	//---
	api = function(el){
		var

		$el = $(el),

		//----
		_sprite = function(params){
			var sprites = params;

			if(typeof params === 'object' && !$.isArray(params)){
				sprites = $.makeArray(params);
			}

			if(!$.isArray(sprites)){
				console.warn('Unable to add sprite to ::', $el, ':: bad params ::', params);
				return;
			}

			$.each(sprites, function(i,val){
				var options = $.extend({}, defaults.sprite, val),
					duration = options.duration;

				if(!options.name){
					console.warn('Unable to add sprite to :: ', $el, ':: name not specified');
					return false;
				}
				duration = (!duration) ? null : duration.frames || duration.sequences * options.frames || duration.seconds * options.fps;

				$el.each(function(){
					var	$animus = $(this),
						animus = _animus($animus),
						i,
						x = [];


					for (i = 0; i < options.frames; i++) {
						x[i] = (-1 * (animus.config.width*i));
					}
					
					animus[options.name] = {
						duration : duration,
						fps : options.fps,
						frames : options.frames,
						level : options.level,
						mapping : {
							x : x,
							y : options.level || 0
						}
					}


				});
			});

			console.info('animi:',animi);

			return this;
		},

		//-----
		_queue = function(params){
			$el.each(function(){
				var	$animus = $(this),
					animus = _animus($animus),
					queue = animus.config.queue;

				if(!params){
					console.warn('Unable to start action, action name not specified for :: ', $el);
					return;
				}

				if(typeof params === 'string'){
					$.each(params.split(/\s|,/), function(i,val){
						if(!animus[val]){
							console.warn('Unable to start action, action "'+val+'" does not exist for :: ', $animus);
							return;
						}
						queue.push(val);
					});
				}

				if(!animus.config.animating){
					$animus.trigger('onStart');
				}
			});
		};

		return {
			start : _queue,
			end : function(){
				console.log('end a registered event');
				worker.postMessage({action : 'stop'});
				return this;
			},
			interrupt : function(){
				console.log('interrupt a registered event with another event and then continue when complete');
				return this;
			},
			addSprite : _sprite,
			addPan : function(){
				console.log('register a pan event');
				return this;
			}
		};
	};

	//---
	worker.addEventListener('message', function(e) {
		switch(e.data.request){
			case 'animate':
				animi[e.data.id].config.el.trigger('onFrame');
				break;
			default :
				break;
		}
	}, false);



	return api;

}(jQuery));