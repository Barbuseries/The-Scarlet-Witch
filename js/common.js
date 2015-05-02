var WHITE = "#ffffff";
var BLACK = "#000000";
var RED = "#ff0000";
var GREEN = "#00ff00";
var BLUE = "#0000ff";
var YELLOW = "#ffff00";
var PINK = "#ff00ff";
var ORANGE = "#ff9900";
var GREY = "#999999";

var H_WHITE = 0xffffff;
var H_BLACK = 0x000000;
var H_RED = 0xff0000;
var H_GREEN = 0x00ff00;
var H_BLUE = 0x0000ff;
var H_YELLOW = 0xffff00;
var H_PINK = 0xff00ff;
var H_ORANGE = 0xff9900;
var H_GREY = 0x999999;

var FPS = 60.0;

var G_SQUARED = 96.2361;

function validIndex(index, array){
    if (typeof(index) != "number"){
        return false;
    }

    return (index < 0) ? 0 :
        (index >= array.length) ? 0 : 1;
}

function booleanable(value){
    return ((typeof(value) == "number") ||
            (typeof(value) == "boolean"));
}

function resumeLoopedTimer(loopedTimer){
    if (loopedTimer.paused == false){
        loopedTimer.start();
    }
    else{
        loopedTimer.resume();
    }
}

function resumeLoopedTween(loopedTween){
	if (loopedTween.isPaused == false){
        loopedTween.start();
    }
    else{
        loopedTween.resume();
    }
}

function createBasicMenuOption(menu, y, string, onSelectFunction, context){
	var newOption = new Option();

	var style = { font: "30px Arial", fill: WHITE};

	var newDisplay = menu.game.add.text(menu.width / 2, y,
										string, style);
	newOption.display = newDisplay;
	
	newDisplay.fontWeight = "bold";

    newDisplay.strokeThickness = 6;

	newDisplay.setShadow(0, 2, BLACK, 5);

	newDisplay.anchor.setTo(0.5);

	newOption.onOver.add(function(){
		this.display.scale.setTo(1.5);
		this.display.stroke = RED;
	}, newOption);

	newOption.onOut.add(function(){
		this.display.scale.setTo(1)
		this.display.fill = WHITE;
		this.display.stroke = BLACK;
	}, newOption);

	if (typeof(onSelectFunction) != "undefined"){
		newOption.onSelect.add(onSelectFunction, context);
	}

	menu.addOption(newOption);
	
	return newOption;
}

// Basic binding for a menu.
function bindMenu(){
	var controller = this.manager;
	var allMenuControls = controller.getByTag("menu");
	var oldMenu = allMenuControls[0].target;
	var rightControl = controller.get("goRight");
	var leftControl = controller.get("goLeft");
	var upControl = controller.get("goUp");
	var downControl = controller.get("goDown");

	if ((typeof(oldMenu) != "undefined") &&
		(oldMenu != null)){
		oldMenu.setFocus(false);
	}

	controller.setTargetByTag(this, "menu", false, true);
	controller.disable(["movement", "action", "system"], false, true);
	controller.get("menu_toggle").setFunction("close", true);


	// TODO: Add pad controls.
	if (this.horizontal){
		controller.get("menu_next").change(rightControl.keyboardCode,
										   rightControl.gamepadCode, -1,
										   true);
		controller.get("menu_previous").change(leftControl.keyboardCode,
											   leftControl.gamepadCode, -1,
											   true);
	}
	else{
		controller.get("menu_next").change(downControl.keyboardCode,
										  downControl.gamepadCode, -1,
										  true);
		controller.get("menu_previous").change(upControl.keyboardCode,
											   upControl.gamepadCode, -1,
											   true);
	}

	this.setFocus(true);
	
	this.onEndClose.add(function(){
		controller.rollback("target", "menu");
		controller.rollback("enabled", ["movement", "action", "system"]);
		controller.get("menu_toggle").rollback("function");
		controller.get("menu_next").rollback("code");
		controller.get("menu_previous").rollback("code");

		this.setFocus(false);
		
		if ((typeof(oldMenu) != "undefined") &&
			(oldMenu != null)){
			oldMenu.setFocus(true);
		}
	}, this);
}
