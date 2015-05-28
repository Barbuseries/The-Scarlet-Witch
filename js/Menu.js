/********/
/* Menu */
/******************************************************************************/
var Menu = function(game, manager, title, x, y, width, height, sprite, cursor){
	Interface.call(this, game, x, y, width, height, sprite);

	if (typeof(BasicGame.sfx.cursorSelect) === "undefined"){
		BasicGame.sfx.cursorSelect = this.game.add.audio("cursor_select");
	}

	
	this.manager = manager;
	
	this.title = this.game.add.text(this.width / 2, 0, title,
									{ font: "30px Arial", fill: "#ffffff"});

	this.title.anchor.setTo(0.5, 0);
	this.title.visible = false;

	this.add(this.title);
	
	this.cursor = this.game.add.sprite(0, 0, cursor);

	this.cursor.anchor.setTo(1, 0.5);
	
	this.cursorTween = null;
	
	this.offsetCursorX = - this.cursor.width;
	this.offsetCursorY = 0;
	
	this.add(this.cursor);
	
	this.cursor.visible = false;


	this.indexCurrentOption = -1;
	
	this.allOptions = [];
	
	this.toric = true;
	
	this.hasFocus = true;
	this.mouseEnabled = false;
	this.showTitle = false;
}

Menu.prototype = Object.create(Interface.prototype);
Menu.prototype.constructor = Menu;


Menu.prototype.addOption = function(option){
	this.allOptions.push(option);

	option.menu = this;
	
	this.add(option.display);

	if (this.indexCurrentOption == -1){
		this.indexCurrentOption = 0;
		this.cursor.visible = true;
		
		this.updateCursorPosition();
	}
}

// Enable the use of the mouse to choose and select an option.
Menu.prototype.enableMouse = function(){
	var self = this;
	
	function moveToCursor(sprite){
		if (this.state != Interface.State.TOGGLED){
			return;
		}

		var oldIndex = self.indexCurrentOption;
		var oldOption = self.getCurrentOption();
		
		self.indexCurrentOption = sprite._index;
		
		var option = self.getCurrentOption();
		
		if (oldIndex != sprite._index){
			BasicGame.sfx.cursorSelect.play("", 0, BasicGame.volume.sfx);

			oldOption.onOut.dispatch(oldOption);
			option.onOver.dispatch(option);

			self.updateCursorPosition();
		
			self.updateCursorTween();
		}
		else{
			option.whileOver.dispatch(option);
		}
	}
	

	for(var i = 0; i < this.allOptions.length; i++) {
		var option = this.allOptions[i];

		option.enableMouse();

		option.display._index = i;

		if (!(option.display instanceof Phaser.Group)){
			option.display.events.onInputOver.add(moveToCursor, this);
		}
	}
	
	this.mouseEnabled = true;
}


Menu.prototype.goNext = function(control, factor){
	if (this.state != Interface.State.TOGGLED){
		return;
	}

	if (typeof(factor) === "undefined"){
		factor = 1;
	}
	
	var oldIndex = this.indexCurrentOption;

	if (control instanceof PadControl){
		factor = 1;
	}

	this.indexCurrentOption += factor;

	if (this.indexCurrentOption >= this.allOptions.length){
		if (this.toric){
			this.indexCurrentOption -= this.allOptions.length;
		}
		else{
			this.indexCurrentOption = this.allOptions.length - 1;
		}
	}

	if (oldIndex != this.indexCurrentOption){
		BasicGame.sfx.cursorSelect.play("", 0, BasicGame.volume.sfx);

		var oldOption = this.allOptions[oldIndex];
		var option = this.getCurrentOption();

		oldOption.onOut.dispatch(option);
		option.onOver.dispatch(option);

		this.updateCursorPosition();

		this.updateCursorTween();
	}
}


