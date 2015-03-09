/******************/
/* ControlManager */
/******************************************************************************/
var CONTROL_KEYBOARD = 0;
var CONTROL_GAMEPAD = 1;

var ControlManager = function(game, type, target){
	this.game = game;

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
   The function, when called will be sent as parameter the input.

   inputName : (string) name of the ControlManager attributs
               => inputName = "leftInput" => this.leftInput refers to it.

   inputCode : (number) key or button code. (Phaser.Keyboard.LEFT, for example)

   functionName : (string) name of the function to be binded.
                  As the function is created in ControlManager, please refrain
                  from using an existing one...

   signal : (string) when to call the function.
            => "update" : call when ControlManager.update() is called.
			=> "down" : call when input is down.
			=> "up" : call when input is up.
*/
ControlManager.prototype.bindInput = function(inputName, inputCode, functionName,
											  signal){
	if (typeof(inputName) != "string") return;
	if (typeof(inputCode) != "number") return;
	if (typeof(functionName) != "string") return;
	
	if (this.type == CONTROL_KEYBOARD){
		this[inputName] = this.game.input.keyboard.addKey(inputCode);
	}
	else if (this.type == CONTROL_GAMEPAD){
		// TODO: Later...
	}

	this[inputName]["function"] = functionName;
	this[inputName].manager = this;

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
		signal = this[inputName].onDown;
	}

	if (signal == "up"){
		this[inputName].signal = "up";
		signal = this[inputName].onUp;
	}

	signal.add(this[functionName], this);
}

// Change the inputName's key/button code to inpuCode.
ControlManager.prototype.rebindInput = function(inputName, inputCode){
	if (typeof(inputName) != "string") return;
	if (typeof(inputCode) != "number") return;
	
	if (typeof(this[inputName]) === "undefined") return;

	var inputFunction = this[inputName].function;
	var inputSignal = this[inputName].signal;

	this.unbindInput(inputName);

	if (this.type == CONTROL_KEYBOARD){
		this.bindInput(inputName, inputCode, inputFunction, inputSignal);
	}
	else if (this.type == CONTROL_GAMEPAD){
		// TODO: Later...
	}
}

// Remove the binding of the given input (by name).
ControlManager.prototype.unbindInput = function(inputName){
	if (typeof(inputName) != "string") return;
	if (typeof(this[inputName]) === "undefined") return;

	var inputFunction = this[inputName].function;
	var inputSignal = this[inputName].signal;


	switch (inputSignal){
	case "down":
		this[inputName].onDown.remove(this[inputFunction], this);
		break;
		
	case "up":
		this[inputName].onUp.remove(this[inputFunction], this);
		break;
		
	case "update":
		this.onUpdate.remove(this[inputFunction], this);
		break;
		
	default:
		break;
	}

	if (this.type == CONTROL_KEYBOARD){
		this.game.input.keyboard.removeKeyCapture(this[inputName].keyCode);
		this[inputName] = null;
	}
	else if (this.type == CONTROL_GAMEPAD){
		// TODO: Later...

		this[inputName] = null;
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
		inputCode1 = this[inputName1].keyCode;
		inputCode2 = this[inputName2].keyCode;
	}
	else if (this.type == CONTROL_GAMEPAD){
		inputCode1 = this[inputName1].buttonCode;
		inputCode2 = this[inputName2].buttonCode;
	}
	
	var inputFunction1 = this[inputName1].function;
	var inputFunction2 = this[inputName2].function;

	var inputSignal1 = this[inputName1].signal;
	var inputSignal2 = this[inputName2].signal;
	
	
	this.unbindInput(inputName1);
	this.unbindInput(inputName2);

	// If type === 0, swap the key/buttonCodes. 
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
			if (property.function != "undefined"){
				this[property.function] = function(input){
					if (this.target == null) return;

					if (typeof(this.target[property.function]) === "function"){
						this.target[property.function](input);
					}
				}
			}
		}
	}
}
/******************************************************************************/
