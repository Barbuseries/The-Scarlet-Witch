var BasicGame = {
	allPlayers: {
		p1: null,
		
		p2: null
	},

	pool: {
		textDamage: null
	},

	sfx: {},

	volume: {
		sfx: 0.1,
		music: 0.1
	},

	toKill: [],

	mute: function(control){
		control.manager.game.sound.mute = !control.manager.game.sound.mute;
	},

	returnToTitle: function(control){
		if ((control.manager.game.state.current != "MainMenu") &&
			(this.confirmMenu == null)){
			this.confirmMenu = new ConfirmationMenu(control.manager,
							function(){
								control.manager.game.state.start("MainMenu");
							}, null);
			
			this.confirmMenu.toggle();

			this.confirmMenu.onEndClose.add(function(){
				this.confirmMenu.destroy();
				this.confirmMenu = null;
			}, this);
		}
	},

	swapHeroes: function(){
		var temp = BasicGame.allPlayers.p1.getHero();
		
		BasicGame.allPlayers.p1.setHero(BasicGame.allPlayers.p2.getHero());
		BasicGame.allPlayers.p2.setHero(temp);
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
}
BasicGame.Boot.prototype.preload = function(){
	this.load.image("phaserLogo", "assets/Phaser-Logo-Small.png");
    this.load.image('preloaderBarBackground', 'assets/campfire_wood.png');
    this.load.image('preloaderBar', 'assets/campfire_fire.png');
	this.load.image("logo", "assets/TheScarletWitch-Logo.png");
	this.load.image("sky", "assets/Backgrounds/background0_2.png");
	this.load.image("ground", "assets/platform.png");
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

	BasicGame.allPlayers.p1 = new Player(this.game, "1");
	BasicGame.allPlayers.p1.isMain = true;

	BasicGame.allPlayers.p2 = new Player(this.game, "2");

	BasicGame.allPlayers.p1.controller
		.bindControl("menu_toggle", Phaser.Keyboard.ENTER, -1,
					 "toggle", "onDown", "menu")
		.bindControl("menu_next", Phaser.Keyboard.S, -1,
					 "goNext", "onDown", "menu")
		.bindControl("menu_previous", Phaser.Keyboard.Z, -1,
					 "goPrevious", "onDown", "menu")
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
		.bindControl(-1, Phaser.Keyboard.M, -1,
					 "mute", "onDown", "system")
		.bindControl(-1, Phaser.Keyboard.ESC, -1,
					"returnToTitle", "onDown", "system");

	this.game.input.onDown.removeAll();
	this.state.start("Preloader");
}
