/******************/
/* ControlManager */
/******************************************************************************/
var CONTROL_KEYBOARD = 0;
var CONTROL_GAMEPAD = 1;

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

	this.onUpdate = new Phaser.Signal();
}

// Call each input's function with "update" as signal.
// "this" is not dispatched to a function binded to an input.
// (Only if YOU decide to add a function to the onUpdate signal)
ControlManager.prototype.update = function(){
	this.onUpdate.dispatch(this);
}


/* Bind an input to a function.
   If ControlManager refers to a Keyboard, bind the input to a key.
   Otherwhise, if it refers to a Gamepad, bind the input to a button.
   The function must be a method of target (otherwhise, it won't be called).
   The function, when called will be sent as parameter the input (input.input refers
   to the key/button).

   inputName : (string) name of the ControlManager attribut
               => inputName = "leftInput" => this.leftInput refers to it.

   inputCode : (number) key or button code. (Phaser.Keyboard.LEFT, for example)

   functionName : (string) name of the function to be binded.
                  As the function is created in ControlManager, please refrain
                  from using an existing one...(and don't name it the same as an input)

   signal : (string) when to call the function.
            => "update" : call when ControlManager.update() is called.
			=> "down" : call when input is down.
			=> "up" : call when input is up.

   allTags : (string or array of strings) can be used to enable/disable
             a group of inputs.
*/
ControlManager.prototype.bindInput = function(inputName, inputCode, functionName,
											  signal, allTags){
	if (typeof(inputName) != "string") return;
	if (typeof(inputCode) != "number") return;
	if (typeof(functionName) != "string") return;

	this[inputName] = {};
	
	if (this.type == CONTROL_KEYBOARD){
		this[inputName].input = this.keyboard.addKey(inputCode);
	}
	else if (this.type == CONTROL_GAMEPAD){
		this[inputName].input = this.pad.addButton(inputCode);
	}

	this[inputName].function = functionName;
	this[inputName].manager = this;
	this[inputName].allTags = [];

	// What I thought would happen was that this.target would be dynamically
	// calculated when the function is called.
	// Instead, this.target is calculated here.
	// Therefore, I created setTarget, which will go trough each key and change
	// the value of this.target.
	// That's uglier than I thought, but still damn powerful!
	this[functionName] = function(self){
		if (this.target == null) return;

		if (typeof(this.target[functionName]) === "function"){
			this.target[functionName](this[inputName]);
		}
	}

	if ((typeof(signal) === "undefined") ||
		(signal == "update")){
		this[inputName].signal = "update";
		signal = this.onUpdate;
	}

	if (signal == "down"){
		this[inputName].signal = "down";
		signal = this[inputName].input.onDown;
	}

	if (signal == "up"){
		this[inputName].signal = "up";
		signal = this[inputName].input.onUp;
	}

	signal.add(this[functionName], this);

	if (typeof(allTags) === "object"){
		for(var i = 0; i < allTags.length; i++) {
			if (typeof(allTags[i]) === "string"){
				this[inputName].allTags.push(allTags[i]);
			}
		}
	}
	else if (typeof(allTags) === "string"){
		this[inputName].allTags.push(allTags);
	}
}

// Change the inputName's key/button code to inpuCode, it's function to inputFunction
// and it's signal to signal.
// If inputCode or inputFunction or signal is equal to -1 (or undefined), those values
// will refer to the input's ones.
ControlManager.prototype.rebindInput = function(inputName, inputCode, inputFunction,
												signal){
	if (typeof(inputName) != "string") return;
	if (typeof(inputCode) != "number") return;
	
	if (typeof(this[inputName]) === "undefined") return;

	if (inputCode == -1){
		if (this.type == CONTROL_KEYBOARD){
			inputCode = this[inputName].input.keyCode;
		}
		else if (this.type == CONTROL_GAMEPAD){
			inputCode = this[inputName].input.buttonCode;
		}
	}
	if ((typeof(inputFunction) === "undefined") ||
		(inputFunction == -1)){
		inputFunction = this[inputName].function;
	}

	if ((typeof(signal) === "undefined") ||
		(signal == -1)){
		signal = this[inputName].signal;
	}

	this.unbindInput(inputName);

	this.bindInput(inputName, inputCode, inputFunction, signal);
}

