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
	
	
	this.unbindControl(controlName1);
	this.unbindControl(controlName2);

	// If type == 0, swap the key/buttonCodes. 
	if (!type){
		this.bindControl(controlName1, controlCode2, controlFunction1, controlSignal1);
		this.bindControl(controlName2, controlCode1, controlFunction2, controlSignal2);
	}
	// Else, swap the functions (and the signals).
	else{
		this.bindControl(controlName1, controlCode1, controlFunction2, controlSignal2);
		this.bindControl(controlName2, controlCode2, controlFunction1, controlSignal1);
	}
}

// Return the control.
ControlManager.prototype.get = function(controlName){
	return this.allControls[controlName];
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
		this.input = manager.pad.addButton(controlCode);
	}

	this.manager = manager;
	this.target = target;
	this.functionName = functionName;
	this.code = controlCode;
	this.allTags = [];

	if ((typeof(signal) === "undefined") ||
		(signal == "update")){
		this.signal = "update";
		signal = manager.onUpdate;
	}
	else if (signal == "down"){
		this.signal = "down";
		signal = this.input.onDown;
	}
	else if (signal == "up"){
		this.signal = "up";
		signal = this.input.onUp;
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
	if (this.target == null){
		if (typeof(this.functionName) === "function"){
			this.functionName();
		}
		
		return;
	}
	
	var target = (this.target == -1) ? this.manager.target : this.target;
	
	if (typeof(target[this.functionName]) === "undefined") return;

	target[this.functionName](this);
}


Control.prototype.destroy = function(){
	switch(this.signal){
		case "update":
		this.manager.onUpdate.remove(this.execute, this);
		break;
		
		case "down":
		this.input.onDown.remove(this.execute, this);
		break;
		
		case "up":
		this.input.onUp.remove(this.execute, this);
		break;

		default:
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