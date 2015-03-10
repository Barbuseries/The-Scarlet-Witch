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

	lucy.goLeft = function(controlInput){
		if (controlInput.input.isDown){
			lucy.animations.play("walkLeft");
			lucy.x -= 4;
		}
	}

	lucy.goRight = function(controlInput){
		if (controlInput.input.isDown){
			lucy.animations.play("walkRight");
			lucy.x += 4;
		}
	}

	lucy.goUp = function(controlInput){
		if (controlInput.input.isDown){
			lucy.y -= 5;
		}
	}

	lucy.goDown = function(controlInput){
		if (controlInput.input.isDown){
			lucy.y += 5;
		}
	}

	lucy.switchTarget = function(controlInput){
		lucy.animations.stop();
		controlInput.manager.setTarget(healthBar);
	}

	lucy.changeKeyCodes = function(controlInput){
		var control = controlInput.manager;
		
		control.rebindInput("leftInput", Phaser.Keyboard.J, "rotate");
	}

	lucy.disableInput = function(controlInput){
		controlInput.manager.disable("movement");

		controlInput.manager.rebindInput("ableInput", -1, "enableInput");
	}

	lucy.enableInput = function(controlInput){
		controlInput.manager.enable("movement");

		controlInput.manager.rebindInput("ableInput", -1, "disableInput");
	}

	lucy.rotate = function(controlInput){
		if (controlInput.input.isDown){
			lucy.angle += 5;
		}
		else{
			lucy.angle -= 5;
		}
	}

	lucy.stopLeft = function(controlInput){
		lucy.animations.stop();
		lucy.frame = 117;
	}

	lucy.stopRight = function(controlInput){
		lucy.animations.stop();
		lucy.frame = 143;
	}

	healthBar.goLeft = function(controlInput){
		if (controlInput.input.isDown){
			healthBar.x -= 5;
		}
	}

	healthBar.goRight = function(controlInput){
		if (controlInput.input.isDown){
			healthBar.x += 5;
		}
	}

	healthBar.goUp = function(controlInput){
		if (controlInput.input.isDown){
			healthBar.angle -= 5;
		}
	}

	healthBar.goDown = function(controlInput){
		if (controlInput.input.isDown){
			healthBar.angle += 5;
		}
	}

	healthBar.switchTarget = function(controlInput){
		controlInput.manager.setTarget(lucy);
	}

	healthBar.changeKeyCodes = function(controlInput){
		var control = controlInput.manager;

		control.swapInputs("upInput", "downInput");
		
	}

	lucy.control = new ControlManager(this.game, CONTROL_KEYBOARD, lucy);
	//perso.control.target = healthBar;

	lucy.control.bindInput("leftInput", Phaser.Keyboard.Q, "goLeft", "update",
						   "movement");
	lucy.control.bindInput("rightInput", Phaser.Keyboard.D, "goRight", "update",
						   "movement");
	lucy.control.bindInput("upInput", Phaser.Keyboard.Z, "goUp", "update",
						   "movement");
	lucy.control.bindInput("downInput", Phaser.Keyboard.S, "goDown", "update",
						   "movement");

	lucy.control.bindInput("stopLeftInput", Phaser.Keyboard.Q, "stopLeft",
						   "up");
	lucy.control.bindInput("stopRightInput", Phaser.Keyboard.D, "stopRight",
						  "up");

	
	lucy.control.bindInput("switchInput", Phaser.Keyboard.TAB, "switchTarget",
							"down");
	lucy.control.bindInput("changeKey", Phaser.Keyboard.SPACEBAR, "changeKeyCodes",
							"down");
	lucy.control.bindInput("ableInput", Phaser.Keyboard.ALT, "disableInput",
						   "down");
	
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
	
	lucy.control.update();
}
