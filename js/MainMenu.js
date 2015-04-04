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

	this.control = new ControlManager(this.game, CONTROL_KEYBOARD);

	this.control.bindControl("menu_next", Phaser.Keyboard.DOWN,
							 "goNext",
							 "onDown", "menu", -1);
	
	this.control.bindControl("menu_previous", Phaser.Keyboard.UP,
							 "goPrevious",
							 "onDown", "menu", -1);
	
	this.control.bindControl("menu_display", Phaser.Keyboard.SPACEBAR,
							 "toggle", "onDown", "menu", this);
	
	this.control.bindControl("menu_select", Phaser.Keyboard.ENTER,
							 "select", "onDown", "menu", -1);

	function bind(){
		var allOldControls = this.manager.getByTag("menu");
		var toRemove = allOldControls.indexOf(this.manager.allControls["menu_display"]);
		var allOldCodes = [];
		var oldTarget = allOldControls[0].target;
		var oldFunction = null;

		if (typeof(oldTarget) != "undefined"){
			oldTarget.setFocus(false);
		}

		for(var i = 0; i < allOldControls.length; i++) {
			allOldControls[i].target = this;
			allOldCodes.push(allOldControls[i].code);
		}

		this.onEndClose.add(function(){
			if (typeof(oldTarget) != "undefined"){
				oldTarget.setFocus();
			}
			
			for(var i = 0; i < allOldControls.length; i++) {
				allOldControls[i].target = oldTarget;
				allOldControls[i].change(allOldCodes[i]);
			}

			this.manager.allControls["menu_display"].functionName = oldFunction;
			this.manager.allControls["menu_display"].target = oldTarget;
		}, this);

		this.manager.bindControl("menu_display", -1, "close");
		this.manager.allControls["menu_display"].target = this;

		if (this.horizontal){
			this.manager.allControls["menu_next"].change(Phaser.Keyboard.RIGHT);
			this.manager.allControls["menu_previous"].change(Phaser.Keyboard.LEFT);
		}
		
		this.setFocus(true);
	}

	this.menu = new Menu(this.game, this.control, "MainMenu",
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
		this.cancelMenu.close();
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
	
	this.control.setTargetByTag(this.menu, "menu");

	this.menu.toggle();
	
	this.music.play("", 0, 1, true);
}

BasicGame.MainMenu.prototype.update = function(){
	this.background.tilePosition.x -= 1;
	this.control.update();
}

BasicGame.MainMenu.prototype.startGame = function(pointer){
	this.cleanUp();

	this.music.fadeOut(1000);
	this.music.onFadeComplete.addOnce(function(){
		this.state.start("Level1");
	}, this);
}

BasicGame.MainMenu.prototype.cleanUp = function(){
	this.menu.close();
	this.menu.kill();
	this.cancelMenu.close();
	this.cancelMenu.kill();
}

BasicGame.MainMenu.prototype.exit = function(){
	this.cleanUp();

	window.location.replace("site.html");
}
