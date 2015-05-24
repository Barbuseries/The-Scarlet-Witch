var WHITE = "#ffffff";
var BLACK = "#000000";
var RED = "#ff0000";
var GREEN = "#00ff00";
var BLUE = "#0000ff";
var YELLOW = "#ffff00";
var PINK = "#ff00ff";
var ORANGE = "#ff9900";
var GREY = "#999999";
var PURPLE = "#660066";

var H_WHITE = 0xffffff;
var H_BLACK = 0x000000;
var H_RED = 0xff0000;
var H_GREEN = 0x00ff00;
var H_BLUE = 0x0000ff;
var H_YELLOW = 0xffff00;
var H_PINK = 0xff00ff;
var H_ORANGE = 0xff9900;
var H_GREY = 0x999999;
var H_PURPLE = 0x660066;

var FPS = 60.0;

var G_SQUARED = 96.2361;

function validIndex(index, array){
    if (typeof(index) != "number"){
        return false;
    }

    return (index < 0) ? 0 :
        (index >= array.length) ? 0 : 1;
}

function swapInArray(array, i, j){
	var temp = array[i];

	array[i] = array[j];
	array[j] = temp;
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

	newOption.display = createBasicMenuOptionText(menu, y, string);


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

function createBasicMenuOptionText(menu, y, string){
	var style = { font: "20px Arial", fill: WHITE};
	
	var newText = menu.game.add.text(menu.width / 2, y,
									 string, style);
	
	newText.fontWeight = "bold";

    newText.strokeThickness = 6;

	newText.setShadow(0, 2, BLACK, 5);

	newText.anchor.setTo(0.5);
	
	return newText;
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
	controller.get("menu_select").setSignal("onDown", true);
	controller.get("menu_select").setFps(0, true);

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
	
	this.onEndClose.addOnce(function(){
		controller.rollback("target", "menu");
		controller.rollback("enabled", ["movement", "action", "system"]);
		controller.get("menu_toggle").rollback("function");
		controller.get("menu_next").rollback("code");
		controller.get("menu_previous").rollback("code");
		controller.get("menu_select").rollback(["signal", "fps"]);

		this.setFocus(false);
		
		if ((typeof(oldMenu) != "undefined") &&
			(oldMenu != null)){
			oldMenu.setFocus(true);
		}
	}, this);
}

var collideProjectile = function(projectile, obstacle){
	if (projectile.tag == "projectile"){
		if (projectile.collideFunction == null){
			return;
		}
		
		projectile.collideFunction.call(projectile,
										obstacle);
		if (typeof(obstacle.body) != "undefined"){
			if (!obstacle.body.immovable){
				obstacle.body.velocity.x += projectile.body.velocity.x *
					projectile.transfer.velocity.x;
				obstacle.body.velocity.y += projectile.body.velocity.y *
					projectile.transfer.velocity.y;
			}
		}
	}
}

var collideProcessProjectile = function(projectile, obstacle){
	if (projectile.tag == "projectile"){
		if (projectile.collideProcess == null){
			return false;
		}
		else{
			return (!obstacle._dying && projectile.collideProcess.call(projectile,
																	   obstacle));
		}
	}
	else{
		if (obstacle.tag == "projectile"){
			if (obstacle.collideProcess == null){
				return false;
			}
			else{
				return (!projectile._dying && obstacle.collideProcess.call(obstacle,
													projectile));
			}
		}
		else{
			return true;
		}
	}
}

var findObjectsByType = function(type, map, layer){
	var result = [];

	map.objects[layer].forEach(function(element) {
		if (element.properties.type === type) {
			// Phaser uses top left, Tiled bottom left so we have to adjust the y position
			// also keep in mind that the cup images are a bit smaller than the tile which is 16x16
			// so they might not be placed in the exact pixel position as in Tiled
			element.y -= map.tileHeight;
			result.push(element); 
		}
	});

	return result;
}

var createFromTiledObject = function(element, group) {
	var allConstructors = {
		mob: function(group, element){
			return createMob(group.game, element.x, element.y,
							 element.properties.sprite);
		},

		archer: function(group, element){
			return createArcher(group.game, element.x, element.y,
								element.properties.sprite, 1);
		},
		
		item: function(group, element){
			return null;
		}
	}
	
	var spriteName = element.properties.sprite;
	var constructor = spriteName.substring(0, spriteName.indexOf("_"));

	var object = allConstructors[constructor](group, element);

	if (object == null){
		return;
	}
	
	group.add(object);

	// copy all properties to the sprite
	Object.keys(element.properties).forEach(function(key){
		object[key] = element.properties[key];
	});

	object.y -= object.height / 2;
}

var getTileWorldXY =  function(layer, x, y){
	try{
		var grid = BasicGame.level.map.layers[layer].data;

		return grid[Math.floor(y / 32)][Math.floor(x / 32)];
	}
	catch(err){
		return null;
	}
}

var arrowElementChange = function(obstacle){
	// La flêche change d'élément en fonction de ce qu'elle rencontre.
	if (obstacle.tag == "projectile"){
		this.tint = H_WHITE;

		switch(obstacle.element){
		case Elements.ALMIGHTY:
			this.tint = H_GREY;
			break;
		case Elements.FIRE:
			this.tint = H_RED;
			break;
		case Elements.ICE:
			this.tint = H_BLUE;
			break;
		case Elements.WIND:
			this.tint = H_GREEN;
			break;
		case Elements.EARTH:
			this.tint = H_ORANGE;
			break;
		case Elements.THUNDER:
			this.tint = H_YELLOW;
			break;
		case Elements.POISON:
			this.tint = H_PURPLE;
			break;
		default:
			break;
		}

		this.element = obstacle.element;
	}
}


var basicUpdateSkillChargeTime = function(factor){
	if (typeof(factor) === "undefined"){
		factor = 1;
	}

	this.updateChargeTime = function(){
		Skill.prototype.updateChargeTime.call(this, factor *
											  this.user.allStats.attackSpeed.get());
	}

	this.user.allStats.attackSpeed.onUpdate.add(this.updateChargeTime, this);

	this.onDestroy.addOnce(function(){
		if (this.user.allStats.attackSpeed.onUpdate != null){
			this.user.allStats.attackSpeed.remove(this.updateChargeTime);
		}
	}, this);
}

var basicUpdateSkillCooldown = function(factor){
	if (typeof(factor) === "undefined"){
		factor = 1;
	}
	
	this.updateCooldown = function(){
		Skill.prototype.updateCooldown.call(this, this.user.allStats.attackSpeed.get());
	}

	this.user.allStats.attackSpeed.onUpdate.add(this.updateCooldown, this);

	this.onDestroy.addOnce(function(){
		if (this.user.allStats.attackSpeed.onUpdate != null){
			this.user.allStats.attackSpeed.onUpdate.remove(this.updateCooldown);
		}
	}, this);
}
