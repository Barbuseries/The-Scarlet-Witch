/*************/
/* Interface */
/******************************************************************************/
var Interface = function(game, x, y, width, height, sprite){
	Phaser.Group.call(this, game);

	this.x = x;
	this.y = y;

	this.background = game.add.sprite(0, 0, sprite);
	this.background.width = width;
	this.background.height = height;

	this.add(this.background);

	this.width = width;
	this.height = height;

	this.onStartToggle = new Phaser.Signal();
	this.onEndToggle = new Phaser.Signal();
	
	this.onUpdate = new Phaser.Signal();

	this.onStartClose = new Phaser.Signal();
	this.onEndClose = new Phaser.Signal();

	this.timers = {
		toggle: null,
		close: null
	};

	this.animations = {
		toggle: {
			position: null,
			
			alpha: null
		},

		close: {
			position: null,
			
			alpha: null
		}
	};

	this.state = Interface.State.CLOSED;

	this.visible = false;

	this.game.add.existing(this);
}

Interface.prototype = Object.create(Phaser.Group.prototype);
Interface.prototype.constructor = Interface;

Interface.State = {};

Interface.State.TOGGLED = 0;
Interface.State.TOGGLING = 1;
Interface.State.PAUSED = 2;
Interface.State.CLOSING = 3;
Interface.State.CLOSED = 4;

Interface.prototype.toggle = function(){
	if (this.state != Interface.State.CLOSED){
		return;
	}

	this.visible = true;

	this.state = Interface.State.TOGGLING;

	this.onStartToggle.dispatch(this);

	if (this.animations.toggle.position == null){
		this.state = Interface.State.TOGGLED;

		this.onEndToggle.dispatch(this);
	}
	else{
		for(var i in this.animations.toggle){
			if (this.animations.toggle[i] != null){
				this.animations.toggle[i].start();
			}
		}
	}
}

Interface.prototype.close = function(){
	if ((this.state != Interface.State.TOGGLED) &&
		(this.state != Interface.State.PAUSED)){
		return;
	}

	this.state = Interface.State.CLOSING;

	this.onStartClose.dispatch(this);

	if (this.animations.close.position == null){
		this.visible = false;

		this.state = Interface.State.CLOSED;

		this.onEndClose.dispatch(this);
	}
	else{
		for(var i in this.animations.close){
			if (this.animations.close[i] != null){
				this.animations.close[i].start();
			}
		}
	}
}

Interface.prototype.createAnimation = function(type, x, y, time, alpha, easing, from){

	if ((type != "toggle") &&
        (type != "close")){
        return;
    }

    if (this.animations[type].position != null){
		return;
	}

    // By default, the animation takes 500 milliseconds.
    if (typeof(time) != "number"){
        time = 500;
    }
    // If the time is negative or zero, no need to do an animation :
    // It won't be seen anyway...
    else if (time <= 0){
        return;
    }

	if (!booleanable(from)){
		from = false;
	}


    // Alpha is ignored if it's a close animation.
    if (type == "toggle"){
        // By default, the final alpha is set to the TextBox's current alpha (make sure
        // to change it as, by default, it's equal to 1).
        if ((typeof(alpha) != "number") ||
            (alpha < 0)){
            alpha = this.alpha;
        }
    }

    // By default, the animation is linear.
    if (typeof(easing) != "function"){
        easing = Phaser.Easing.Linear.None;
    }

    var tween = null;
	var tweenAlpha = null;
	var positionTarget = (this.fixedToCamera) ? this.cameraOffset : this;

	if (!from){
		if (positionTarget != this){
			tween = this.game.add.tween(positionTarget)
				.to({x: x, y: y}, time, easing);
			
			tweenAlpha = this.game.add.tween(this)
				.to({alpha: alpha}, time, easing);
		}
		else{
			tween = this.game.add.tween(this)
				.to({x: x, y: y, alpha: alpha}, time, easing);
		}
	}
    else{
		if (positionTarget != this){
			tween = this.game.add.tween(positionTarget)
				.from({x: x, y: y}, time, easing);

			tweenAlpha = this.game.add.tween(this)
				.from({alpha: alpha}, time, easing);
		}
		else{
			tween = this.game.add.tween(this)
				.from({x: x, y: y, alpha: alpha}, time, easing);
		}
			
    }

    this.animations[type].position = tween;
	this.animations[type].alpha = tweenAlpha;

	if (type == "toggle"){
		this.animations.toggle.position.onComplete.add(function(){
			this.state = Interface.State.TOGGLED;

			this.onEndToggle.dispatch(this);
		}, this);
	}
	else{
		this.animations.close.position.onComplete.add(function(){
			this.state = Interface.State.CLOSED;
			this.visible = false;

			this.onEndClose.dispatch(this);
		}, this);
	}
}

Interface.prototype.update = function(){
	Phaser.Group.prototype.update.call(this);
	
	this.onUpdate.dispatch(this);
}

Interface.prototype.kill = function(){
	this.destroy();
}

Interface.prototype.destroy = function(){
	this._del();

	Phaser.Group.prototype.destroy.call(this);
}

Interface.prototype._del = function(){
	if (this.onStartToggle == null){
		return;
	}

	this.onStartToggle.dispose();
	this.onStartToggle = null;

	this.onEndToggle.dispose();
	this.onEndToggle = null;

	this.onUpdate.dispose();
	this.onUpdate = null;

	this.onStartClose.dispose();
	this.onStartClose = null;

	this.onEndClose.dispose();
	this.onEndClose = null;

	for(var i in this.timers){
		if (this.timers[i] != null){
			this.timers[i].stop();
			this.timers[i] = null;
		}
	}

	for(var i in this.animations){
		for(var j in this.animations[i]){
			if (this.animations[i][j] != null){
				this.animations[i][j].stop();
				this.animations[i][j] = null;
			}
		}
	}
}
/******************************************************************************/
/* Interface */
/*************/
