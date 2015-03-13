/******************/
/* ControlManager */
/******************************************************************************/
var CONTROL_KEYBOARD = 0;
var CONTROL_GAMEPAD = 1;

/* Store controls and handle their rebinding, swap, ...
   type : (number) CONTROL_KEYBOARD => enable key binding.
                   CONTROL_GAMEPAD => enable button binding and joystick handling.

   target : (object) the object whose methods will be called.
            By default, all controls share the same target as the ControlManager,
			but you can specify it for each control.

   pad : (string) which pad to use with CONTROL_GAMEPAD.
         ("pad1", "pad2", "pad3" or "pad4")
*/
var ControlManager = function(game, type, target, pad){
	this.game = game;

	if(type == CONTROL_GAMEPAD){
		if (!game.input.gamepad.active){
			game.input.gamepad.start();
		}
		
		this.pad = game.input.gamepad[pad];
	}
	else if (type == CONTROL_KEYBOARD){
		this.keyboard = game.input.keyboard;
	}

	this.type = type;
	this.target = target;
	this.allControls = {};

	this.onUpdate = new Phaser.Signal();
}

// Call each control's function with "update" as signal.
// "this" is not dispatched to a function binded to a control, it's the control itself.
ControlManager.prototype.update = function(){
	this.onUpdate.dispatch(this);
}


/* Bind a control to a function.
   If ControlManager refers to a Keyboard, bind the control to a key.
   Otherwhise, if it refers to a Gamepad, bind the control to a button.
   The function must be a method of target (otherwhise, it won't be called).
   The function, when called will be sent as parameter the control (control.input refers
   to the key/button).

   controlName : (string) name of the control (controlManager.allControls.controlName
                 will refer to the control)
                 => inputName = "leftInput" => this.leftInput refers to it.
				 If a control of the ControlManager has the same name, it will be
				 replaced.

   controlCode : (number) key or button code. (Phaser.Keyboard.LEFT, for example)
                 => -1 : if controlName is already a control of the ControlManager,
				 will copy the key.

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
			will copy the function.
*/
ControlManager.prototype.bindControl = function(controlName, controlCode, functionName,
												signal, allTags, target){
	var code;
	var funct;
	var sig;
	var targ;
	var tags;

	var manager = this;

	function setAfterCheck(){
		manager.bindControl(controlName, controlCode, functionName, signal, allTags,
							target);
	}
	if (this.type == CONTROL_GAMEPAD){
		if (!this.pad.connected){
			this.pad.addCallbacks(this, {onConnect: setAfterCheck});
			return;
		}
	}
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

		code = getFinalValue(controlCode, "code", 0);
		funct = getFinalValue(functionName, "functionName");
		sig = getFinalValue(signal, "signal");
		targ = getFinalValue(target, "target");
		tags = getFinalValue(allTags, "allTags");

		this.unbindControl(controlName);
	}
	else{
		code = controlCode;
		funct = functionName;
		sig = signal;
		targ = target;
		tags = allTags;
	}

	this.allControls[controlName] = new Control(this, code, funct, sig, tags, targ);
} 

ControlManager.prototype.bindPad = function(padName, axis, min, max, functionName,
											signal, allTags, target){
	if (this.type == CONTROL_KEYBOARD){
		return;
	}

	var manager = this;

	function setAfterCheck(){
		manager.bindPad(padName, axis, min, max, functionName, signal, allTags,
						target);
	}

	
	if (!this.pad.connected){
		this.pad.addCallbacks(this, {onConnect: setAfterCheck});
		return;
	}

	this.allControls[padName] = new PadControl(this, axis, min, max, functionName,
											   signal, allTags, target);
}

// Destroy the given control (by name).
ControlManager.prototype.unbindControl = function(controlName){
	if (typeof(controlName) != "string") return;
	if (typeof(this.allControls[controlName]) === "undefined") return;
	
	this.allControls[controlName].destroy();
	this.allControls[controlName] = undefined;	
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

	var controlCode1  = control1.code;
	var controlCode2 = control2.code;

	var controlFunction1 = control1.functionName;
	var controlFunction2 = control2.functionName;
	
	var controlSignal1 = control1.signal;
	var controlSignal2 = control2.signal;
	
	var allTags1 = control1.allTags;
	var allTags2 = control2.allTags;

	var target1 = control1.target;
	var target2 = control2.target;
	
	
	this.unbindControl(controlName1);
	this.unbindControl(controlName2);

	// If type == 0, swap the key/buttonCodes. 
	if (!type){
		this.bindControl(controlName1, controlCode2, controlFunction1, controlSignal1,
						 allTags2, target2);
		this.bindControl(controlName2, controlCode1, controlFunction2, controlSignal2,
						 allTags1, target1);
	}
	// Else, swap the functions (and the signals).
	else{
		this.bindControl(controlName1, controlCode1, controlFunction2, controlSignal2,
						 allTags2, target2);
		this.bindControl(controlName2, controlCode2, controlFunction1, controlSignal1,
						 allTags1, target1);
	}
}

