/******************/
/* ControlManager */
/******************************************************************************/
var CONTROL_KEYBOARD = 0;
var CONTROL_GAMEPAD = 1;

/* Store controls and handle their rebinding, swap, ...
   type : (number) CONTROL_KEYBOARD => enable key binding.
                   CONTROL_GAMEPAD => enable button binding and joystick handling.

   /!\ Note : A control can be used in both cases if it's property
              "transcendental" is set to true. 

   target : (object) the object whose methods will be called.
            By default, all controls share the same target as the ControlManager,
			but you can specify it for each control.

   pad : (string) which pad to use with CONTROL_GAMEPAD.
         ("pad1", "pad2", "pad3" or "pad4")
*/
var ControlManager = function(game, type, target, pad){
	this.game = game;
	
	game.input.gamepad.start();
	
	this.pad = game.input.gamepad[pad];
	this.pad.addCallbacks(this, {onDisconnect: this.swap});

	this.keyboard = game.input.keyboard;

	this.type = type;
	this.target = target;
	this.allControls = {};
	
	this.enabled = true;

	this._cached = {
		target: [],
		enabled: [],
		type: []
	};

	this.onUpdate = new Phaser.Signal();
}

// Call each control's function with "update" as signal.
// "this" is not dispatched to a function binded to a control, it's
// the control itself.
// In the case of a pad control, the control's axis is also dispatched
// (after the control itself).
ControlManager.prototype.update = function(){
	this.onUpdate.dispatch(this);
}


/* Bind a control to a function.
   The function must be a method of target (otherwhise, it won't be called).
   The function, when called will be sent as parameter the control (control.input refers
   to the key/button).

   controlName : (string) name of the control (controlManager.allControls.controlName
                 will refer to the control)
                 => inputName = "leftInput" => this.allControls.leftInput refers to it.
				 => -1 : use functionName as the control's name.
				 If a control of the ControlManager has the same name, it will be
				 replaced.

   keyboardCode : (number) key code. (Phaser.Keyboard.LEFT, for example)
                 => -1 : if controlName is already a control of the ControlManager,
				 will copy the key code.

   gamepadCode : (number) button code. (Phaser.Gamepad.XBOX_A, for example)
                => -1 : if controlName is already a control of the ControlManager,
				will copy the button code.

   functionName : (string) name of the function to be binded.
                  => -1 : if controlName is already a control of the ControlManager,
				  will copy the function.

   signal : (string) when to call the function.
            => "update" : call when ControlManager.update() is called.
			=> "down" : call when input is down.
			=> "up" : call when input is up.
			=> "onDown" : call when input has just been pressed.
			=> "onUp" : call when input has just been released.
			=> "onFloat" : (button only) call when input's pressure is > 0 and < 1.
			=> -1 : if controlName is already a control of the ControlManager,
				  will copy the signal.

   allTags : (string or array of strings) can be used to enable/disable
             a group of inputs.
			 => -1 : if controlName is already a control of the ControlManager,
			 will copy the tags.

   target : (object) object whose method will be called for this specific control.
            => -1 : if controlName is already a control of the ControlManager,
			will copy the target.

   fps : (number) Fired Per Second.
                  0 : no effect.
				  > 0 : how many times the function will be exucted (at most)
				        per second.
						=> 30 : executed (at most) 30 times per second
						        (every 2 frames).
*/
ControlManager.prototype.bindControl = function(controlName, keyboardCode,
												gamepadCode,
												functionName, signal, allTags,
												target, fps){
	var code;
	var funct;
	var sig;
	var targ;
	var tags;
	var fp;

	// If we're trying to bind a button from a Gamepad, it needs to be
	// done only after the Gamepad has been connected.
	// That's what this function do : if the Gamepad is not currently
	// connected, tell him to bind the button once it is.
	var manager = this;
	
	if (controlName == -1) {
		controlName = functionName;
	}

	function setAfterCheck(){
		manager.bindControl(controlName, -1, gamepadCode, functionName, signal,
							allTags, target, fps);

		this.pad.addCallbacks(this, {onConnect: null});
	}
	
	if (!this.pad.connected){
		this.pad.addCallbacks(this, {onConnect: setAfterCheck});
	}
	
	// If the control already exists, unbind it.
	// (And, according to the parameters, save some of it's attributes)
	if (typeof(this.allControls[controlName]) != "undefined"){
		var control = this.allControls[controlName];

		function getFinalValue(value, name, type){
			if (type == 0){
				return (value == -1) ? control[name] : value;
			}
			else{
				return (value == -1) ? control[name] :
					(typeof(value) == "undefined") ? control[name] : value;
			}
		}

		kCode = getFinalValue(keyboardCode, "keyboardCode", 0);
		gCode = getFinalValue(gamepadCode, "gamepadCode", 0);

		funct = getFinalValue(functionName, "functionName");
		sig = getFinalValue(signal, "signal");
		targ = getFinalValue(target, "target");
		tags = getFinalValue(allTags, "allTags");
		fp = getFinalValue(allTags, "fps");

		this.unbindControl(controlName);
	}
	else{
		kCode = keyboardCode;
		gCode = gamepadCode;

		funct = functionName;
		sig = signal;
		targ = target;
		tags = allTags;
		fp = fps;
	}

	this.allControls[controlName] = new Control(this, kCode, gCode, funct, sig, tags,
												targ, fp);

	return this;
} 

