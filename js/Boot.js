var BasicGame = {
	allGameSaves: [],

	gameSave: null,
	
	optionsSave: null,

	level: null,

	allPlayers: {
		p1: null,
		
		p2: null
	},
	
	allLevels: {},

	pool: {
		textDamage: null
	},

	sfx: {},
	
	musics: {},

	volume: {
		music: 0.1,

		sfx: 0.1,
	},

	emitters: {
		blood: null,
	},

	easyStar: {},

	pauseBackground: null,
	pauseText: null,

	mute: function(control){
		control.manager.game.sound.mute = !control.manager.game.sound.mute;
	},
	
	pause: function(control){
		var game = control.manager.game;
		var paused = game.paused;

		game.paused = !paused;

		if (!paused){
			this.pauseBackground = game.add.sprite(game.camera.x, game.camera.y,
												   "ground2");

			this.pauseText = game.add.text(game.camera.x + game.camera.width / 2,
										   game.camera.y + game.camera.height / 2,
										   "| |");

			this.pauseBackground.width = game.camera.width;
			this.pauseBackground.height = game.camera.height;
			this.pauseBackground.alpha = 0.9;
			this.pauseBackground.tint = H_BLACK;

			this.pauseText.fontWeight = "bold";
			this.pauseText.fill = "white";
			this.pauseText.stroke = BLACK;
			this.pauseText.strokeThickness = 10;
			this.pauseText.fontSize = 64;
			//this.pauseText.setShadow(5, 1, BLACK, 5);
			this.pauseText.anchor.setTo(0.5);
			
			this.pauseBackground.fixedToCamera = true;
			this.pauseText.fixedToCamera = true;

			for(var i in BasicGame.allPlayers){
				BasicGame.allPlayers[i].controller.disable(["action","movement",
															"system"],
														   false, true);
			}
		}
		else{
			if (this.pauseBackground != null){
				this.pauseBackground.destroy();
				this.pauseBackground = null;

				this.pauseText.destroy();
				this.pauseText = null;

				for(var i in BasicGame.allPlayers){
					BasicGame.allPlayers[i].controller.rollback("enabled", 
																["action","movement",
																 "system"]);
				}
			}
		}
	},

	returnToTitle: function(control){
		if ((BasicGame.level != null) &&
			(this.confirmMenu == null)){
			this.confirmMenu = new ConfirmationMenu(control.manager,
							function(){
								BasicGame.level.returnToTitle();;
							}, null);
			
			this.confirmMenu.toggle();

			this.confirmMenu.onEndClose.add(function(){
				this.confirmMenu.destroy();
				this.confirmMenu = null;
			}, this);
		}
	},

	swapHeroes: function(){
		var heroP1 = BasicGame.allPlayers.p1.getHero();
		var heroP2 = BasicGame.allPlayers.p2.getHero();

		var menuHero1Open;
		var menuHero2Open;

		if ((heroP1 != null) &&
			(heroP1.menu != null)){
			menuHero1Open = (heroP1.menu.state == Interface.State.TOGGLED);
		}

		if ((heroP2 != null) &&
			(heroP2.menu != null)){
			menuHero2Open = (heroP2.menu.state == Interface.State.TOGGLED);
		}

		if (menuHero1Open){
			heroP1.menu.close();
		}

		if (menuHero2Open){
			heroP2.menu.close();
		}
		
		BasicGame.allPlayers.p1.setHero(heroP2);
		BasicGame.allPlayers.p2.setHero(heroP1);

		if (menuHero1Open){
			heroP2.menu.toggle();
		}

		if (menuHero2Open){
			heroP1.menu.toggle();
		}
	}
};

BasicGame.Boot = function (game) {
};

