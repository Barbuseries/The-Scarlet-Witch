BasicGame.MainMenu = function(game){
	this.music = null;
};

BasicGame.MainMenu.prototype.create = function(){
	BasicGame.sfx = {};

	this.game.world.alpha = 1;

	this.music = this.game.add.audio("mainTheme");
	BasicGame.sfx.cursorSelect = this.game.add.audio("cursor_select");
	
	BasicGame.allPlayers.p1.controller.setTargetByTag(BasicGame, "system");

	BasicGame.allPlayers.p1.setHero(null);
	BasicGame.allPlayers.p2.setHero(null);
	
	BasicGame.allPlayers.p1.controller.disable("action");
	BasicGame.allPlayers.p2.controller.disable("action");
	
	var centerX = this.game.camera.width / 2;
	var centerY = this.game.camera.height / 2;

	this.background = this.game.add.tileSprite(0, 0,
											   2 * centerX,
											   this.game.cache.getImage("sky").height,
											   "sky");
	this.background.scale.y = this.background.height / (2 * centerX - 10);

	this.ground = this.add.sprite(0, 2 * centerY - 10, "ground");
	this.ground.width = 2 * centerX;
	this.ground.height = 10;
	
	this.logo = this.game.add.sprite(centerX, 100, "logo");

	this.logo.scale.setTo(0.5);
	this.logo.anchor.setTo(0.5);

	this.menu = new Menu(this.game, BasicGame.allPlayers.p1.controller, "MainMenu",
						 centerX - 250, 0,
						 500,
						 500,
						 "", "icons");
	this.menu.horizontal = false;

	this.newGameOption = createBasicMenuOption(this.menu, 300, "Nouvelle Partie",
											   function(){
												   console.log("New !");
												   this.startGame();
											   }, this);
	this.loadGameOption = createBasicMenuOption(this.menu,  400, "Charger une Partie",
												function(){
												   console.log("Load !");
											   }, null);
	this.optionGameOption = createBasicMenuOption(this.menu, 500, "Options",
												  function(){
												   console.log("Options !");
											   }, null);
	this.exitGameOption = createBasicMenuOption(this.menu, 600, "Quitter",
												function(){
												   console.log("Exit !");
											   }, null);

	this.menu.cursor.frame = 5;

	BasicGame.confirmMenu = new ConfirmationMenu(BasicGame.allPlayers.p1.controller,
												 this.exit, this);

	this.exitGameOption.onSelect.add(function(){
		BasicGame.confirmMenu.toggle();
	}, this);

	this.menu.enableMouse();

	this.menu.createAnimation("toggle", "0", "-100", 1500, 1,
							  Phaser.Easing.Quadratic.Out, true);
	this.menu.createAnimation("close", "0", "-100", 1000, 0,
							  Phaser.Easing.Quadratic.Out);
	
	BasicGame.allPlayers.p1.controller.setTargetByTag(this.menu, "menu");

	this.menu.toggle();
	
	this.music.play("", 0, BasicGame.volume.music, true);
}

BasicGame.MainMenu.prototype.update = function(){
	this.background.tilePosition.x -= 1;
	
	for(var i in BasicGame.allPlayers) {
		BasicGame.allPlayers[i].controller.update();
	}
}

BasicGame.MainMenu.prototype.startGame = function(pointer){
	this.cleanUp();

	this.music.fadeOut(1000);
	this.music.onFadeComplete.addOnce(function(){
		this.state.start("Level_1");
	}, this);
}

BasicGame.MainMenu.prototype.cleanUp = function(){
	BasicGame.confirmMenu.close();

	this.menu.close();

	BasicGame.allPlayers.p1.controller.setTargetByTag(null, "menu");
	BasicGame.allPlayers.p2.controller.setTargetByTag(null, "menu");
}

BasicGame.MainMenu.prototype.exit = function(){
	this.cleanUp();
	this.music.stop();

	window.location.replace("site.html");
}


BasicGame.MainMenu.prototype.shutdown = function(){
	this.menu.destroy();
	this.menu = null;
	
	BasicGame.confirmMenu.destroy();
	BasicGame.confirmMenu = null;
}