/*
  Bind an axis of the Control's manager's pad to a function.
*/
ControlManager.prototype.bindPadControl = function(padControlName, axis, min, max,
												   functionName, signal, allTags,
												   target, fps){
	var ax;
	var mi;
	var ma;
	var funct;
	var sig;
	var targ;
	var tags;
	var fp;
	
	var manager = this;

	if (padControlName == -1) {
		padControlName = functionName;
	}

	function setAfterCheck(){
		manager.bindPadControl(padControlName, axis, min, max, functionName, signal,
							   allTags, target, fps);

		this.pad.addCallbacks(this, {onConnect: null});
	}

	if (!this.pad.connected){
		this.pad.addCallbacks(this, {onConnect: setAfterCheck});
		return this;
	}

	if (typeof(this.allControls[padControlName]) != "undefined"){
		var padControl = this.allControls[padControlName];

		function getFinalValue(value, name, type){
			if (type == 0){
				return (value == -1) ? padControl[name] : value;
			}
			else{
				return (value == -1) ? padControl[name] :
					(typeof(value) == "undefined") ? padControl[name] : value;
			}
		}

		ax = getFinalValue(axis, "axis");
		mi = getFinalValue(min, "min");
		ma = getFinalValue(max, "max");
		funct = getFinalValue(functionName, "functionName");
		sig = getFinalValue(signal, "signal");
		targ = getFinalValue(target, "target");
		tags = getFinalValue(allTags, "allTags");
		fp = getFinalValue(fps, "fps");

		this.unbindPadControl(padControlName);
	}
	else{
		ax = axis;
		mi = min;
		ma = max;
		funct = functionName;
		sig = signal;
		targ = target;
		tags = allTags;
		fp = fps;
	}

	this.allControls[padControlName] = new PadControl(this, ax, mi, ma, funct,
													  sig, tags, targ, fp);

	return this;
}

// Destroy the given control (by name).
ControlManager.prototype.unbindControl = function(controlName){
	if (typeof(controlName) != "string") return;
	if (typeof(this.allControls[controlName]) === "undefined") return;
	
	this.allControls[controlName].destroy();

	delete this.allControls[controlName];

	this.allControls[controlName] = undefined;

	return this;
}

ControlManager.prototype.unbindPadControl = function(padControlName){
	if (typeof(padControlName) != "string") return;
	if (typeof(this.allControls[padControlName]) === "undefined") return;

	this.allControls[padControlName].destroy();

	delete this.allControls[padControlName];

	this.allControls[padControlName] = undefined;

	return this;
}