Menu.prototype.goPrevious = function(control, factor){
	if (this.state != Interface.State.TOGGLED){
		return;
	}

	if (typeof(factor) === "undefined"){
		factor = 1;
	}

	var oldIndex = this.indexCurrentOption;

	if (control instanceof PadControl){
		factor = 1;
	}
  
	this.indexCurrentOption -= factor;

	if (this.indexCurrentOption < 0){
		if (this.toric){
			this.indexCurrentOption += this.allOptions.length;
		}
		else{
			this.indexCurrentOption = 0;
		}
	}

	if (oldIndex != this.indexCurrentOption){
		BasicGame.sfx.cursorSelect.play("", 0, BasicGame.volume.sfx);

		var oldOption = this.allOptions[oldIndex];
		var option = this.getCurrentOption();

		oldOption.onOut.dispatch(option);
		
		option.onOver.dispatch(option);

		this.updateCursorPosition();

		this.updateCursorTween();
	}
}

Menu.prototype.setFocus = function(focus){
	if (!booleanable(focus)){
		focus = true;
	}

	if (focus != this.hasFocus){
		if (!focus){
			this.stopCursorTween();
			
			if (this.mouseEnabled){
				for(var i = 0; i < this.allOptions.length; i++) {
					if (!(this.allOptions[i].display instanceof Phaser.Group)){
						this.allOptions[i].display.input.enabled = false;
					}
				}
			}
		}
		else{
			this.updateCursorTween();

			if (this.mouseEnabled){
				for(var i = 0; i < this.allOptions.length; i++) {
					if (!(this.allOptions[i].display instanceof Phaser.Group)){
						this.allOptions[i].display.input.enabled = true;
					}
				}
			}
		}

		this.hasFocus = focus;
	}
}

Menu.prototype.updateCursorPosition = function(){
	var currentOption = this.getCurrentOption();

	if (currentOption != null){
		this.cursor.x = currentOption.display.x + this.offsetCursorX ;
		this.cursor.y = currentOption.display.y + this.offsetCursorY -
			this.cursor.height / 5;
		
		if (!(currentOption.display instanceof Phaser.Group)){
			this.cursor.x -= currentOption.display.width *
				currentOption.display.anchor.x;

			this.cursor.y += currentOption.display.height *
						 (0.5 - currentOption.display.anchor.y);
		}
	}
}

Menu.prototype.getCurrentOption = function(){
	if (!validIndex(this.indexCurrentOption, this.allOptions)){
		return null;
	}
	else{
		return this.allOptions[this.indexCurrentOption];
	}
}

Menu.prototype.update = function(){
	var currentOption = this.getCurrentOption();

	if (currentOption != null){
		if (typeof(currentOption.whileHoverFunction) === "function"){
			currentOption.whileOver.apply(currentOption);
		}
	}

	if ((!this.hasFocus) &&
		(this.cursorTween != null)){
		this.stopCursorTween();
	}


	Interface.prototype.update.call(this);
}

Menu.prototype.toggle = function(){
	if (this.state == Interface.State.CLOSED){
		this.indexCurrentOption = 0;
		this.title.visible = this.showTitle;
		
		var option = this.getCurrentOption();
		
		Interface.prototype.toggle.call(this);

		if (option != null){
			option.onOver.dispatch(option);
		}

		this.updateCursorPosition();
		
		this.updateCursorTween();
	}
}

Menu.prototype.close = function(){
	if (this.state == Interface.State.TOGGLED){
		var option = this.getCurrentOption();
		
		if (option != null){
			option.onOut.dispatch(option);
		}
		
		this.stopCursorTween();
		
		Interface.prototype.close.call(this);
	}	
}

Menu.prototype.select = function(){
	if (this.state == Interface.State.TOGGLED){
		var option = this.getCurrentOption();
		
		if (option != null){
			BasicGame.sfx.cursorSelect.play("", 0, BasicGame.volume.sfx);

			option.onSelect.dispatch(option);
		}
		
	}
}

Menu.prototype.updateCursorTween = function(){
	this.stopCursorTween();

	this.cursorTween = this.game.add.tween(this.cursor)
		.to({x: this.cursor.x + this.offsetCursorX}, 500,
			Phaser.Easing.Quadratic.InOut);

	this.cursorTween.yoyo(true);
	this.cursorTween.repeat();
	
	this.cursorTween.start();
}

