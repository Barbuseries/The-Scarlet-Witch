BasicGame.Game = function(game){
	
}

BasicGame.Game.prototype.preload = function(){
	this.game.time.advancedTiming = true;
}

var ground;
var sky;
var uiBackground;
var toto;
var totoMode;
var tata;
var sentence;
var sentence2;
var sentence3;
var sentence4;
var sentence5;
var sentence6;
var sentence7;
var sentence8;
var sentence9;
var textBox;
var dialogueBox;
var healthBar;
var status_UI;
var status_UI_2;
var perso;
var fps;

BasicGame.Game.prototype.create = function(){
	this.game.world.setBounds(0, 0, 3 * this.game.camera.width,
							  this.game.camera.height);

	ground = this.game.add.tileSprite(0, this.game.camera.height - 150,
									  this.game.world.width, 10,
									  "ground");

	sky = this.game.add.tileSprite(0, 0,
								   this.game.world.width,
								   this.game.cache.getImage('sky').height,
								   'sky');
	sky.scale.y = (this.game.camera.height - 150) / sky.height;

	fps = this.game.add.text(this.game.camera.width - 25, 10, "FPS : 0");
	fps.fill = WHITE;
	fps.font = "Arial";
	fps.fontSize = 24;
	fps.stroke = BLACK;
	fps.strokeThickness = 3;

	fps.anchor.setTo(1, 0);
	fps.fixedToCamera = true;

	perso = this.game.add.sprite(this.game.camera.width / 2, ground.y - 30,
								 "perso");
	lucy = this.game.add.sprite(0, ground.y - 64, "lucy");
	lucy.animations.add("walkLeft", [118, 119, 120, 121, 122, 123, 124, 125], 15);
	lucy.animations.add("walkRight", [144, 145, 146, 147, 148, 149, 150, 151], 15);

	uiBackground = this.game.add.sprite(0, ground.y + 10, "ground");
	uiBackground.tint = H_GREY;

	uiBackground.width = ground.width;
	uiBackground.height = 140;

	textBox = new TextBox(this.game,this.game.camera.width / 2 - 325,
						  this.game.camera.height / 2 - 50,
						  650, 100, "ground2", "ground",
						  true, true);
	textBox.outerBox.alpha = 0.4;
	textBox.innerBox.alpha = 1;

	textBox.setMarginV(10, 10);
	textBox.setMarginH(10, 10);

	
	toto = {};
	toto.name = "Barton";
	toto.dialogueAlign = "left";

	tata = {};
	tata.name = "Lucy";
	tata.dialogueAlign = "right";

	sentence = new Sentence(this.game, "Il était une fois, dans un pays très, très, très, très, très, très, très, très, très, très, très, très, très, vide... Un jeu qui peut maintenant avoir des boîtes de dialogue.\nMagnifique, n'est-ce pas ?\nQui c'est qui se charge de faire tous les dialogues ?\nC'est pas moi !", MOOD_ANGRY, toto);
	sentence0 = new Sentence(this.game, "Utilise les flêches droite et gauche pour te déplacer !", MOOD_NORMAL);

//	sentence0.phaserText.align = "center";

	textBox.fitSentenceToTextBox = false;
	textBox.addSentence(sentence);
	textBox.addSentence(sentence0);
	textBox.fitHeightToSentence(0);
//	textBox.fitDurationToSentence(0, 2000);
	textBox.fitSentenceToTextBox = true;
	textBox.fixedToCamera = true;
	
	
/*	sentence2 = new Sentence(this.game, "Ca marche !", MOOD_JOYFUL, null, 10);
	sentence3 = new Sentence(this.game, "Moi aussi !", MOOD_ANGRY);
	sentence4 = new Sentence(this.game, "Je me meurs... Arg.... Je... vais... mourir....\nEcoute... b...ien ce que... je... vais te d...ire...\nJe suis mort...\nAdieu...",
							 MOOD_DYING);
	sentence5 = new Sentence(this.game, "Hey ! C'est pas la classe ?!", MOOD_ANGRY, tata,
							 20);
*/
	//sentence.phaserText.align = "center";

	
//	textBox.addSentence(sentence, -1, 1);

//	textBox.addSentence(sentence5);
//	textBox.fitHeightToSentence(0, -1, 1);
	//textBox.addSentence(sentence3, 1000, 1);
	//textBox.addSentence(sentence4);
	
	textBox.createAnimation("toggle", "both", "both", 2000, 1, Phaser.Easing.Cubic.InOut);
	textBox.createAnimation("close", "both", "both", 2000, 1, Phaser.Easing.Cubic.InOut);

//	textBox.fitDurationToSentence(0, 1000);
	//textBox.createVerticalClose(1000, 0, Phaser.Easing.Bounce.Out);

//	textBox.createToggleTimer(1);
	//textBox.onEndClose.add(textBox.clear, textBox);

	//textBox.toggle();
	
	sentence6 = new Sentence(this.game, "La boîte de dialogue est fonctionnelle !",
							 MOOD_ANGRY, toto);
	textBox.toggle();

	sentence7 = new Sentence(this.game, "Maintenant, je peux me parler à moi même !",
							 MOOD_JOYFUL, toto);

	sentence8 = new Sentence(this.game, "Ou avec d'autres personnes !", MOOD_JOYFUL, tata);

	sentence9 = new Sentence(this.game, "Hey, salut sœurette !", MOOD_SAD, toto);
	
	sentence10 = new Sentence(this.game, "Un jour, je vous aurai !", MOOD_NORMAL, "???");

	dialogueBox = new DialogueBox(this.game, "ground2", "ground", true, true);
	dialogueBox.fixedToCamera = true;

	dialogueBox.textBox.setMarginV(5, 5);
	dialogueBox.textBox.setMarginH(10, 10);

	dialogueBox.textBox.outerBox.alpha = 0.4;
	
	dialogueBox.speakerBox.setMarginV(5, 5);
	dialogueBox.speakerBox.setMarginH(5, 5);
	dialogueBox.speakerBox.outerBox.alpha = 0.4;

	dialogueBox.textBox.addSentence(sentence6, 500);
	dialogueBox.textBox.addSentence(sentence7, 500);
	dialogueBox.textBox.addSentence(sentence8, 500);
	dialogueBox.textBox.addSentence(sentence9, 500);
	dialogueBox.textBox.addSentence(sentence10);

	dialogueBox.textBox.createAnimation("toggle", "both", "both", 2000, 1,
										Phaser.Easing.Cubic.InOut);
	/*dialogueBox.speakerBox.createAnimation("toggle", "both", "both", 2000, 1,
										   Phaser.Easing.Cubic.InOut);*/

	dialogueBox.textBox.createAnimation("close", "both", "both", 2000, 1,
										Phaser.Easing.Cubic.InOut);
	dialogueBox.toggle();
	
	toto = {};

	totoMode = new Mode(toto);
	// There should be a toto.addMode(totoMode) when it's done.

	// The stat belongs to totoMode NOT toto !
	// To get toto's stat, you need to add each activated modes' stat.
	// (When Mode is completely implemented...)
	totoMode.addStat("health", "Health", STAT_NO_LINK,  40);

	totoMode.addStat("level", "Level", STAT_NO_MAXSTAT, 1, -1, 1, 99);
	
	totoMode.addStat("endurance", "Endurance", STAT_PERCENT_LINK, 0);

	totoMode.addStat("special", "TOTO !", STAT_NO_LINK, 0, 100);
	totoMode.profilSprite = "perso";


	// The same as :
	// totoMode.health.growth.addTerme([[totoMode.getStat, totoMode, ["level"]], 10]);

	//totoMode.health.growth.addTerme([["_value", totoMode.level], 10]);
	/*totoMode.health.growth.addTerme([["_value", totoMode.level], 10], -1, -1,
									[["_value", totoMode.level], 2]);*/

	/*totoMode.health.growth.addTerme([[totoMode.getStatMax, totoMode,
									  ["endurance"]], 3]);*/

	function healthGrowth(){
		var basicValue = this.getBasic();
		var levelPart = this.entity.level.get() * 10;
		var endurancePart = this.entity.endurance.getMax() * 3;
		
		return basicValue + levelPart + endurancePart;
	}

	totoMode.health.setGrowth(healthGrowth, totoMode.health, []);

	totoMode.level.onUpdate.add(totoMode.health.grow,
								totoMode.health);

	totoMode.endurance.onUpdateMax.add(totoMode.health.grow,
									   totoMode.health);

	totoMode.engage();
	totoMode.endurance.addMax(50);
	totoMode.level.add(10);
	

	// WIZARDRY ! totoMode.health.maxValue has changed too !
	console.log(totoMode.health);

	console.log(totoMode);
	
	healthBar = new MonoGauge(this.game, -25 + perso.width / 2, -10, 50, 5, totoMode.health,
							  H_RED, H_BLACK);
	perso.addChild(healthBar);

	lucy.goLeft = function(control, factor){
		if (typeof(factor) === "undefined"){
			factor = 1;
		}

		lucy.animations.play("walkLeft", 15 * Math.abs(factor));
		lucy.x -= 4 * Math.abs(factor);
	}

	lucy.goRight = function(control, factor){
		if (typeof(factor) === "undefined"){
			factor = 1;
		}

		lucy.animations.play("walkRight", 15 * Math.abs(factor));
		lucy.x += 4 * Math.abs(factor);
	}

	lucy.goUp = function(control, factor){
		if (typeof(factor) === "undefined"){
			factor = 1;
		}

		lucy.y -= 5 * Math.abs(factor);
	}

	lucy.goDown = function(control, factor){
		if (typeof(factor) === "undefined"){
			factor = 1;
		}

		lucy.y += 5 * Math.abs(factor);
	}

	lucy.switchTarget = function(control, factor){
		lucy.animations.stop();
		control.manager.target = healthBar;
	}

	lucy.changeKeyCodes = function(control){
		control.manager.bindControl("leftControl", Phaser.Keyboard.J, "rotate",
									"update");
	}

	lucy.disableControl = function(control){
		control.manager.disable("movement");

		control.manager.bindControl("ableControl", -1, "enableControl");
	}

	lucy.enableControl = function(control){
		control.manager.enable("movement");

		control.manager.bindControl("ableControl", -1, "disableControl");
	}

	lucy.rotate = function(control){
		if (control.input.isDown){
			lucy.angle += 5;
		}
		else{
			lucy.angle -= 5;
		}
	}

	lucy.stopLeft = function(control){
		lucy.animations.stop();
		lucy.frame = 117;
	}

	lucy.stopRight = function(control){
		lucy.animations.stop();
		lucy.frame = 143;
	}

	healthBar.goLeft = function(control){
		healthBar.x -= 5;
	}

	healthBar.goRight = function(control){
		healthBar.x += 5;
	}

	healthBar.goUp = function(control){
		healthBar.angle -= 5;
	}

	healthBar.goDown = function(control){
		healthBar.angle += 5;
	}

	healthBar.switchTarget = function(control){
		control.manager.target = lucy;
	}

	healthBar.changeKeyCodes = function(control){
		control.manager.swapControls("upControl", "downControl");
	}

	lucy.controlManager = new ControlManager(this.game, CONTROL_KEYBOARD, lucy);
	lucy.controlManager2 = new ControlManager(this.game, CONTROL_GAMEPAD, lucy, "pad1");
	//perso.control.target = healthBar;
	
	lucy.controlManager2.bindControl("right", Phaser.Gamepad.XBOX360_DPAD_RIGHT,
									 "goRight",
									 "down", "movement");
	lucy.controlManager2.bindControl("left", Phaser.Gamepad.XBOX360_DPAD_LEFT,
									 "goLeft",
									 "down", "movement");
	lucy.controlManager2.bindControl("up", Phaser.Gamepad.XBOX360_DPAD_UP,
									 "goUp",
									 "down", "movement");
	lucy.controlManager2.bindControl("down", Phaser.Gamepad.XBOX360_DPAD_DOWN,
									 "goDown",
									 "down", "movement");
	
	lucy.controlManager2.bindPadControl("rightPad", Phaser.Gamepad.XBOX360_STICK_LEFT_X,
										0.1, 1, "goRight", "update", "movement", -1);
	lucy.controlManager2.bindPadControl("leftPad", Phaser.Gamepad.XBOX360_STICK_LEFT_X,
										-1, -0.1, "goLeft", "update", "movement", -1);
	lucy.controlManager2.bindPadControl("upPad", Phaser.Gamepad.XBOX360_STICK_LEFT_Y,
										-1, -0.1, "goUp", "update", "movement", -1);
	lucy.controlManager2.bindPadControl("downPad", Phaser.Gamepad.XBOX360_STICK_LEFT_Y,
										0.1, 1, "goDown", "update", "movement", -1);

	/*lucy.controlManager2.bindPadControl("padHorizontal", Phaser.Gamepad.XBOX360_STICK_RIGHT_X,
								 0.1, 1, "goRight", "update", "movement", -1);*/

	lucy.controlManager.bindControl("leftControl", Phaser.Keyboard.Q, "goLeft",
									"down", "movement");
	lucy.controlManager.bindControl("rightControl", Phaser.Keyboard.D, "goRight",
									"down", "movement");
	lucy.controlManager.bindControl("upControl", Phaser.Keyboard.Z, "goUp",
									"down", "movement");
	lucy.controlManager.bindControl("downControl", Phaser.Keyboard.S, "goDown",
									"down", "movement");

	lucy.controlManager.bindControl("stopLeftControl", Phaser.Keyboard.Q, "stopLeft",
									"onUp");
	lucy.controlManager.bindControl("stopRightControl", Phaser.Keyboard.D, "stopRight",
									"onUp");
	
	
	lucy.controlManager.bindControl("switchControl", Phaser.Keyboard.TAB,
									"switchTarget",
									"onDown");
	lucy.controlManager.bindControl("changeKey", Phaser.Keyboard.SPACEBAR,
									"changeKeyCodes",
									"onDown");
	lucy.controlManager.bindControl("ableControl", Phaser.Keyboard.ALT,
									"disableControl",
									"onDown");
	
	lucy.controlManager.bindControl("dialogue", Phaser.Keyboard.A, "nextSentence",
									"onDown", "menu",
									textBox);
	lucy.controlManager.bindControl("textbox", Phaser.Keyboard.E, "nextSentence",
									"onDown", "menu",
									dialogueBox.textBox);
	
	//lucy.control.bindInput("rotationInput", Phaser.Keyboard.Z, "rotate");
	//perso.control.leftInput.enabled = false;

	/*healthBar.increaseSpeed = 0.33;
	healthBar.increaseAlpha = 0.4;*/

	healthBar.allowIncreaseAnimation = false;
	healthBar.allowDecreaseAnimation = false;
	healthBar.valueDisplayType = GAUGE_NONE;
	healthBar.updateValueText();

	/*healthBar.decreaseSpeed = 0.1;
	healthBar.decreaseAlpha = 0.4;
	healthBar.decreaseColor = H_RED;*/

//	healthBar.visible = false;
	//totoMode.health.subtract(100000);
	
	//totoMode.health.add(1000000);

	status_UI = new Status_UI(this.game, totoMode, 25, 10);
	status_UI.healthBar.valueDisplayType = GAUGE_NONE;
	status_UI.healthBar.updateValueText();
	status_UI.specialBar.valueDisplayType = GAUGE_NONE;
	status_UI.specialBar.updateValueText();
	status_UI.scale.setTo(0.5);
	
	status_UI_2 = new Status_UI(this.game, totoMode, 25, ground.y + 20);
//	status_UI_2.scale.setTo(0.75);

	this.game.world.bringToTop(dialogueBox);

	this.game.camera.follow(lucy);
	
}
var i = 0;
BasicGame.Game.prototype.update = function(){
	i++;

	/*if (dialogueBox.textBox.displayState != TEXTBOX_CLOSED){
		status_UI.visible = false;
		status_UI_2.visible = false;
	}
	else{
		status_UI.visible = true;
		status_UI_2.visible = true;
	}*/

	fps.text = "FPS : " + this.game.time.fps.toString();
	
	if (!(i%45)){
		totoMode.health.subtract(25);
		totoMode.special.add(5);
	}
	
	if (!(i%60)){
		totoMode.health.add(55);
		totoMode.special.add(10);
	}

	if (!(i%4)){
		totoMode.special.subtract(1);
	}

	if (!(i%150)){
		totoMode.level.add(5);
	}

	if (!(i%200)){
		totoMode.endurance.addMax(5);
	}

	/*if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT)){
		perso.x -= 5;
		sky.tilePosition.x += 1;
	}

	if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)){
		perso.x += 5;
		sky.tilePosition.x -= 1;
	}*/
	
	lucy.controlManager.update();
	lucy.controlManager2.update();
}
