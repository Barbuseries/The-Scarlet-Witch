var WHITE = "#ffffff";
var BLACK = "#000000";
var RED = "#ff0000";
var GREEN = "#00ff00";
var BLUE = "#0000ff";
var YELLOW = "#ffff00";
var PINK = "#ff00ff";
var ORANGE = "#ff9900";

var H_WHITE = 0xffffff;
var H_BLACK = 0x000000;
var H_RED = 0xff0000;
var H_GREEN = 0x00ff00;
var H_BLUE = 0x0000ff;
var H_YELLOW = 0xffff00;
var H_PINK = 0xff00ff;
var H_ORANGE = 0xff9900;
var H_GREY = 0x99999;

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

	var style = { font: "30px Arial", fill: "#ffffff"};

	var newDisplay = menu.game.add.text(menu.width / 2, y,
										string, style);
	newOption.display = newDisplay;
	
	newDisplay.fontWeight = "bold";

    newDisplay.strokeThickness = 6;

	newDisplay.anchor.setTo(0.5);

	newOption.onOver.add(function(){
		this.display.scale.setTo(1.5);
		this.display.stroke = '#ff0000';
	}, newOption);

	newOption.onOut.add(function(){
		this.display.scale.setTo(1)
		this.display.fill = "#ffffff";
		this.display.stroke = '#000000';
	}, newOption);

	if (typeof(onSelectFunction) != "undefined"){
		newOption.onSelect.add(onSelectFunction, context);
	}

	menu.addOption(newOption);
	
	return newOption;
}