Menu.prototype.stopCursorTween = function(){
	if (this.cursorTween != null){
		this.cursorTween.stop();
		this.updateCursorPosition();

		this.cursorTween = null;
	}
}

Menu.prototype.kill = function(){
	this._del();

	Interface.prototype.kill.call(this);
}

Menu.prototype.destroy = function(){
	this._del();

	Interface.prototype.destroy.call(this);
}

Menu.prototype._del = function(){
	for(var i in this.animations){
		for(var j in this.animations[i]){
			if (this.animations[i][j] != null){
				this.animations[i][j].stop();
				this.animations[i][j] = null;
			}
		}
	}

	this.close();

	if (this.cursorTween != null){
		this.cursorTween.stop();
		this.cursorTween = null;
	}

	this.allOptions = [];

	Interface.prototype._del.call(this);
}
/******************************************************************************/
/* Menu */
/********/

/**********/
/* Option */
/******************************************************************************/
var Option = function(display){	
	this.display = display;

	this.onOver = new Phaser.Signal();
	this.onOut = new Phaser.Signal();
	this.onSelect = new Phaser.Signal();
	this.whileOver = new Phaser.Signal();

	this.menu = null;
}

Option.prototype.enableMouse = function(){
	if (!(this.display instanceof Phaser.Group)){
		this.display.inputEnabled = true;

		this.display.events.onInputDown.add(function(){
			if ((this.menu == null) ||
				(this.menu.state != Interface.State.TOGGLED)){
				return;
			}

			BasicGame.sfx.cursorSelect.play("", 0, BasicGame.volume.sfx);

			this.onSelect.dispatch(this);
		}, this);
	}
}

Option.prototype.kill = function(){
	this._del();
	
	if (this.display != null){
		if (this.display instanceof Phaser.Text){
			this.display.destroy();
		}
		else{
			this.display.kill();
		}
	}
}

Option.prototype.destroy = function(){
	this._del();

	if (this.display != null){
		this.display.destroy();
	}
}

Option.prototype._del = function(){
	if (this.onOver == null){
		return;
	}

	this.onOver.dispose();
	this.onOver = null;

	this.onOut.dispose();
	this.onOut = null;

	this.onSelect.dispose();
	this.onSelect = null;

	this.whileOver.dispose();
	this.whileOver = null;

	this.menu = null;
}
/******************************************************************************/
/* Option */
/**********/


/*********************/
/* Confirmation Menu */
/******************************************************************************/
var ConfirmationMenu = function(control, confFunction, context){
	var game = control.game;

	Menu.call(this, game, control, "Êtes-vous sûr ?",
			  0, 0, game.camera.width, game.camera.height,
			  "ground2", "icons");

	this.background.tint = H_BLACK;
	this.background.alpha = 0.8;

	this.title.fontWeight = "bold";
	this.title.stroke = BLACK;
	this.title.strokeThickness = 3;
	this.title.fontSize = 64;
	this.title.anchor.set(0.5);
	this.title.x = game.camera.width / 2;
	this.title.y = game.camera.height / 3;
	this.title.setShadow(5, 5, BLACK, 5);

	this.horizontal = true;
	this.showTitle = true;
	this.cursor.frame = 5;

	this.onStartToggle.add(bindMenu, this);

	this.yesOption = createBasicMenuOption(this, 100, "Oui !",
										   undefined, null);
	
	this.noOption = createBasicMenuOption(this, 100, "Non !",
										  undefined, null);

	
	this.yesOption.display.x = this.title.x - this.title.width;
	this.yesOption.display.y = this.title.y + game.camera.height / 3;
	this.yesOption.display.setShadow(5, 5, BLACK, 5);


	this.noOption.display.x = this.title.x + this.title.width;
	this.noOption.display.y = this.title.y + game.camera.height / 3;
	this.noOption.display.setShadow(5, 5, BLACK, 5);


	this.yesOption.onOver.add(function(){
		this.display.tint = H_WHITE;
	}, this.yesOption);

	this.yesOption.onOut.add(function(){
		this.display.tint = H_WHITE;
	}, this.yesOption);
	
	this.yesOption.onSelect.add(function(){
		this.close();
	}, this);

	this.yesOption.onSelect.add(confFunction, context);

	this.noOption.onOver.add(function(){
		this.display.tint = H_WHITE;
	}, this.noOption);

	this.noOption.onOut.add(function(){
		this.display.tint = H_WHITE;
	}, this.noOption);

	this.noOption.onSelect.add(function(){
		this.close();
	}, this);


	this.addOption(this.yesOption);
	this.addOption(this.noOption);

	this.fixedToCamera = true;
	this.enableMouse();

	this.cameraOffset.y = -this.height;

	this.createAnimation("toggle", "0", 0, 250, 1,
						 Phaser.Easing.Quartic.InOut);

	this.createAnimation("close", "0", -this.height, 250, 1,
						 Phaser.Easing.Quartic.InOut);
}