// Swap two controls.
// If type is 0, swap the controls' codes.
// Otherwhise, swap the controls' functions and signals.
// In both cases, the controls' tags and their targets are swapped.
ControlManager.prototype.swapControls = function(controlName1, controlName2, type){
	if ((typeof(controlName1) != "string") ||
		(typeof(controlName2) != "string")){
		return;
	}

	if ((typeof(this.allControls[controlName1]) === "undefined") ||
		(typeof(this.allControls[controlName2])) === "undefined"){
		return;
	}

	if (!booleanable(type)){
		type = 0;
	}

	var control1 = this.allControls[controlName1];
	var control2 = this.allControls[controlName2];

	var kCode1  = control1.keyboardCode;
	var kCode2 = control2.keyboardCode;

	var gCode1 = control1.gamepadCode;
	var gCode2 = control2.gamepadCode;

	var controlFunction1 = control1.functionName;
	var controlFunction2 = control2.functionName;
	
	var controlSignal1 = control1.signal;
	var controlSignal2 = control2.signal;
	
	var allTags1 = control1.allTags;
	var allTags2 = control2.allTags;

	var target1 = control1.target;
	var target2 = control2.target;
	
	var fps1 = control1.fps;
	var fps2 = control2.fps;
	
	this.unbindControl(controlName1);
	this.unbindControl(controlName2);

	// If type == 0, swap the key/buttonCodes. 
	if (!type){
		this.bindControl(controlName1, kCode2, gCode2, controlFunction1,
						 controlSignal1, allTags2, target2, fps2);
		this.bindControl(controlName2, kCode1, gCode1, controlFunction2,
						 controlSignal2, allTags1, target1, fps1);
	}
	// Else, swap the functions (and the signals).
	else{
		this.bindControl(controlName1, kCode1, gCode1, controlFunction2,
						 controlSignal2, allTags2, target2, fps2);
		this.bindControl(controlName2, kCode2, gCode2, controlFunction1,
						 controlSignal1, allTags1, target1, fps1);
	}

	return this;
}

// Return the control.
ControlManager.prototype.get = function(controlName){
	return this.allControls[controlName];
}

// Return an array of controls with the given tags.
// If allNeeded is true, a control must have every tags to be put into
// the array.
// (In the case of a Gamepad control, the pad's controls are also checked)
ControlManager.prototype.getByTag = function(allTags, allNeeded){
	if (typeof(allTags) === "undefined") return;
	if (!booleanable(allNeeded)) allNeeded = false;

	var returnControls = [];

	if (typeof(allTags) === "undefined"){
		for (control in this.allControls){
			returnControls.push(this.allControls[control]);
		}
	}
	else if (typeof(allTags) === "object"){
		for (controlName in this.allControls){	
			var i = 0;
			var control = this.allControls[controlName];

			if (allNeeded){
				if (control.allTags.length < allTags.length){
					continue;
				}
				
				while (validIndex(i, allTags) &&
					   (control.allTags.indexOf(allTags[i]) != -1)){
					i++;
				}

				if (i == allTags.length){
					returnControls.push(control);
				}
			}
			else{
				while (validIndex(i, allTags) &&
					   !(control.allTags.indexOf(allTags[i]) != -1)){
					i++;
				}

				if (i < allTags.length){
					returnControls.push(control);
				}
			}		
		}
	}
	else if (typeof(allTags) === "string"){
		for (controlName in this.allControls){
			var control = this.allControls[controlName];

			if (control.allTags.indexOf(allTags) != -1){
				returnControls.push(control);
			}	
		}
	}

	return returnControls;
}

// Set the controls target to target.
// If controls is undefined, set the ControlManager's target to target.
// If cache is set to true, store the current target of the control.
ControlManager.prototype.setTarget = function(target, controls, cache){
	if (typeof(target) === "undefined") return;
	if (!booleanable(cache)) cache = false;

	if (typeof(controls) === "undefined"){
		if (cache){
			this._cached.target.push(this.target);
		}

		this.target = target;
	}
	else if (typeof(controls) === "string"){
		var control = this.allControls[controls];

		control.setTarget(target, cache);
	}
	else if (typeof(controls) === "object"){
		for(var i = 0; i < controls.length; i++){
			var control = this.allControls[controls[i]];

			control.setTargetByTag(target, cache);
		}
	}
}