// Return the control.
ControlManager.prototype.get = function(controlName){
	return this.allControls[controlName];
}

// Return an array of controls with the given tags.
// If allNeeded is true, a control must have every tags to be put into the array.
ControlManager.prototype.getByTag = function(allTags, allNeeded){
	if (typeof(target) === "undefined") return;
	if (!booleanable(allNeeded)) allNeeded = false;

	var returnControls = [];

	if (typeof(allTags) === "undefined"){
		for (control in this.allControls){
			returnControls.push(this.allControls[control]);
		}
	}
	else if (typeof(allTags) === "object"){
		for (control in this.allControls){	
			var i = 0;
			var foundCount = 0;
			
			if (allNeeded){
				while (validIndex(i, allTags)){
					if (this.allControls[control].allTags.indexOf(allTags[i]) != -1){
						foundCount++;
					}
				}

				if (foundCount == allTags.length){
					returnControls.push(this.allControls[control]);
				}
			}
			else{
				while (validIndex(i, allTags) && !foundCount){
					if (this.allControls[control].allTags.indexOf(allTags[i]) != -1){
						foundCount++;
					}
				}

				if (foundCount){
					returnControls.push(this.allControls[control]);
				}
			}	
		}
	}
	else if (typeof(allTags) === "string"){
		for (control in this.allControls){
			if (this.allControls[control].allTags.indexOf(allTags) != -1){
				returnControls.push(this.allControls[control]);
			}	
		}
	}

	return returnControls;
}

// Set the controls target to target.
// If controls is undefined, set the ControlManager's target to target.
ControlManager.prototype.setTarget = function(target, controls){
	if (typeof(target) === "undefined") return;

	if (typeof(controls) === "undefined"){
		this.target = target;
	}
	else if (typeof(controls) === "string"){
		this.allControls[controls].target = target;
	}
	else if (typeof(controls) === "object"){
		for(var i = 0; i < controls.length; i++) {
			this.allControls[controls].target = target;
		}
	}
}

// Set the target of every control with at least one of the tags in allTags to target.
// If allTags is undefined, set the ControlManager's target to target.
ControlManager.prototype.setTargetByTag = function(target, allTags, allNeeded){
	if (typeof(target) === "undefined") return;
	if (!booleanable(allNeeded)) allNeeded = false;

	if (typeof(allTags) === "undefined"){
		for (control in this.allControls){
			this.allControls[control].target = target;
		}
	}
	else if (typeof(allTags) === "object"){
		for (control in this.allControls){	
			var i = 0;
			var foundCount = 0;

			if (allNeeded){
				while (validIndex(i, allTags)){
					if (this.allControls[control].allTags.indexOf(allTags[i]) != -1){
						foundCount++;
					}
				}

				if (foundCount == allTags.length){
					this.allControls[control].target = target;
				}
			}
			else{
				while (validIndex(i, allTags) && !foundCount){
					if (this.allControls[control].allTags.indexOf(allTags[i]) != -1){
						foundCount++;
					}
				}

				if (found){
					this.allControls[control].target = target;
				}
			}		
		}
	}
	else if (typeof(allTags) === "string"){
		for (control in this.allControls){
			if (this.allControls[control].allTags.indexOf(allTags) != -1){
				this.allControls[control].target = target;
			}	
		}
	}
}

// Disable all controls with one of the tags in allTags.
// (allTags can also be a string)
ControlManager.prototype.disable = function(allTags){
	this._able(allTags, false);
}

// Enable all controls with one of the tags in allTags.
// (allTags can also be a string)
ControlManager.prototype.enable = function(allTags){
	this._able(allTags, true);
}

ControlManager.prototype._able = function(allTags, enabled){
	if (typeof(allTags) === "undefined"){
		for (control in this.allControls){
			this.allControls[control].input.enabled = enabled;
		}
	}
	else if (typeof(allTags) === "object"){
		for (control in this.allControls){	
			var i = 0;
			var found;
			
			while (validIndex(i, allTags) && !found){
				if (this.allControls[control].allTags.indexOf(allTags[i]) != -1){
					found = true;
				}
			}

			if (found){
				this.allControls[control].input.enabled = enabled;
			}		
		}
	}
	else if (typeof(allTags) === "string"){
		for (control in this.allControls){
			if (this.allControls[control].allTags.indexOf(allTags) != -1){
				this.allControls[control].input.enabled = enabled;
			}	
		}
	}
}
/******************************************************************************/
/* ControlManager */
/******************/