ConfirmationMenu.prototype = Object.create(Menu.prototype);
ConfirmationMenu.prototype.constructor = ConfirmationMenu;

ConfirmationMenu.prototype.setFunction = function(confFunction, context){
	this.yesOption.onSelect.removeAll();

	this.yesOption.onSelect.add(function(){
		this.close();
	}, this);

	this.yesOption.onSelect.add(confFunction, context);
}
/******************************************************************************/
/* Confirmation Menu */
/********************/

/***************/
/* Player Menu */
/******************************************************************************/
var PlayerMenu = function(player){
	var game = player.hero.game;

	Menu.call(this, game, player.controller, "Menu",
			  game.camera.width * 0.25, game.camera.height * 0.25,
			  game.camera.width / 2, game.camera.height / 2,
			  "ground2", "icons");

	this.title.fontWeight = "bold";
	this.title.stroke = BLACK;
	this.title.strokeThickness = 3;
	this.title.fontSize = 64;
	this.title.setShadow(5, 5, BLACK, 5);
	this.background.tint = H_GREY;

	this.horizontal = false;
	this.showTitle = true;
	this.cursor.frame = 5;
	
	player.controller.setTargetByTag(this, "menu");

	this.toggle = function(){
		if ((BasicGame.allPlayers.p1.menu.state ==
			 Interface.State.CLOSED) &&
			(BasicGame.allPlayers.p2.menu.state ==
			 Interface.State.CLOSED)){
			Menu.prototype.toggle.call(this);
		}
	}

	this.onStartToggle.add(bindMenu, this);
	this.onStartToggle.add(function(){
		player.controller.enable("system");
	});
	
	this.onStartToggle.add(function(){
		if (player.hero.menu != null){
			this.onStartClose.addOnce(player.hero.menu.close, player.hero.menu);
		}
	}, this);
	
	this.fixedToCamera = true;

	this.optionsMenu = new OptionsMenu(this.game, this.manager);

	this.statusOption = createBasicMenuOption(this, 130, player.hero.name,
											  function(){
												  player.getHero().menu.toggle();
											  }, this);

	this.optionsOption = createBasicMenuOption(this, 200, "Options", 
											   function(){
												   this.optionsMenu.toggle();
											   }, this);
	
	this.quitOption = createBasicMenuOption(this, 270, "Quitter",
					function(){
					BasicGame.returnToTitle(player.controller.get("menu_toggle"));
					});

	this.enableMouse();
}

PlayerMenu.prototype = Object.create(Menu.prototype);
PlayerMenu.prototype.constructor = PlayerMenu;
/******************************************************************************/
/* Player Menu */
/***************/

/*************/
/* Hero Menu */
/******************************************************************************/

