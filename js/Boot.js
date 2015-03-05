var BasicGame = {};

BasicGame.Boot = function (game) {
};

BasicGame.Boot.prototype.init = function(){
    this.input.maxPointers = 1;


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
	this.load.image("sky", "assets/background0_2.png");
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

	this.state.start("Preloader");
}