// Set the target of every control with at least one of the tags in allTags to target.
// If allTags is undefined, set the ControlManager's target to target.
// If cache is set to true, store the current target of the control.
ControlManager.prototype.setTargetByTag = function(target, allTags, allNeeded, cache){
	if (typeof(target) === "undefined") return;
	if (!booleanable(allNeeded)) allNeeded = false;
	if (!booleanable(cache)) cache = false;

	if (typeof(allTags) === "undefined"){
		if (cache){
			this._cached.target.push(this.target);
		}

		this.target = target;
	}
	else{
		var allControls = this.getByTag(allTags, allNeeded);

		for(var i in allControls){
			allControls[i].setTarget(target, cache);
		}
	}
}

ControlManager.prototype.setFpsByTag = function(fps, allTags, allNeeded, cache){
	if ((typeof(fps) != "number") ||
		(fps < 0)){
		return;
	}
	if (typeof(allTags) === "undefined") return;
	if (!booleanable(allNeeded)) allNeeded = false;
	if (!booleanable(cache)) cache = false;

	var allControls = this.getByTag(allTags, allNeeded);
	
	for(var i in allControls){
		allControls[i].setFps(fps, cache);
	}
}

ControlManager.prototype.setSignalByTag = function(signal, allTags, allNeeded, cache){
	if (typeof(signal) != "string") return;
	if (typeof(allTags) === "undefined") return;
	if (!booleanable(allNeeded)) allNeeded = false;
	if (!booleanable(cache)) cache = false;

	var allControls = this.getByTag(allTags, allNeeded);
	
	for(var i in allControls){
		allControls[i].setSignal(signal, cache);
	}
}

// Disable all controls with one (or all if allNeeded is true) of the tags
// in allTags.
// If allTags is undefined, disable the ControlManager.
// (allTags can also be a string)
// If cache is set to true, store the current state of the control.
ControlManager.prototype.disable = function(allTags, allNeeded, cache){
	this._able(allTags, allNeeded, cache, false);
}


// Enable all controls with one (or all if allNeeded is true) of the tags
// in allTags.
// If allTags is undefined, enable the ControlManager.
// (allTags can also be a string)
// If cache is set to true, store the current state of the control.
ControlManager.prototype.enable = function(allTags, allNeeded, cache){
	this._able(allTags, allNeeded, cache, true);
}

ControlManager.prototype._able = function(allTags, allNeeded, cache, enabled){
	if (!booleanable(allNeeded)) allNeeded = false;
	if (!booleanable(cache)) cache = false;

	

	if (typeof(allTags) === "undefined"){
		if (cache){
			this._cached.enabled.push(this.enabled);
		}

		this.enabled = enabled;
	}
	else{
		var allControls = this.getByTag(allTags, allNeeded);

		for(var i in allControls){
			allControls[i]._able(enabled, cache);
		}
	}
}


ControlManager.prototype.rollback = function(type, allTags, allNeeded){
	if (!booleanable(allNeeded)) allNeeded = false;
	if (typeof(type) != "string") type = "all";

	if (typeof(allTags) === "undefined"){
		if ((type == "target") || (type == "all")){
			if (this._cached.target.length > 0){
				this.target = this._cached.target.pop();
			}
		}
		
		if ((type == "enabled") || (type == "all")){
			if (this._cached.enabled.length > 0){
				this.enabled = this._cached.enabled.pop();
			}
		}

		if ((type == "type") || (type == "all")){
			if (this._cached.type.length > 0){
				this.type = this._cached.type.pop();
			}
		}
	}
	else{
		var allControls = this.getByTag(allTags, allNeeded);

		for(var i in allControls){
			allControls[i].rollback(type);
		}
	}
}

