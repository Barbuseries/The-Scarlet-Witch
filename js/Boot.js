var THIS_IS_NOT_THE_KONAMI_CODE = "UUDDLRLRBAStSe";

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

	konamiCode: {
		code: "",
		timer: null
	},
	
	konamiCodeRestartTimer: function(){
		if (this.konamiCode.timer != null){
			this.konamiCode.timer.stop();
			this.konamiCode.timer.destroy();
			this.konamiCode.timer = null;
		}

		this.konamiCode.timer = this.game.time.create();
		this.konamiCode.timer.add(1000, function(){
			this.konamiCode.code = "";
		}, this);

		this.konamiCode.timer.start();
	},

	konamiCodeUp: function(){
		this.konamiCode.code += "U";

		this.konamiCodeRestartTimer();
	},
	
	konamiCodeDown: function(){
		this.konamiCode.code += "D";

		this.konamiCodeRestartTimer();
	},
	
	konamiCodeLeft: function(){
		this.konamiCode.code += "L";
		
		this.konamiCodeRestartTimer();
	},

	konamiCodeRight: function(){
		this.konamiCode.code += "R";

		this.konamiCodeRestartTimer();
	},

	konamiCodeA: function(){
		this.konamiCode.code += "A";

		this.konamiCodeRestartTimer();
	},

	konamiCodeB: function(){
		this.konamiCode.code += "B";

		this.konamiCodeRestartTimer();
	},

	konamiCodeStart: function(){
		this.konamiCode.code += "St";

		this.konamiCodeRestartTimer();
	},

	konamiCodeSelect: function(){
		this.konamiCode.code += "Se";

		this.konamiCodeRestartTimer();
	},

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
			heroP2.game.world.bringToTop(heroP2.menu);
		}

		if (menuHero2Open){
			heroP1.menu.toggle();
			heroP1.game.world.bringToTop(heroP1.menu);
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
		this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.refresh();

		//this.game.scale.setMinMax(1080/4, 720/4, 1080*2, 720*2);
		this.game.scale.pageAlignHorizontally = true;
		this.game.scale.pageAlignVertically = false;
		this.game.scale.windowConstraints.bottom = "visual";
    }
    else
    {

    }
	
	this.game.input.onDown.addOnce(this.goFullscreen, this);

	BasicGame.game = this;

	/*for(var i in Phaser.Keyboard){		
		this.game.input.keyboard.addKeyCapture(Phaser.Keyboard[i]);
	}*/
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
		menu_select: gamepad.XBOX360_A,
		menu_toggle: gamepad.XBOX360_START,
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
		swapHeroes: gamepad.XBOX360_BACK,
		goLeft: gamepad.XBOX360_DPAD_LEFT,
		goRight: gamepad.XBOX360_DPAD_RIGHT,
		goDown: gamepad.XBOX360_DPAD_DOWN,
		goUp: gamepad.XBOX360_DPAD_UP,
		menu_next: gamepad.XBOX360_DPAD_DOWN,
		menu_previous: gamepad.XBOX360_DPAD_UP
	};

	var padMaped = {
		pad_goLeft: {
			axis: gamepad.XBOX360_STICK_LEFT_X,
			min: -1,
			max: -0.1
		},

		pad_goRight: {
			axis: gamepad.XBOX360_STICK_LEFT_X,
			min: 0.1,
			max: 1
		},

		pad_orientLeft: {
			axis: gamepad.XBOX360_STICK_RIGHT_X,
			min: -1,
			max: -0.1
		},

		pad_orientRight: {
			axis: gamepad.XBOX360_STICK_RIGHT_X,
			min: 0.1,
			max: 1
		}
	};

	var konamiMaped = {
		konamiCodeUp: gamepad.XBOX360_DPAD_UP,
		konamiCodeDown: gamepad.XBOX360_DPAD_DOWN,
		konamiCodeLeft: gamepad.XBOX360_DPAD_LEFT,
		konamiCodeRight: gamepad.XBOX360_DPAD_RIGHT,
		konamiCodeA: gamepad.XBOX360_A,
		konamiCodeB: gamepad.XBOX360_B,
		konamiCodeStart: gamepad.XBOX360_START,
		konamiCodeSelect: gamepad.XBOX360_BACK
	};

	BasicGame.allPlayers.p1 = new Player(this.game, "1");
	BasicGame.allPlayers.p1.isMain = true;
	BasicGame.allPlayers.p1.humanAfterAll = true;
	BasicGame.allPlayers.p1.controller.connected = true;

	BasicGame.allPlayers.p2 = new Player(this.game, "2");

	BasicGame.allPlayers.p1.controller
		.bindControl("menu_toggle", keyboard.M, -1,
					 "toggle", "onDown", "menu")
		.bindControl("menu_next", keyboard.S, -1,
					 "goNext", "down", "menu", -1, 6)
		.bindControl("menu_previous", keyboard.Z, -1,
					 "goPrevious", "down", "menu", -1, 6)
		.bindControl("menu_select", keyboard.ENTER, -1,
					 "select", "onDown", "menu")
		.bindControl(-1, keyboard.Q, -1,
					 "goLeft", "down", "movement")
		.bindControl(-1, keyboard.D, -1,
					 "goRight", "down", "movement")
		.bindControl(-1, keyboard.Z, -1,
					 "goUp", "down", "movement")
		.bindControl(-1, keyboard.S, -1,
					 "goDown", "down", "movement")
		.bindControl(-1, keyboard.Z, -1,
					 "jump", "down", "movement")
		.bindControl(-1, keyboard.Z, -1,
					 "reduceJump", "onDown", "movement")
		.bindControl(-1, keyboard.J, -1,
					 "orientLeft", "down", "movement")
		.bindControl(-1, keyboard.L, -1,
					 "orientRight", "down", "movement")
		.bindControl(-1, keyboard.Y, -1,
					 "castFirst", "down", "action")
		.bindControl(-1, keyboard.U, -1,
					 "castSecond", "down", "action")
		.bindControl(-1, keyboard.I, -1,
					 "castThird", "down", "action")
		.bindControl(-1, keyboard.O, -1,
					 "castFourth", "down", "action")
		.bindControl(-1, keyboard.P, -1,
					 "castFifth", "down", "action")
		.bindControl(-1, keyboard.Y, -1,
					 "releaseFirst", "onUp", "action")
		.bindControl(-1, keyboard.U, -1,
					 "releaseSecond", "onUp", "action")
		.bindControl(-1, keyboard.I, -1,
					 "releaseThird", "onUp", "action")
		.bindControl(-1, keyboard.O, -1,
					 "releaseFourth", "onUp", "action")
		.bindControl(-1, keyboard.P, -1,
					 "releaseFifth", "onUp", "action")
		.bindControl(-1, keyboard.SPACEBAR, -1,
					 "swapMode", "onDown", "action")
		.bindControl(-1, keyboard.TAB, -1,
					 "swapHeroes", "onDown", ["system" ,"action"])
		.bindControl(-1, keyboard.ESC, -1,
					"returnToTitle", "onDown", "system")
		.bindControl(-1, keyboard.SHIFT, -1,
					 "pause", "onDown", "SYSTEM", BasicGame)
	    .bindControl(-1, keyboard.F1, -1,
					 "connectKeyboard", "onDown", [], BasicGame.allPlayers.p1)
		.bindControl(-1, -1, gamepad.XBOX360_START,
					 "connectGamepad", "onDown", [], BasicGame.allPlayers.p1);

	BasicGame.allPlayers.p2.controller
		.bindControl("menu_toggle", keyboard.NUMPAD_MULTIPLY, -1,
					 "toggle", "onDown", "menu")
		.bindControl("menu_next", keyboard.DOWN, -1,
					 "goNext", "down", "menu", -1, 6)
		.bindControl("menu_previous", keyboard.UP, -1,
					 "goPrevious", "down", "menu", -1, 6)
		.bindControl("menu_select", keyboard.NUMPAD_DIVIDE, -1,
					 "select", "onDown", "menu")
		.bindControl(-1, keyboard.LEFT, -1,
					 "goLeft", "down", "movement")
		.bindControl(-1, keyboard.RIGHT, -1,
					 "goRight", "down", "movement")
		.bindControl(-1, keyboard.UP, -1,
					 "goUp", "down", "movement")
		.bindControl(-1, keyboard.DOWN, -1,
					 "goDown", "down", "movement")
		.bindControl(-1, keyboard.UP, -1,
					 "jump", "down", "movement")
		.bindControl(-1, keyboard.UP, -1,
					 "reduceJump", "onDown", "movement")
		.bindControl(-1, keyboard.NUMPAD_7, -1,
					 "orientLeft", "down", "movement")
		.bindControl(-1, keyboard.NUMPAD_9, -1,
					 "orientRight", "down", "movement")
		.bindControl(-1, keyboard.NUMPAD_1, -1,
					 "castFirst", "down", "action")
		.bindControl(-1, keyboard.NUMPAD_4, -1,
					 "castSecond", "down", "action")
		.bindControl(-1, keyboard.NUMPAD_5, -1,
					 "castThird", "down", "action")
		.bindControl(-1, keyboard.NUMPAD_6, -1,
					 "castFourth", "down", "action")
		.bindControl(-1, keyboard.NUMPAD_3, -1,
					 "castFifth", "down", "action")
		.bindControl(-1, keyboard.NUMPAD_1, -1,
					 "releaseFirst", "onUp", "action")
		.bindControl(-1, keyboard.NUMPAD_4, -1,
					 "releaseSecond", "onUp", "action")
		.bindControl(-1, keyboard.NUMPAD_5, -1,
					 "releaseThird", "onUp", "action")
		.bindControl(-1, keyboard.NUMPAD_6, -1,
					 "releaseFourth", "onUp", "action")
		.bindControl(-1, keyboard.NUMPAD_3, -1,
					 "releaseFifth", "onUp", "action")
		.bindControl(-1, keyboard.NUMPAD_ADD, -1,
					 "swapMode", "onDown", "action")
		.bindControl(-1, keyboard.NUMPAD_SUBTRACT, -1,
					 "swapHeroes", "onDown", ["system" ,"action"])
		.bindControl(-1, keyboard.INSERT, -1,
					 "connectKeyboard", "onDown", [], BasicGame.allPlayers.p2)
		.bindControl(-1, -1, gamepad.XBOX360_START,
					 "connectGamepad", "onDown", [], BasicGame.allPlayers.p2);


	for(var i in BasicGame.allPlayers){
		for(var j in commonMaped){
			BasicGame.allPlayers[i].controller.get(j).change(-1,
															 commonMaped[j]);
		}
		
		for(var j in padMaped){
			var functionName = j.substr(j.indexOf("_") + 1, j.length);
			
			BasicGame.allPlayers[i].controller.bindPadControl(j, padMaped[j].axis,
															  padMaped[j].min,
															  padMaped[j].max,
															  functionName,
															  "update",
															  "movement");
		}

		for(var j in konamiMaped){
			BasicGame.allPlayers[i].controller.bindControl(-1, -1, konamiMaped[j],
														   j, "onDown", "konami",
														   BasicGame);
		}
			
		BasicGame.allPlayers[i].controller.get("connectKeyboard").transcendental = true;
		BasicGame.allPlayers[i].controller.get("connectGamepad").transcendental = true;
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