var HeroMenu = function(hero){
	var game = hero.game;

	Menu.call(this, game, undefined, hero.name,
			  game.camera.width * 0.25, game.camera.height * 0.25,
			  game.camera.width / 2, game.camera.height / 2,
			  "ground2", "icons");

	this.title.fontWeight = "bold";
	this.title.stroke = BLACK;
	this.title.strokeThickness = 3;
	this.title.fontSize = 64;
	this.title.setShadow(5, 5, BLACK, 5);
	this.background.tint = H_GREY;

	this.horizontal = false;
	this.showTitle = true;
	this.cursor.frame = 5;

	this.hero = hero;

	this.onStartToggle.add(bindMenu, this);
	this.onStartToggle.add(function(){
		this.hero.player.controller.enable("system");

		var select = this.hero.player.controller.get("menu_select");
		
		select.setSignal("down", true);
		select.setFps(10, true);
	}, this);

	this.onEndClose.add(function(){
		var select = this.hero.player.controller.get("menu_select");
		
		select.rollback(["signal", "fps"]);
	}, this);
	
	this.fixedToCamera = true;

	this.upOptions = {
		mainStat: new Option(),
		endurance: new Option(),
		agility: new Option()
	};

	this.bars = {
		mainStat: new MonoGauge(game, this.width - 450, 140 - 5, 400, 10,
								hero.allStats.mainStat,
								H_YELLOW, H_BLACK, "", ""),
		endurance: new MonoGauge(game, this.width - 450, 200 - 5, 400, 10,
								hero.allStats.endurance,
								H_YELLOW, H_BLACK, "", ""),
		agility: new MonoGauge(game, this.width - 450, 260 - 5, 400, 10,
								hero.allStats.agility,
								H_YELLOW, H_BLACK, "", "")
	};

	this.bars.mainStat.allowIncreaseAnimation = false;
	this.bars.mainStat.allowDecreaseAnimation = false;

	this.bars.endurance.allowIncreaseAnimation = false;
	this.bars.endurance.allowDecreaseAnimation = false;

	this.bars.agility.allowIncreaseAnimation = false;
	this.bars.agility.allowDecreaseAnimation = false;

	this.addChild(this.bars.mainStat);
	this.addChild(this.bars.endurance);
	this.addChild(this.bars.agility);

	this.upOptions.mainStat.display = game.add.text(50, 140,
													hero.allStats.mainStat.name,
											{font: "30px Arial", fill: "#ffffff"});

	this.upOptions.mainStat.display.anchor.setTo(0, 0.5);
	this.upOptions.mainStat.onSelect.add(function(){
		this.hero.upgradeStat("mainStat");
		
		this.updateStatPoints();
	}, this);

	this.addOption(this.upOptions.mainStat);

	this.upOptions.endurance.display = game.add.text(50, 200,
													hero.allStats.endurance.name,
											{font: "30px Arial", fill: "#ffffff"});

	this.upOptions.endurance.display.anchor.setTo(0, 0.5);
	this.upOptions.endurance.onSelect.add(function(){
		this.hero.upgradeStat("endurance");

		this.updateStatPoints();
	}, this);

	this.addOption(this.upOptions.endurance);

	this.upOptions.agility.display = game.add.text(50, 260,
													hero.allStats.agility.name,
											{font: "30px Arial", fill: "#ffffff"});

	this.upOptions.agility.display.anchor.setTo(0, 0.5);
	this.upOptions.agility.onSelect.add(function(){
		this.hero.upgradeStat("agility");

		this.updateStatPoints();
	}, this);

	this.addOption(this.upOptions.agility);
	
	this.displayStatPoints = game.add.text(this.width - 20, this.height,
										  "Point(s) restant(s) : " +
										   hero.statPoints.toString(),
										   {font: "30px Arial", fill: "#ffffff"});
	this.displayStatPoints.anchor.setTo(1);
	this.addChild(this.displayStatPoints);

	hero.allStats.level.onUpdate.add(this.updateStatPoints, this);

	this.enableMouse();
}

HeroMenu.prototype = Object.create(Menu.prototype);
HeroMenu.prototype.constructor = HeroMenu;

HeroMenu.prototype.updateStatPoints = function(){
	this.displayStatPoints.text = "Point(s) restant(s) : " +
		this.hero.statPoints.toString();
}

/******************************************************************************/
/* Hero Menu */
/*************/

