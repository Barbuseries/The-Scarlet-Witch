var BasicGame = {};

BasicGame.Boot = function (game) {
};

BasicGame.Boot.prototype.init = function(){
    this.input.maxPointers = 1;


    if (this.game.device.desktop)
    {
        // If you have any desktop specific settings, they can go in here
        //this.scale.pageAlignHorizontally = true;
        this.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.goFullscreen();
    }
    else
    {
        // Same goes for mobile settings.
        // In this case we're saying "scale the game, no lower than 480x260 and no higher than 1024x768"
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.setMinMax(480, 260, 1024, 768);
        this.scale.forceLandscape = true;
        this.scale.pageAlignHorizontally = true;
    }
}
BasicGame.Boot.prototype.preload = function(){
    // Here we load the assets required for our preloader (in this case a background and a loading bar)
	this.load.image("phaserLogo", "assets/Phaser-Logo-Small.png");
    this.load.image('preloaderBarBackground', 'assets/campfire_wood.png');
    this.load.image('preloaderBar', 'assets/campfire_fire.png');
	this.load.image("logo", "assets/TheScarletWitch-Logo.png");
	this.load.image("sky", "assets/background0_2.png");
	this.load.image("ground", "assets/platform.png");
}
BasicGame.Boot.prototype.create = function(){
    // By this point the preloader assets have loaded to the cache, we've set the game settings
    // So now let's start the real preloader going
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
		.to({alpha: 1}, 3000, Phaser.Easing.Cubic.InOut, true)
		.to({alpha: 0}, 3000, Phaser.Easing.Cubic.InOut);

	this.bootTween._lastChild.onComplete.add(this.nextLogo, this);

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
				.to({alpha: 1}, 3000, Phaser.Easing.Cubic.InOut, true)
				.to({alpha: 0}, 3000, Phaser.Easing.Cubic.InOut);

			this.bootTween._lastChild.onComplete.add(this.nextLogo, this);
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
		this.scale.setMaximum();
		this.scale.setScreenSize(true);
		this.scale.pageAlignVertically = false;
		this.scale.pageAlignHorizontally = false;
		this.scale.startFullScreen(false);
	}
}

BasicGame.Boot.prototype.startPreload = function(){
	this.logoGroup.forEachAlive(function(logo){
		logo.kill();
	});

	this.state.start("Preloader");
}
