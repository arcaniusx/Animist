/**
 * @file                jquery.animus
 * @author              Filipe Araujo
 * @version             1.0
 */

(function($) {
	var

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
	expando = $.expando,
	worker = new Worker('js/jquery/jquery.animus.timer.js'),

	//----------
	_animus = function(){
		var animus,
			$el,
			id;

		this.each(function(){
			$el = $(this);
			animus = $el.data('animus');

			if(!animus){
				$el.data('animus',true);
				id = expando + ":" + $el.attr(expando);
				$el.data('animus', id);
				animus = animi[id] = {
					$el : $el,
					id : id,
					timeline : {
						animating : undefined,
						current : 0,
						index : 0,
						queue : []
					}
				};

				$el.bind('onFrame', { animus : animus }, animate)
					.bind('onStart', { animus : animus }, start)
					.bind('onStop', function(){});
			}
		});
		return new animusApi(this);
	},

	//----------
	_sprite = function(el, options){
		var animus = animi[el.data('animus')],
			dimens,
			duration,
			height,
			i,
			name = options.name,
			params = options,
			width;

		if(!name){
			return;
		}
		if(params.type == 'sprite'){
			duration = params.duration;
			height = params.height || el.height();
			dimens = [];
			width = params.width || el.width();

			for (i = 0; i < params.frames; i++) {
				dimens[i] = -1 * (width*i);
			}

			$.extend(params, {
				duration : (!duration) ? null : duration.frames || duration.sequences * params.frames || duration.seconds * params.fps,
				height : height,
				x : dimens,
				width : width,
				y : (params.level-1) * height
			});
		}
		if(params.type == 'pan'){
			dimens = el.css('background-position').replace(/(px)|%/g,'').split(' ');
			$.extend(params, {
				x : parseFloat(dimens[0]),
				y : parseFloat(dimens[1])
			});
		}

		animus[name] = {
			$el : el,
			params : params
		};

		console.info('animus ::',animus);
	},

	//----------
	animate = function(e){
		var animus = e.data.animus,
			dimens,
			timeline = animus.timeline,
			action = animus[timeline.queue[timeline.index]],
			params = action.params,
			duration = (action.overrides) ? action.overrides.duration : params.duration;

		if(!duration || duration > timeline.current){
			if(params.type == 'sprite'){
				dimens = {
					x : params.x[timeline.current%params.frames],
					y : params.y
				};
				timeline.current +=1;
			}
			if(params.type == 'pan'){
				params.x += (params.direction == 'left') ? -1 : 1;
				dimens = {
					x : params.x,
					y : params.y
				};
			}

			animus.$el.css('background-position', dimens.x+'px -'+dimens.y+'px');
		}
		if(duration == timeline.current) {
			worker.postMessage({
				id : animus.id,
				request : 'stop'
			});

			if(timeline.queue.length > 1){
				timeline.index = (timeline.index+1 >= timeline.queue.length) ? 0 : timeline.index+1;
				timeline.current = 0;

				console.info('new animation on :: ', animus.id, 'executing :: ', animus[timeline.queue[timeline.index]].params.name);

				worker.postMessage({
					id : animus.id,
					params : animus[timeline.queue[timeline.index]].params,
					request : 'start'
				});
			}
		}
	},

	start = function(e){
		var animus = e.data.animus,
			action,
			timeline = animus.timeline;

		if(!timeline.animating){
			timeline.animating = true;
		}

		action = animus[timeline.queue[timeline.index]];

		worker.postMessage({
			id : animus.id,
			params : action.params,
			request : 'start'
		});

		console.info('starting animation on :: ', animus.id, 'executing ::',action.params.name);
	},

	//----------
	stop = function(el, action){
		console.log(action);
	},

	//----------
	end = function(el, action){
		var animus = animi[el.data('animus')];
			queuePos = animus.timeline.queue.indexOf(action);

		if(queuePos > -1){
			el.bind("onStop", { animus : animus, index : queuePos}, unqueue);
		}

	},

	//----------
	queue = function(el, action){
		var animus = animi[el.data('animus')],
			actions = [],
			i,
			method = [],
			params,
			timeline = animus.timeline;

		if(action){
			actions = (typeof action === 'object') ? actions.concat(action) : action.split(/\s|,/);

			for(i = 0; i < actions.length; i++){
				if(action[i].duration){
					params = animus[action[i].name].params;
					animus[action[i].name].overrides = $.extend({}, params, {
						duration : action[i].duration.frames || action[i].duration.sequences * params.frames || action[i].duration.seconds * params.fps
					});
				}
				method.push((actions[i].name) ? actions[i].name : actions[i]);
			}

			timeline.queue  = (!timeline.queue) ? method : timeline.queue.concat(method);
		}

		if(animus.timeline.animating === undefined){
			el.trigger('onStart');
		}
	},

	//----------
	unqueue = function(e){
		var animus = e.data.animus,
			index = e.data.index,
			timeline = animus.timeline;

		console.log(' when ending an event, i should be recreating the queue and reseting timeline index --- OR --- should i be just removing the queue item and updating the index of that')

		timeline.queue.splice(index);
		console.log(index)
		console.log(timeline.index)
		animus.$el.unbind('onStop', unqueue);

	},

	//----------
	animusApi = function(el){
		return {
			addSprite : function(options){
				el.each(function(){
					_sprite($(this), $.extend({}, defaults.sprite, options));
				});
				return this;
			},
			addPan : function(options){
				el.each(function(){
					_sprite($(this), $.extend({}, defaults.pan, options));
				});
				return this;
			},
			end : function(action){
				el.each(function(){
					end($(this), action);
				});
				return this;
			},
			start : function(action){
				el.each(function(){
					queue($(this), action);
				});
				return this;
			}
		};
	};

	//----------
	worker.addEventListener('message', function(e) {
		animi[e.data.id].$el.trigger(e.data.eventName);
	}, false);

	//----------
	$.fn.extend({
		animus : _animus
	});
})(jQuery);