/****************/
/* Options Menu */
/******************************************************************************/
var OptionsMenu = function(game, manager){
	Menu.call(this, game, manager,  "Options",
			  game.camera.width * 0.25, game.camera.height * 0.25,
			  game.camera.width / 2, game.camera.height / 2,
			  "ground2", "icons");

	this.title.fontWeight = "bold";
	this.title.stroke = BLACK;
	this.title.strokeThickness = 3;
	this.title.fontSize = 64;
	this.title.setShadow(5, 5, BLACK, 5);
	this.background.tint = H_GREY;

	this.horizontal = false;
	this.showTitle = true;
	this.cursor.frame = 5;

	this.onStartToggle.add(bindMenu, this);

	this.fixedToCamera = true;

	this.volumeMenu = new VolumeMenu(game, manager);

	this.volumeOption = createBasicMenuOption(this, 130, "Volume",
											  function(){
												  this.volumeMenu.toggle();
											  }, this);

	this.controlsOption = createBasicMenuOption(this, 200, "Controls",
											   function(){
												   console.log("Controls");
											   }, this);
	this.backOption = createBasicMenuOption(this, 270, "Retour",
											function(){
												this.close();
											}, this);

	this.enableMouse();
}

OptionsMenu.prototype = Object.create(Menu.prototype);
OptionsMenu.prototype.constructor = OptionsMenu;
/******************************************************************************/
/* Options Menu */
/****************/

/***************/
/* Volume Menu */
/******************************************************************************/
var VolumeMenu = function(game, manager){
	Menu.call(this, game, manager,  "Volume",
			  game.camera.width * 0.33 / 2, game.camera.height * 0.33 / 2,
			  game.camera.width * 2 / 3, game.camera.height * 2 / 3,
			  "ground2", "icons");

	this.title.fontWeight = "bold";
	this.title.stroke = BLACK;
	this.title.strokeThickness = 3;
	this.title.fontSize = 64;
	this.title.setShadow(5, 5, BLACK, 5);
	this.background.tint = H_GREY;

	this.horizontal = false;
	this.showTitle = true;
	this.cursor.frame = 5;

	this.onStartToggle.add(bindMenu, this);
	this.onStartToggle.add(function(){
		this.savedMusic = BasicGame.volume.music;
		this.savedSFX = BasicGame.volume.sfx;
		this.savedSoundOn = !BasicGame.game.sound.mute;

		this.musicVolume.set(Math.ceil(this.savedMusic * 100));
		this.sfxVolume.set(Math.ceil(this.savedSFX * 100));
	}, this);

	this.fixedToCamera = true;

	this.musicOption = createBasicMenuOption(this, 130, "Musique",
							function(){
								this.musicVolume.set((!this.musicVolume.get()) * 1, 1);
							}, this);
	this.musicOption.display.x = 50;
	this.musicOption.display.anchor.x = 0;
	
	this.musicVolume = new Stat(null, "Music", STAT_NO_LINK,
								0, 100);
	this.musicVolume.add(Math.ceil(BasicGame.volume.music * 100));

	this.musicVolume.onUpdate.add(function(){
		BasicGame.volume.music = this.get() / 100;

		for(var i in BasicGame.musics){
			try{
				BasicGame.musics[i].volume = BasicGame.volume.music;
			}
			catch(err){};
		}
	}, this.musicVolume);

	this.musicBar = new Bar(game, manager, 270, 130 - 5,
							this.width - 350, 10,
							"ground", "ground2",
							this.musicVolume, true);
	
	this.add(this.musicBar);

	this.musicOption.onOver.add(function(){
		this.musicBar.start();
	}, this);

	this.musicOption.onOut.add(function(){
		this.musicBar.stop();
	}, this);
	
	this.sfxOption = createBasicMenuOption(this, 200, "SFX",
								function(){
									this.sfxVolume.set((!this.sfxVolume.get()) * 1, 1);
								}, this);
	this.sfxOption.display.x = 50;
	this.sfxOption.display.anchor.x = 0;

	this.sfxVolume = new Stat(null, "Sfx", STAT_NO_LINK,
								0, 100);
	this.sfxVolume.add(BasicGame.volume.sfx * 100);

	this.sfxVolume.onUpdate.add(function(){
		BasicGame.volume.sfx = this.get() / 100;
		
		for(var i in BasicGame.sfx){
			try{
				BasicGame.sfx[i].volume = BasicGame.volume.sfx;
			}
			catch(err){};
		}
	}, this.sfxVolume);

	this.sfxBar = new Bar(game, manager, 270, 200 - 5,
						  this.width - 350, 10,
						  "ground", "ground2",
						  this.sfxVolume, true);
	
	this.add(this.sfxBar);

	this.sfxOption.onOver.add(function(){
		this.sfxBar.start();
	}, this);

	this.sfxOption.onOut.add(function(){
		this.sfxBar.stop();
	}, this);

	this.onOffOption = createBasicMenuOption(this, 270, "ON/OFF",
							function(){
								BasicGame.game.sound.mute = !BasicGame.game.sound.mute;

								this.savedSoundOn = !BasicGame.game.sound.mute;
							}, this);

	this.confirmOption = createBasicMenuOption(this, 340, "Confirmer",
										function(){
											BasicGame.optionsSave.save();
											BasicGame.optionsSave.hardSave();
											
											this.savedMusic = BasicGame.volume.music;
											this.savedSFX = BasicGame.volume.sfx;
											this.close();
										}, this);
	
	this.backOption = createBasicMenuOption(this, 410, "Retour",
											function(){
												this.close();
											}, this);

	this.enableMouse();

	this.onEndClose.add(function(){
		this.musicBar.stop();
		this.sfxBar.stop();

		BasicGame.volume.music = this.savedMusic;
		BasicGame.volume.sfx = this.savedSFX;

		BasicGame.game.sound.mute = !this.savedSoundOn;

		for(var i in BasicGame.musics){
			BasicGame.musics[i].volume = BasicGame.volume.music;
		}

		for(var i in BasicGame.sfx){
			BasicGame.sfx[i].volume = BasicGame.volume.sfx;
		}
	}, this);
}