BasicGame.Boot.prototype.init = function(){
    this.input.maxPointers = 1;
	this.input.resetLocked = true;


    if (this.game.device.desktop)
    {
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		//this.game.scale.setMinMax(1080/4, 720/4, 1080*2, 720*2);
		this.game.scale.pageAlignHorizontally = true;
		this.game.scale.pageAlignVertically = false;
		this.game.scale.windowConstraints.bottom = "visual";
    }
    else
    {

    }

	BasicGame.game = this;
}
BasicGame.Boot.prototype.preload = function(){
	var miscDir = "assets/Misc/";

	this.load.image("phaserLogo", miscDir + "Phaser-Logo-Small.png");
    this.load.image('preloaderBarBackground', miscDir + 'campfire_wood.png');
    this.load.image('preloaderBar', miscDir + 'campfire_fire.png');
	this.load.image("logo", miscDir + "TheScarletWitch-Logo.png");
	this.load.image("sky",  "assets/Backgrounds/background0_2.png");
	this.load.image("ground", miscDir + "platform.png");
}

BasicGame.Boot.prototype.create = function(){
    this.logoGroup = this.game.add.group();

	this.logoGroup.create(0, 0, "phaserLogo");
	this.logoGroup.create(0, 0, "logo");

	var centerX = this.game.camera.width / 2;
	var centerY = this.game.camera.height / 2;

	this.logoGroup.forEach(function(logo){
		logo.alpha = 0;
		logo.anchor.setTo(0.50);
		logo.x = centerX;
		logo.y = centerY;
	});

	this.bootTween = this.game.add.tween(this.logoGroup.getFirstAlive())
		.to({alpha: 1}, 3000, Phaser.Easing.Cubic.InOut)
		.to({alpha: 0}, 3000, Phaser.Easing.Cubic.InOut);

	this.bootTween.onComplete.add(this.nextLogo, this);
	
	this.bootTween.start();

	this.game.input.onDown.add(this.nextLogo, this);
}

BasicGame.Boot.prototype.nextLogo = function(){
	if (this.bootTween != null){
		var actualLogo = this.logoGroup.getFirstAlive();

		actualLogo.kill();

		this.bootTween.stop();
		this.bootTween = null;

		var logo = this.logoGroup.getFirstAlive();
	
		if (logo != null){
			this.bootTween = this.game.add.tween(logo)
				.to({alpha: 1}, 3000, Phaser.Easing.Cubic.InOut)
				.to({alpha: 0}, 3000, Phaser.Easing.Cubic.InOut);

			this.bootTween.onComplete.add(this.nextLogo, this);

			this.bootTween.start();
		}
		else{
			this.startPreload();
		}
	}
	else{
		this.startPreload();
	}
}

BasicGame.Boot.prototype.goFullscreen = function(){
	if (this.scale.isFullScreen) {
        this.scale.stopFullScreen();
    }
	else {
		this.game.scale.startFullScreen(false);
	}
}

