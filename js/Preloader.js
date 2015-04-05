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
	this.load.image("blood", "assets/bloodParticle.png");
	this.load.image("barrier_icon", "assets/Skills/barrier_icon.png");
	this.load.image("teleport_icon", "assets/Skills/teleport_icon.png");
	this.load.spritesheet("icons", "assets/icons.png", 16, 16);
	this.load.spritesheet("slash", "assets/Skills/swoosh_0.png", 32, 32);
	this.load.spritesheet("fireball_0", "assets/Skills/fireball_1.png", 64, 16);
	this.load.image("fireball_icon", "assets/Skills/fireball_icon.png");
	this.load.spritesheet("iceball_0", "assets/Skills/iceball_0.png", 64, 64);
	this.load.image("iceball_icon", "assets/Skills/iceball_icon.png");
	this.load.spritesheet("explosion_0", "assets/Skills/explosion_0.png", 64, 64);
	this.load.spritesheet("explosion_1", "assets/Skills/explosion_1.png", 64, 64);
	this.load.tilemap('level1', 'assets/tilemaps/Level1.json', null,
					  Phaser.Tilemap.TILED_JSON);
	this.load.image('Level1_Tiles', 'assets/Tiles 32x32/Tiles_32x32.png');
    this.load.spritesheet("lucy", "assets/Lucy/LucyFullSheet.png", 64, 64);
	this.load.spritesheet("barton", "assets/BartonFullSheet.png", 64, 64);
	this.load.spritesheet("lucy1", "assets/Lucy/SaraHairBottomLayer.png", 64, 64);
	this.load.spritesheet("lucy2", "assets/Lucy/SaraHairShadowOnFace.png", 64, 64);
	this.load.spritesheet("lucy3", "assets/Lucy/SaraHairTopLayer.png", 64, 64);
	this.load.spritesheet("lucy4", "assets/Lucy/SaraLeggings.png", 64, 64);
	this.load.spritesheet("lucy2", "assets/Lucy/SaraShirt.png", 64, 64);
	this.load.spritesheet("lucy2", "assets/Lucy/SaraShoes.png", 64, 64);

	this.load.audio("mainTheme", "audio/Music/Adventure_Meme.wav");
	this.load.audio("cursor_select", "audio/SFX/cursor_select.wav");
	this.load.audio("explosion_0", "audio/SFX/explosion_0.wav");

	BasicGame.bloodPool = null; 
	BasicGame.slashPool = null; 
	BasicGame.firePool = null;
	BasicGame.icePool = null;
	BasicGame.explosionPool = null;
	BasicGame.iceExplosionPool = null;

	BasicGame.sfx = {};
}

BasicGame.Preloader.prototype.create = function(){
    this.preloadBar.cropEnabled = false;
}

BasicGame.Preloader.prototype.update = function(){
    if (this.cache.isSoundDecoded('mainTheme') && this.ready == false)
    {
        this.ready = true;
        this.state.start('MainMenu');
    }
}