ControlManager.prototype.swap = function(cache){
	if (!booleanable(cache)) cache = false;

	if (cache){
		this._cached.type.push(this.type);
	}

	this.type = 1 * ! this.type;

	if (this.type == CONTROL_GAMEPAD){
		if (!this.pad.connected){
			this.type = CONTROL_KEYBOARD;
		}
	}
}
/******************************************************************************/
/* ControlManager */
/******************/

/**********************/
/* Control Squeletton */
/******************************************************************************/
var ControlSqueletton = function(manager, functionName, signal, allTags, target,
								 fps){
	if (typeof(manager) != "object") return;
	if ((typeof(target) != "undefined") &&
		(typeof(target) != "object") && (target != -1)) return;
	if (typeof(target) === "undefined") target = -1;
	if (typeof(functionName) != "string") return;
	if (typeof(fps) == "undefined") fps = 0;
	if ((typeof(fps) != "number") ||
	   (fps < 0)) return;

	if (typeof(signal) === "undefined") signal = "update";
	
	this.manager = manager;
	this.target = target;
	this.functionName = functionName;
	this.signal = signal;
	this.allTags = [];
	this.fps = fps;
	this._fps = 0;

	this.enabled = true;

	this.transcendental = false;
	     
	this._cached = {
		target: [],
		enabled: [],
		functionName: [],
		signal: [],
		fps: []
	};

	this._canFire = true;

	if (fps){
		manager.onUpdate.add(this._checkFire, this);
	}

	if (typeof(allTags) === "object"){
		for(var i = 0; i < allTags.length; i++) {
			this.allTags.push(allTags[i]);
		}
	}
	else{
		this.allTags.push(allTags);
	}
}

ControlSqueletton.prototype._checkFire = function(){
	if (this._fps <= 0){
		this._fps = 0;

		this._canFire = true;

		return;
	}

	this._fps--;
}

ControlSqueletton.prototype.setTarget = function(target, cache){
	if (typeof(target) === "undefined"){
		return;
	}

	if (!booleanable(cache)) cache = false;

	if (cache){
		this._cached.target.push(this.target);
	}

	this.target = target;
}

ControlSqueletton.prototype.setFunction = function(functionName, cache){
	if (typeof(functionName) != "string"){
		return;
	}

	if (!booleanable(cache)) cache = false;

	if (cache){
		this._cached.functionName.push(this.functionName);
	}

	this.functionName = functionName;
}

ControlSqueletton.prototype.setFps = function(fps, cache){
	if ((typeof(fps) != "number") ||
		(fps < 0)){
		return;
	}

	if (!booleanable(cache)) cache = false;

	if (cache){
		this._cached.fps.push(this.fps);
	}

	if (this.fps){
		this.manager.onUpdate.remove(this._checkFire);
	}
	
	this.fps = fps;
	this._fps = 0;

	if (fps){
		this.manager.onUpdate.add(this._checkFire, this);
	}
}

ControlSqueletton.prototype.setSignal = function(signal, cache){
	if (typeof(signal) != "string"){
		return;
	}

	if (!booleanable(cache)) cache = false;
	
	if (cache){
		this._cached.signal.push(this.signal);
	}

	this.signal = signal;
}

ControlSqueletton.prototype.enable = function(cache){
	this._able(true, cache);
}

ControlSqueletton.prototype.disable = function(cache){
	this._able(false, cache);
}

ControlSqueletton.prototype._able = function(enabled, cache){
	if (!booleanable(enabled)) enabled = true;
	if (!booleanable(cache)) cache = false;

	if (cache){
		this._cached.enabled.push(this.enabled);
	}

	this.enabled = enabled;
}