BasicGame.Boot.prototype.startPreload = function(){
	this.logoGroup.forEachAlive(function(logo){
		logo.kill();
	});

	var keyboard = Phaser.Keyboard;
	var gamepad = Phaser.Gamepad;
	
	var commonMaped = {
		goLeft: gamepad.XBOX360_DPAD_LEFT,
		goRight: gamepad.XBOX360_DPAD_RIGHT,
		goDown: gamepad.XBOX360_DPAD_DOWN,
		goUp: gamepad.XBOX360_DPAD_UP,
		menu_select: gamepad.XBOX360_A,
		menu_toggle: gamepad.XBOX360_START,
		menu_next: gamepad.XBOX360_DPAD_DOWN,
		menu_previous: gamepad.XBOX360_DPAD_UP,
		jump: gamepad.XBOX360_A,
		reduceJump: gamepad.XBOX360_A,
		castFirst: gamepad.XBOX360_X,
		castSecond: gamepad.XBOX360_Y,
		castThird: gamepad.XBOX360_B,
		castFourth: gamepad.XBOX360_RIGHT_BUMPER,
		castFifth: gamepad.XBOX360_RIGHT_TRIGGER,
		releaseFirst: gamepad.XBOX360_X,
		releaseSecond: gamepad.XBOX360_Y,
		releaseThird: gamepad.XBOX360_B,
		releaseFourth: gamepad.XBOX360_RIGHT_BUMPER,
		releaseFifth: gamepad.XBOX360_RIGHT_TRIGGER,
		swapMode: gamepad.XBOX360_LEFT_BUMPER,
		swapHeroes: gamepad.XBOX360_BACK
	}

	BasicGame.allPlayers.p1 = new Player(this.game, "1");
	BasicGame.allPlayers.p1.isMain = true;
	BasicGame.allPlayers.p1.humanAfterAll = true;

	BasicGame.allPlayers.p2 = new Player(this.game, "2");

	BasicGame.allPlayers.p1.controller
		.bindControl("menu_toggle", Phaser.Keyboard.M, -1,
					 "toggle", "onDown", "menu")
		.bindControl("menu_next", Phaser.Keyboard.S, -1,
					 "goNext", "down", "menu", -1, 6)
		.bindControl("menu_previous", Phaser.Keyboard.Z, -1,
					 "goPrevious", "down", "menu", -1, 6)
		.bindControl("menu_select", Phaser.Keyboard.SPACEBAR, -1,
					 "select", "onDown", "menu")
		.bindControl(-1, Phaser.Keyboard.Q, -1,
					 "goLeft", "down", "movement")
		.bindControl(-1, Phaser.Keyboard.D, -1,
					 "goRight", "down", "movement")
		.bindControl(-1, Phaser.Keyboard.Z, -1,
					 "goUp", "down", "movement")
		.bindControl(-1, Phaser.Keyboard.S, -1,
					 "goDown", "down", "movement")
		.bindControl(-1, Phaser.Keyboard.Z, -1,
					 "jump", "down", "movement")
		.bindControl(-1, Phaser.Keyboard.Z, -1,
					 "reduceJump", "onDown", "movement")
		.bindControl(-1, Phaser.Keyboard.J, -1,
					 "orientLeft", "down", "movement")
		.bindControl(-1, Phaser.Keyboard.L, -1,
					 "orientRight", "down", "movement")
		.bindControl(-1, Phaser.Keyboard.Y, -1,
					 "castFirst", "down", "action")
		.bindControl(-1, Phaser.Keyboard.U, -1,
					 "castSecond", "down", "action")
		.bindControl(-1, Phaser.Keyboard.I, -1,
					 "castThird", "down", "action")
		.bindControl(-1, Phaser.Keyboard.O, -1,
					 "castFourth", "down", "action")
		.bindControl(-1, Phaser.Keyboard.P, -1,
					 "castFifth", "down", "action")
		.bindControl(-1, Phaser.Keyboard.Y, -1,
					 "releaseFirst", "onUp", "action")
		.bindControl(-1, Phaser.Keyboard.U, -1,
					 "releaseSecond", "onUp", "action")
		.bindControl(-1, Phaser.Keyboard.I, -1,
					 "releaseThird", "onUp", "action")
		.bindControl(-1, Phaser.Keyboard.O, -1,
					 "releaseFourth", "onUp", "action")
		.bindControl(-1, Phaser.Keyboard.P, -1,
					 "releaseFifth", "onUp", "action")
		.bindControl(-1, Phaser.Keyboard.ENTER, -1,
					 "swapMode", "onDown", "action")
		.bindControl(-1, Phaser.Keyboard.TAB, -1,
					 "swapHeroes", "onDown", ["system" ,"action"])
		/*.bindControl(-1, Phaser.Keyboard.M, -1,
					 "mute", "onDown", "system")*/
		.bindControl(-1, Phaser.Keyboard.ESC, -1,
					"returnToTitle", "onDown", "system")
		.bindControl(-1, Phaser.Keyboard.P, -1,
					 "pause", "onDown", "SYSTEM", BasicGame)
		/*.bindControl(-1, Phaser.Keyboard.H, -1,
					 "hardSave", "onDown", "save")*/;

	for(var i in commonMaped){
		console.log(i, commonMaped[i]);
		BasicGame.allPlayers.p1.controller.get(i).change(-1, commonMaped[i]);
	}

	var optionsSave = localStorage.getItem("options");

	if (optionsSave == null){
		BasicGame.optionsSave = new OptionsSave();
		
		BasicGame.optionsSave.save();

		BasicGame.optionsSave.hardSave();
	}
	else{
		BasicGame.optionsSave = JSON.parse(optionsSave);
		BasicGame.optionsSave.__proto__ = OptionsSave.prototype;

		BasicGame.optionsSave.load();
	}

	this.game.input.onDown.removeAll();
	this.state.start("Preloader");
}
