BasicGame.Preloader = function (game) {
    this.background = null;
    this.preloadBar = null;
    this.ready = false;
};

BasicGame.Preloader.prototype.preload =  function(){
	var centerX = this.game.camera.width / 2;
	var centerY = this.game.camera.height / 2; 

    this.preloadBar = this.game.add.sprite(centerX - 50,
										   centerY,
										   'preloaderBar');
	
	this.preloadBarBackground = this.game.add.sprite(centerX,
													 centerY - 25,
													 "preloaderBarBackground");
	this.preloadBarBackground.anchor.setTo(0.5);

    this.load.setPreloadSprite(this.preloadBar);
	this.preloadBar.angle = -90;
    
	this.load.image("ground2", "assets/platform2.png");
	this.load.image("perso", "assets/firstaid.png");
    this.load.spritesheet("lucy", "assets/Lucy/SaraFullSheet.png", 64, 64);
	this.load.spritesheet("lucy1", "assets/Lucy/SaraHairBottomLayer.png", 64, 64);
	this.load.spritesheet("lucy2", "assets/Lucy/SaraHairShadowOnFace.png", 64, 64);
	this.load.spritesheet("lucy3", "assets/Lucy/SaraHairTopLayer.png", 64, 64);
	this.load.spritesheet("lucy4", "assets/Lucy/SaraLeggings.png", 64, 64);
	this.load.spritesheet("lucy2", "assets/Lucy/SaraShirt.png", 64, 64);
	this.load.spritesheet("lucy2", "assets/Lucy/SaraShoes.png", 64, 64);
}

BasicGame.Preloader.prototype.create = function(){
    this.preloadBar.cropEnabled = false;
}

BasicGame.Preloader.prototype.update = function(){
	this.state.start('MainMenu');
    /*if (this.cache.isSoundDecoded('titleMusic') && this.ready == false)
    {
        this.ready = true;
        this.state.start('MainMenu');
    }*/
}