ControlSqueletton.prototype.rollback = function(type){
	if (typeof(type) == "object"){
		for(var i in type){
			this.rollback(type[i]);
		}

		return;
	}

	if (typeof(type) != "string") type = "all";

	if ((type == "target") || (type == "all")){
		if (this._cached.target.length > 0){
			this.target = this._cached.target.pop();
		}
	}
	
	if ((type == "enabled") || (type == "all")){
		if (this._cached.enabled.length > 0){
			this.enabled = this._cached.enabled.pop();
		}
	}

	if ((type == "function") || (type == "all")){
		if (this._cached.functionName.length > 0){
			this.functionName = this._cached.functionName.pop();
		}
	}

	if ((type == "signal") || (type == "all")){
		if (this._cached.signal.length > 0){
			this.setSignal(this._cached.signal.pop());
		}
	}

	if ((type == "fps") || (type == "all")){
		if (this._cached.fps.length > 0){
			this.setFps(this._cached.fps.pop());
		}
	}
}

ControlSqueletton.prototype.getFunction = function(){
	if (!this.manager.enabled ||
		!this.enabled){
		return null;
	}

	if (!this._canFire){
		return null;
	}

	if (typeof(this.target) === "undefined"){
		return null;
	}

	var target = (this.target == -1) ? this.manager.target : this.target;

	if (target == null){
		if (typeof(window[this.functionName]) === "function"){
			return window[this.functionName];
		}
		else{
			return null;
		}
	}
	else{
		if (typeof(target[this.functionName]) === "function"){
			return target[this.functionName];
		}
		else{
			return null;
		}
	}
}

ControlSqueletton.prototype.destroy = function(){
	this.manager.onUpdate.remove(this._checkFire);

	this.manager = null;
	this.functionName = null;
	this.signal = null;
	this.allTags = [];
	this.target = undefined;
	this.enabled = false;
	this.fps = 0;

	this._cached = null;
	this._canFire = false;
	this._fps = -1;
}
/******************************************************************************/
/* Control Squeletton */
/**********************/

/***********/
/* Control */
/******************************************************************************/

var Control = function(manager, keyboardCode, gamepadCode, functionName, signal,
					   allTags, target, fps){
	if (typeof(keyboardCode) != "number") return;
	if (typeof(gamepadCode) != "number") return;

	ControlSqueletton.call(this, manager, functionName, signal, allTags, target,
						   fps);

	this.inputKeyboard = manager.keyboard.addKey(keyboardCode);

	try{
		this.inputGamepad = manager.pad.getButton(gamepadCode);
	}
	catch(err){
		this.inputGamepad = null;
	}

	this.keyboardCode = keyboardCode;
	this.gamepadCode = gamepadCode;

	this._cached.keyboardCode = [];
	this._cached.gamepadCode =  [];

	this.setSignal(signal);
}

Control.prototype = Object.create(ControlSqueletton.prototype);
Control.prototype.constructor = Control;

Control.prototype.setSignal = function(signal, cache){
	if (typeof(signal) != "string"){
		return;
	}

	this.removeSignal();

	var signalKeyboard = null;
	var signalGamepad = null;

	if ((signal == "update") ||
		(signal == "down") ||
		(signal == "up")){
		signalKeyboard = this.manager.onUpdate;
		signalGamepad = this.manager.onUpdate;
	}
	else if (signal == "onDown"){
		if (this.inputKeyboard != null){
			signalKeyboard = this.inputKeyboard.onDown;
		}

		if (this.inputGamepad != null){
			signalGamepad = this.inputGamepad.onDown;
		}
	}
	else if (signal == "onUp"){
		if (this.inputKeyboard != null){
			signalKeyboard = this.inputKeyboard.onUp;
		}
		
		if (this.inputGamepad != null){
			signalGamepad = this.inputGamepad.onUp;
		}
	}
	else if (signal == "onFloat"){
		if (this.inputKeyboard != null){
			signalKeyboard = this.inputKeyboard.onFloat;
		}
		
		if (this.inputGamepad != null){
			signalGamepad = this.inputGamepad.onFloat;
		}
	}

	if (signalKeyboard != null){
		signalKeyboard.add(this.executeKeyboard, this);
	}

	if (signalGamepad != null){
		signalGamepad.add(this.executeGamepad, this);
	}

	if ((signalKeyboard != null) ||
		(signalGamepad != null)){
		ControlSqueletton.prototype.setSignal.call(this, signal, cache);
	}
}

