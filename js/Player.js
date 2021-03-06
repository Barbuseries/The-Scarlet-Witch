/**********/
/* Player */
/******************************************************************************/
var Player = function(game, index){
	this.controller = new ControlManager(game, CONTROL_KEYBOARD, null, "pad" + index);
	this.hero = null;
	this.isMain = false;
	this.humanAfterAll = false;
	this.index = index;
}

Player.prototype.swapControls = function(){
	this.controller.swap();
}

Player.prototype.getHero = function(){
	return this.hero;
}

Player.prototype.connectKeyboard = function(){
	if (!this.humanAfterAll){
		this.connect();
	}

	if (this.controller.type != CONTROL_KEYBOARD){
		this.controller.swap();
	}
}

Player.prototype.connectGamepad = function(){
	if (!this.humanAfterAll){
		this.connect();
	}

	if (this.controller.type != CONTROL_GAMEPAD){
		this.controller.swap();
	}
}

Player.prototype.connect = function(){
	if (!this.humanAfterAll){
		this.humanAfterAll = true;
		
		this.setHero(this.getHero());

		this.controller.connected = true;
		this.controller.enable(["action", "movement", "system"]);
	}
}

Player.prototype.setHero = function(hero){
	this.hero = hero;
	this.controller.target = this.hero;

	if (hero == null){
		return;
	}

	this.hero.player = this;
	
	if (this.hero.menu != null){
		this.hero.menu.manager = this.controller;
	}
	
	if (this.menu != null){
		this.menu.statusOption.display.text = hero.name;
	}

	var statusUi = this.hero.statusUi;

	if (this.isMain){
		statusUi.cameraOffset.x = 50;
		statusUi.cameraOffset.y = 565;

		this.hero.game.camera.follow(this.hero);
	}
	else{
		statusUi.cameraOffset.x = 25;
		statusUi.cameraOffset.y = 10;
		statusUi.scale.setTo(1);
	}

	statusUi.updateStatusSkills();
	statusUi.showStatusSkills();

	if (!this.humanAfterAll){
		if (BasicGame.level.ready){
			this.hero.startIA();
		}
	}
	else{
		this.hero.stopIA();
	}
}
/******************************************************************************/
/* Player */
/**********/