VolumeMenu.prototype = Object.create(Menu.prototype);
VolumeMenu.prototype.constructor = VolumeMenu;

VolumeMenu.prototype.destroy = function(){
	this.musicVolume.destroy();
	this.musicVolume = null;

	this.sfxVolume.destroy();
	this.sfxVolume = null;

	Menu.prototype.destroy.call(this);
}
/******************************************************************************/
/* Volume Menu */
/***************/


/*****************/
/* LoadSave Menu */
/******************************************************************************/

var LoadSaveMenu = function(game, manager, toSave){
	if (!booleanable(toSave)){
		toSave = false;
	}

	this.toSave = toSave;

	var title = (toSave) ? "Sauvegarder" : "Charger";
	
	Menu.call(this, game, manager, title,
			  game.camera.width * 0.125 / 2, game.camera.height * 0.125 / 2,
			  game.camera.width * 7 / 8, game.camera.height * 7 / 8,
			  "ground2", "icons");

	this.title.fontWeight = "bold";
	this.title.stroke = BLACK;
	this.title.strokeThickness = 3;
	this.title.fontSize = 64;
	this.title.setShadow(5, 5, BLACK, 5);
	this.background.tint = H_GREY;

	this.horizontal = false;
	this.showTitle = true;
	this.cursor.frame = 5;

	this.fixedToCamera = true;

	this.onStartToggle.add(bindMenu, this);

	var saveOffset = 90;
	var allSaves = BasicGame.allGameSaves;

	function createSaveMiniature(save){
		var newOption = new Option(this.game.add.group());
		
		newOption.display.add(createBasicMenuOptionText(this,
														130 + save.index * saveOffset,
														save.level.key));

		newOption.onOver.add(function(){
			newOption.display.getChildAt(0).scale.setTo(1.5);
			newOption.display.getChildAt(1).scale.setTo(1.05);
			newOption.display.getChildAt(0).stroke = RED;

			newOption.display.alpha = 1;

			this.game.world.bringToTop(newOption.display);
		}, this);
		
		newOption.onOut.add(function(){
			newOption.display.getChildAt(0).scale.setTo(1);
			newOption.display.getChildAt(1).scale.setTo(1);
			newOption.display.getChildAt(0).fill = WHITE;
			newOption.display.getChildAt(0).stroke = BLACK;

			newOption.display.alpha = 0.5;
		}, this);

		newOption.onSelect.add(function(){
			if (!toSave){
				BasicGame.gameSave.copy(save);

				this.onEndClose.addOnce(function(){
					if (BasicGame.game.state.current == "MainMenu"){
						BasicGame.game.state.states.MainMenu.startGame(null, false);
					}
					else{
						BasicGame.gameSave.load(BasicGame.game);
					}
				});

				this.close();
			}
			else{
				newOption.display.getChildAt(1).destroy();

				BasicGame.gameSave.save();

				save.copy(BasicGame.gameSave);

				save.hardSave();
				
				newOption.display.add(save.createMiniature(this.game,
														   350,
														   100 + saveOffset * save.index));
				newOption.display.getChildAt(0).text = save.level.key;
			}
		}, this);

		newOption.display.getChildAt(0).x = 50;
		newOption.display.getChildAt(0).anchor.x = 0;

		newOption.display.add(save.createMiniature(this.game, 350,
												   100 + saveOffset * save.index));

		newOption.display.alpha = 0.5;
		newOption.display.scale.setTo(0.9);
		
		this.addOption(newOption);

		return newOption;
	}

	for(var i = 0; i < allSaves.length; i++){
		var saveName = "save_" + i.toString();

		if (allSaves[i] != null){
			this[saveName] = createSaveMiniature.call(this, allSaves[i]);
		}
		else{
			this[saveName] = createBasicMenuOption(this, 100 + saveOffset * i, "Vide");
			
			this[saveName].onOver.add(function(){
				if (toSave){
					this.display.alpha = 1;
				}
			}, this[saveName]);

			this[saveName].onOut.add(function(){
				this.display.alpha = 0.5;
			}, this[saveName]);

			if (toSave){
				this[saveName]._index = i;
				this[saveName]._name = saveName;

				var self = this;

				this[saveName].onSelect.addOnce(function(){
					var indexSave = this._index;

					allSaves[indexSave] = new GameSave(indexSave);
					
					allSaves[indexSave].copy(BasicGame.gameSave);

					this.destroy();

					self[this._name] = createSaveMiniature.call(self,
																allSaves[indexSave]);
					self[this._name].onSelect.dispatch();

					swapInArray(self.allOptions, self.allOptions.length - 1,
								indexSave);

 					self.allOptions.pop();

					self.goNext();
					self.goPrevious();
				}, this[saveName]);
			}

			this[saveName].display.alpha = 0.5;
		}
	}
	
	this.backOption = createBasicMenuOption(this, 90 + saveOffset * 5, "Retour",
											function(){
												this.close();
											}, this);

	this.updateCursorPosition = function(toto){
		var currentOption = this.getCurrentOption();

		if (currentOption != null){
			if (currentOption.display instanceof Phaser.Group){
				this.cursor.x = currentOption.display.getChildAt(0).x +
					this.offsetCursorX;
				this.cursor.y = currentOption.display.getChildAt(0).y * currentOption.display.scale.y +
					this.offsetCursorY;
				
				this.cursor.x -= currentOption.display.getChildAt(0).width *
					currentOption.display.getChildAt(0).anchor.x;
				
				this.cursor.y += currentOption.display.getChildAt(0).height *
					(0.5 - currentOption.display.getChildAt(0).anchor.y);
			}
			else{
				Menu.prototype.updateCursorPosition.call(this);
			}
		}
	}
	
	this.enableMouse();
}

LoadSaveMenu.prototype = Object.create(Menu.prototype);
LoadSaveMenu.prototype.constructor = LoadSaveMenu;

/******************************************************************************
/* LoadSaveMenu */
/****************/