// Remove the binding of the given input (by name).
// Be careful, if there's no listener attached to the key/button, it will be destroyed.
ControlManager.prototype.unbindInput = function(inputName){
	if (typeof(inputName) != "string") return;
	if (typeof(this[inputName]) === "undefined") return;

	var inputFunction = this[inputName].function;
	var inputSignal = this[inputName].signal;

	switch (inputSignal){
	case "down":
		this[inputName].input.onDown.remove(this[inputFunction], this);
		break;
		
	case "up":
		this[inputName].input.onUp.remove(this[inputFunction], this);
		break;
		
	case "update":
		this.onUpdate.remove(this[inputFunction], this);
		break;
		
	default:
		break;
	}

	if (this.type == CONTROL_KEYBOARD){
		// If there's no event attached to the key, destroy it. 
		if (this[inputName].input.onDown.getNumListeners() +
			this[inputName].input.onUp.getNumListeners() == 0){
			this.keyboard.removeKey(this[inputName].keyCode);
		}

		this[inputName].input = null;

		this[inputName] = undefined;
	}
	else if (this.type == CONTROL_GAMEPAD){
		// If there's no event attached to the button, destroy it.
		if (this[inputName].input.onDown.getNumListeners() +
			this[inputName].input.onUp.getNumListeners() +
			this[inputName].input.onFloat.getNumListeners() == 0){
			this[inputName].input.destroy();
		}

		this[inputName].input = null;

		this[inputName] = undefined;
	}

	
}

// Swap two inputs.
// If type is 0, swap the inputs' codes.
// Otherwhise, swap the inputs' functions and signals. 
ControlManager.prototype.swapInputs = function(inputName1, inputName2, type){
	if ((typeof(inputName1) != "string") ||
		(typeof(inputName2) != "string")){
		return;
	}

	if ((typeof(this[inputName1]) === "undefined") ||
		(typeof(this[inputName2])) === "undefined"){
		return;
	}

	if (!booleanable(type)){
		type = 0;
	}

	var inputCode1;
	var inputCode2;

	if (this.type == CONTROL_KEYBOARD){
		inputCode1 = this[inputName1].input.keyCode;
		inputCode2 = this[inputName2].input.keyCode;
	}
	else if (this.type == CONTROL_GAMEPAD){
		inputCode1 = this[inputName1].input.buttonCode;
		inputCode2 = this[inputName2].input.buttonCode;
	}
	
	var inputFunction1 = this[inputName1].function;
	var inputFunction2 = this[inputName2].function;

	var inputSignal1 = this[inputName1].signal;
	var inputSignal2 = this[inputName2].signal;
	
	
	this.unbindInput(inputName1);
	this.unbindInput(inputName2);

	// If type == 0, swap the key/buttonCodes. 
	if (!type){
		this.bindInput(inputName1, inputCode2, inputFunction1, inputSignal1);
		this.bindInput(inputName2, inputCode1, inputFunction2, inputSignal2);
	}
	// Else, swap the functions (and the signals).
	else{
		this.bindInput(inputName1, inputCode1, inputFunction2, inputSignal2);
		this.bindInput(inputName2, inputCode2, inputFunction1, inputSignal1);
	}
}

ControlManager.prototype.setTarget = function(target){
	this.target = target;

	for(property in this){
		if (this.hasOwnProperty(property)){
			if (typeof(this[property].function) != "undefined"){
				this[property].function = function(controlInput){
					if (this.target == null) return;

					if (typeof(this.target[property].function) === "function"){
						this.target[property].function(this[inputName]);
					}
				}
			}
		}
	}
}

// Disable all inputs with one of the tags in allTags.
// (allTags can also be a string)
ControlManager.prototype.disable = function(allTags){
	this._able(allTags, false);
}

// Enable all inputs with one of the tags in allTags.
// (allTags can also be a string)
ControlManager.prototype.enable = function(allTags){
	this._able(allTags, true);
}

ControlManager.prototype._able = function(allTags, enabled){
	if (typeof(allTags) === "undefined"){
		for (property in this){
			if (this.hasOwnProperty(property)){
				if (typeof(this[property].allTags) != "undefined"){
					this[property].input.enabled = enabled;
				}
			}
		}
	}
	else if (typeof(allTags) === "object"){
		for (property in this){
			if (this.hasOwnProperty(property)){
				if (typeof(this[property].allTags) != "undefined"){
					var i = 0;
					var found;
					
					while (validIndex(i, allTags) && !found){
						if (this[property].allTags.indexOf(allTags[i]) != -1){
							found = true;
						}
					}

					if (found){
						this[property].input.enabled = enabled;
					}
				}
			}
		}
	}
	else if (typeof(allTags) === "string"){
		for (property in this){
			if (this.hasOwnProperty(property)){
				if (typeof(this[property].allTags) != "undefined"){
					if (this[property].allTags.indexOf(allTags) != -1){
						this[property].input.enabled = enabled;
					}
				}
			}
		}
	}
}
/******************************************************************************/
/* ControlManager */
/******************/