Control.prototype.rollback = function(type){
	if (typeof(type) == "object"){
		for(var i in type){
			this.rollback(type[i]);
		}

		return;
	}

	if (typeof(type) != "string") type = "all";

	ControlSqueletton.prototype.rollback.call(this, type);
	
	if ((type == "code") || (type == "all")){
		if (this._cached.keyboardCode.length > 0){
			this.change(this._cached.keyboardCode.pop());
		}
	}
	
	if ((type == "code") || (type == "all")){
		if (this._cached.gamepadCode.length > 0){
			this.change(-1, this._cached.gamepadCode.pop());
		}
	}
}

Control.prototype.change = function(keyboardCode, gamepadCode, signal, cache){
	if ((typeof(keyboardCode) != "number") ||
		(keyboardCode == -1)){
		keyboardCode = this.keyboardCode;
	}

	if ((typeof(gamepadCode) != "number") ||
		(gamepadCode == -1)){
		gamepadCode = this.gamepadCode;
	}

	if (typeof(signal) != "string"){
		signal = this.signal;
	}

	if (!booleanable(cache)) cache = false;

	var manager = this.manager;
	var target = this.target;
	var functionName = this.functionName;
	var allTags = this.allTags;
	var cached = this._cached;
	var fps = this.fps;

	if (cache){
		cached.keyboardCode.push(this.keyboardCode);
		cached.gamepadCode.push(this.gamepadCode);
	}

	this.destroy();

	Control.call(this, manager, keyboardCode, gamepadCode, functionName, signal,
				 allTags, target, fps);

	this._cached = cached;
}

Control.prototype.executeKeyboard = function(){
	if (this.manager.type == CONTROL_KEYBOARD ||
		this.transcendental){
		this.execute(CONTROL_KEYBOARD);
	}
}

Control.prototype.executeGamepad = function(){
	if (this.manager.type == CONTROL_GAMEPAD ||
		this.transcendental){
		this.execute(CONTROL_GAMEPAD);
	}
}

Control.prototype.execute = function(type){
	var actualFunction = this.getFunction();

	if (actualFunction == null){
		return;
	}

	var target = (this.target == -1) ? this.manager.target : this.target;

	var input = null;
	
	input = (type == CONTROL_KEYBOARD) ? this.inputKeyboard : this.inputGamepad;

	if (input == null){
		return;
	}

	var toFire = false;

	switch(this.signal){
	case "down":
		toFire = input.isDown;
		break;
		
	case "up":
		toFire = input.isUp;
		break;
		
	default:
		toFire = true;
		break;
	}


	if (toFire){
		actualFunction.call(target, this);

		if (this.fps){
			this._fps = FPS / this.fps;
			
			this._canFire = false;
		}
	}
}


Control.prototype.removeSignal = function(){
	switch(this.signal){
	case "onDown":
		if (this.inputKeyboard != null){
			this.inputKeyboard.onDown.remove(this.executeKeyboard, this);
		}

		if (this.inputName != null){
			this.inputGamepad.onDown.remove(this.executeGamepad, this);
		}

		break;
		
	case "onUp":
		if (this.inputKeyboard != null){
			this.inputKeyboard.onUp.remove(this.executeKeyboard, this);
		}
		
		if (this.inputGamepad != null){
			this.inputGamepad.onUp.remove(this.executeGamepad, this);
		}
		
		break;
		
	case "onFloat":
		if (this.inputKeyboard != null){
			this.inputKeyboard.onFloat.remove(this.executeKeyboard, this);
		}
		
		if (this.inputGamepad != null){
			this.inputGamepad.onFloat.remove(this.executeGamepad, this);
		}
		
		break;
		
	default:
		if (this.manager != null){
			if (this.inputKeyboard != null){
				this.manager.onUpdate.remove(this.executeKeyboard, this);
			}
			
			if (this.inputGamepad != null){
				this.manager.onUpdate.remove(this.executeGamepad, this);
			}
		}
		break;
	}
}