/***********/
/* Control */
/******************************************************************************/

var Control = function(manager, controlCode, functionName, signal,
					   allTags, target){

	if (typeof(manager) != "object") return;
	if ((typeof(target) != "undefined") &&
		(typeof(target) != "object") && (target != -1)) return;
	if (typeof(target) === "undefined") target = -1;
	if (typeof(controlCode) != "number") return;
	if (typeof(functionName) != "string") return;


	if (manager.type == CONTROL_KEYBOARD){
		this.input = manager.keyboard.addKey(controlCode);
	}
	else if (manager.type == CONTROL_GAMEPAD){
		this.input = manager.pad.getButton(controlCode);
	}

	this.manager = manager;
	this.target = target;
	this.functionName = functionName;
	this.code = controlCode;
	this.allTags = [];

	if ((typeof(signal) === "undefined") ||
		(signal == "update") ||
		(signal == "down") ||
		(signal == "up")){
		this.signal = signal;
		signal = manager.onUpdate;
	}
	else if (signal == "onDown"){
		this.signal = "onDown";
		signal = this.input.onDown;
	}
	else if (signal == "onUp"){
		this.signal = "onUp";
		signal = this.input.onUp;
	}
	else if (signal == "onFloat"){
		this.signal = "onFloat";
		signal = this.input.onFloat;
	}

	signal.add(this.execute, this);

	if (typeof(allTags) === "object"){
		for(var i = 0; i < allTags.length; i++) {
			this.allTags.push(allTags[i]);
		}
	}
	else{
		this.allTags.push(allTags);
	}
}

Control.prototype.execute = function(){	
	var target = (this.target == -1) ? this.manager.target : this.target;
	var actualFunction;

	if (target == null){
		if (typeof(this.functionName) === "function"){
			actualFunction = this.functionName;
		}
		else{
			return;
		}
	}
	else{
		if (typeof(target[this.functionName]) === "function"){
			actualFunction = target[this.functionName];
		}
		else{
			return;
		}
	}
	
	switch(this.signal){
		case "down":
		if (this.input.isDown) actualFunction.call(target, this);;
		break;

		case "up":
		if (this.input.isUp) actualFunction.call(target, this);;
		break;

		default:
		actualFunction.call(target, this);
		break;
	}
}


Control.prototype.destroy = function(){
	switch(this.signal){
		case "onDown":
		this.input.onDown.remove(this.execute, this);
		break;
		
		case "onUp":
		this.input.onUp.remove(this.execute, this);
		break;
		
		case "onFloat":
		this.input.onFloat.remove(this.execute, this);

		default:
		this.manager.onUpdate.remove(this.execute, this);
		break;
	}

	this.manager = null;
	this.input = null;
	this.code = -1;
	this.functionName = null;
	this.signal = null;
	this.allTags = [];
	this.target = undefined;
}

/******************************************************************************/
/* Control */
/***********/

/**************/
/* PadControl */
/******************************************************************************/
var PadControl = function(manager, axis, min, max, functionName, signal,
						  allTags, target){
	if (typeof(manager) != "object") return;
	if ((typeof(target) != "undefined") &&
		(typeof(target) != "object") && (target != -1)) return;
	if (typeof(target) === "undefined") target = -1;
	if (typeof(min) != "number") return;
	if (typeof(max) != "number") return;
	if (typeof(functionName) != "string") return;

	this.manager = manager;
	this.axis = axis;
	this.min = min;
	this.max = max;
	this.functionName = functionName;
	this.signal = signal;
	this.allTags = allTags;
	this.target = target;

	if (signal == "update"){
		manager.onUpdate.add(this.execute, this);
	}
}

PadControl.prototype.execute = function(){
	if (typeof(this.target) === "undefined") return;

	var target = (this.target == -1) ? this.manager.target : this.target;
	var actualFunction;
	var pad = this.manager.pad;

	if (target == null){
		if (typeof(this.functionName) === "function"){
			actualFunction = this.functionName;
		}
		else{
			return;
		}
	}
	else{
		if (typeof(target[this.functionName]) === "function"){
			actualFunction = target[this.functionName];
		}
		else{
			return;
		}
	}

	if ((pad.axis(this.axis) >= this.min) && (pad.axis(this.axis) <= this.max)){
		actualFunction.call(target, this, pad.axis(this.axis));
	}
}
/******************************************************************************/
/* PadControl */
/**************/
