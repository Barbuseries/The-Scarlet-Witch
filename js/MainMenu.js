BasicGame.MainMenu = function(game){
	this.music = null;
};

BasicGame.MainMenu.prototype.create = function(){
	BasicGame.sfx = {};

	this.music = this.game.add.audio("mainTheme");
	BasicGame.sfx.cursorSelect = this.game.add.audio("cursor_select");

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

	function bind(){
		var controller = BasicGame.allPlayers.p1.controller;
		var allOldControls = controller.getByTag("menu");
		var toRemove = allOldControls.indexOf(controller.allControls["menu_toggle"]);
		var allOldCodes = [];
		var oldTarget = allOldControls[0].target;
		var oldFunction = null;

		if (typeof(oldTarget) != "undefined"){
			oldTarget.setFocus(false);
		}

		for(var i = 0; i < allOldControls.length; i++) {
			allOldControls[i].target = this;
			allOldCodes.push([allOldControls[i].keyboardCode,
							  allOldControls[i].gamepadCode]);
		}

		this.onEndClose.add(function(){
			if (typeof(oldTarget) != "undefined"){
				oldTarget.setFocus();
			}
			
			for(var i = 0; i < allOldControls.length; i++) {
				allOldControls[i].target = oldTarget;
				allOldControls[i].change(allOldCodes[i][0], allOldCodes[i][1]);
			}

			controller.allControls["menu_toggle"].functionName = oldFunction;
			controller.allControls["menu_toggle"].target = oldTarget;
		}, this);
		
		controller.allControls["menu_toggle"].functionName = "close";
		controller.allControls["menu_toggle"].target = this;

		if (this.horizontal){
			var leftControl = controller.allControls["goLeft"];
			var rightControl = controller.allControls["goRight"];

			controller.allControls["menu_next"].change(rightControl.keyboardCode,
													   rightControl.gamepadCode);
			controller.allControls["menu_previous"].change(leftControl.keyboardCode,
														   rightControl.gamepadCode);
		}
		
		this.setFocus(true);
	}

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
	

	this.cancelMenu = new Menu(this.game, this.control, "Etes-vous sûr ?",
					this.game.camera.width / 2 - 250,
					this.game.camera.height / 2 - 75,
					500, 150,
					"ground2", "icons");
	this.cancelMenu.background.tint = H_GREY;
	this.cancelMenu.title.fontWeight = "bold";
	this.cancelMenu.horizontal = true;
	this.cancelMenu.showTitle = true;
	this.cancelMenu.cursor.frame = 5;


	this.cancelMenu.onStartToggle.add(bind, this.cancelMenu);

	this.yesOption = createBasicMenuOption(this.cancelMenu, 100, "Oui !",
										   undefined, null);
	
	this.noOption = createBasicMenuOption(this.cancelMenu, 100, "Non !",
										  undefined, null);

	this.yesOption.display.x = 100;
	this.noOption.display.x = this.cancelMenu.width - 100;


	this.yesOption.onOver.add(function(){
		this.display.tint = H_YELLOW;
	}, this.yesOption);

	this.yesOption.onOut.add(function(){
		this.display.tint = H_WHITE;
	}, this.yesOption);
	
	this.noOption.onOver.add(function(){
		this.display.tint = H_YELLOW;
	}, this.noOption);

	this.noOption.onOut.add(function(){
		this.display.tint = H_WHITE;
	}, this.noOption);


	this.yesOption.onSelect.add(function(){
		console.log("GoodBye !");
		this.exit();
	}, this);

	this.noOption.onSelect.add(function(){
		this.cancelMenu.close();
	}, this);


	this.cancelMenu.addOption(this.yesOption);
	this.cancelMenu.addOption(this.noOption);

	this.cancelMenu.enableMouse();

	this.exitGameOption.onSelect.add(function(){
		this.cancelMenu.toggle();
	}, this);

	this.menu.enableMouse();
	
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
		this.state.start("Level1");
	}, this);
}

BasicGame.MainMenu.prototype.cleanUp = function(){
	this.cancelMenu.close();
	this.cancelMenu.destroy();
	this.cancelMenu = null;

	this.menu.close();
	this.menu.destroy();
	this.menu = null;

	BasicGame.allPlayers.p1.controller.setTargetByTag(null, "menu");
	BasicGame.allPlayers.p2.controller.setTargetByTag(null, "menu");
}

BasicGame.MainMenu.prototype.exit = function(){
	this.cleanUp();
	this.music.stop();

	window.location.replace("site.html");
}