Control.prototype.destroy = function(){
	this.removeSignal();

	this.inputKeyboard = null;
	this.inputGamepad = null;
	this.keyboardCode = -1;
	this.gamepadCode = -1;

	ControlSqueletton.prototype.destroy.call(this);
}
/******************************************************************************/
/* Control */
/***********/

/**************/
/* PadControl */
/******************************************************************************/
var PadControl = function(manager, axis, min, max, functionName, signal,
						  allTags, target){
	if (typeof(min) != "number") return;
	if (typeof(max) != "number") return;

	ControlSqueletton.call(this, manager, functionName, signal, allTags, target);
	
	this.axis = axis;
	this.min = min;
	this.max = max;
	
	this._cached.axis = [];

	this.setSignal(signal);
}

PadControl.prototype.setSignal = function(signal, cache){
	this.removeSignal();

	if (signal == "update"){
		signal = this.manager.onUpdate;
	}
	else if (signal == "onDown"){
		signal = this.manager.pad.onDown;
	}
	else if (signal == "onUp"){
		signal = this.manager.pad.onUp;
	}

	if (typeof(signal) != "string"){
		ControlSqueletton.prototype.setSignal(signal, cache);

		signal.add(this.execute, this);
	}
}

PadControl.prototype.rollback = function(type){
	if (typeof(type) == "object"){
		for(var i in type){
			this.rollback(type[i]);
		}

		return;
	}

	if (typeof(type) != "string") type = "all";

	ControlSqueletton.prototype.rollback.call(this, type);

	if ((type == "axis") || (type == "all")){
		if (this._cached.axis.length > 0){
			var axis = this._cached.axis.pop();

			this.axis = axis.axis;
			this.min = axis.min;
			this.max = axis.max;
		}
	}
}

PadControl.prototype.change = function(axis, min, max, signal, cache){
	if ((typeof(axis) != "object") ||
		(axis == -1)){
		axis = this.axis;
	}

	if ((typeof(min) != "number") ||
		(min == -1)){
		min = this.min;
	}

	if ((typeof(max) != "number") ||
		(max == -1)){
		max = this.max;
	}

	if (typeof(signal) != "string"){
		signal = this.signal;
	}

	var manager = this.manager;
	var target = this.target;
	var functionName = this.functionName;
	var allTags = this.allTags;
	var cached = this._cached;
	var fps = this.fps;

	cached.axis.push([this.axis, this.min, this.max]);

	this.destroy();

	PadControl.call(this, manager, axis, min, max, functionName, signal,
					allTags, target, fps);

	this._cached = cached;
}

PadControl.prototype.execute = function(){
	if ((this.manager.type != CONTROL_GAMEPAD) &&
		(!this.transcendental)){
		return;
	}

	var pad = this.manager.pad;

	if (!pad.connected){
		return;
	}
	

	var actualFunction = this.getFunction();

	var target = (this.target == -1) ? this.manager.target : this.target;


	if ((pad.axis(this.axis) >= this.min) && (pad.axis(this.axis) <= this.max)){

		if (toFire){
			actualFunction.call(target, this, pad.axis(this.axis));

			if (this.fps){
				this._fps = FPS / this.fps;
				
				this._canFire = false;
			}
		}
	}
}

PadControl.prototype.removeSignal = function(){
	var pad = this.manager.pad;
	
	switch(this.signal){
	case "onDown":
		pad.onDown.remove(this.execute, this);
		break;
		
	case "onUp":
		pad.onUp.remove(this.execute, this);
		break;
		
	default:
		this.manager.onUpdate.remove(this.execute, this);
		break;
	}
}

PadControl.prototype.destroy = function(){
	this.removeSignal();

	this.axis = null;
	this.min = -1;
	this.max = -1;

	ControlSqueletton.prototype.destroy.call(this);
}
/******************************************************************************/
/* PadControl */
/**************/
