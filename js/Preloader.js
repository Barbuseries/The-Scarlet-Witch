BasicGame.Preloader = function (game) {
    this.background = null;
    this.preloadBar = null;
    this.ready = false;
};

BasicGame.Preloader.prototype.preload =  function(){
	var centerX = this.game.camera.width / 2;
	var centerY = this.game.camera.height / 2; 

	var assetsDir = "assets/";

    this.preloadBar = this.game.add.sprite(centerX - 50,
										   centerY,
										   'preloaderBar');
	
	this.preloadBarBackground = this.game.add.sprite(centerX,
													 centerY - 25,
													 "preloaderBarBackground");
	this.preloadBarBackground.anchor.setTo(0.5);

    this.load.setPreloadSprite(this.preloadBar);
	this.preloadBar.angle = -90;
    
	this.load.image("ground2", assetsDir + "platform2.png");
	this.load.image("blood", assetsDir + "bloodParticle.png");

	// Skills
	var skillDir = assetsDir + "Skills/";

	this.load.image("barrier_icon", skillDir + "barrier_icon.png");
	this.load.image("teleport_icon", skillDir + "teleport_icon.png");
	this.load.spritesheet("icons", "assets/icons.png", 16, 16);
	this.load.spritesheet("slash", skillDir + "swoosh_0.png", 32, 32);
	this.load.spritesheet("fireball_0", skillDir + "fireball_1.png", 64, 16);
	this.load.image("fireball_icon", skillDir + "fireball_icon.png");
	this.load.spritesheet("iceball_0", skillDir + "iceball_0.png", 64, 64);
	this.load.image("iceball_icon", skillDir + "iceball_icon.png");
	this.load.spritesheet("thunder_0", skillDir + "thunder_0.png", 256, 64);
	this.load.image("thunder_icon", skillDir + "thunder_icon.png");
	this.load.image("arrow_icon", skillDir + "arrow_icon.png");
	this.load.spritesheet("explosion_0", skillDir + "explosion_0.png", 64, 64);
	this.load.spritesheet("explosion_1", skillDir + "explosion_1.png", 64, 64);

	// Ammo
	var ammoDir = assetsDir + "Ammo/";

	this.load.spritesheet("arrow", ammoDir + "arrow.png", 25, 4);

	// Levels
	var levelsDir = "";

	this.load.tilemap('level1', 'assets/tilemaps/Level1_v3.json', null,
					  Phaser.Tilemap.TILED_JSON);
	this.load.image('Level1_Tiles', 'assets/Tiles 32x32/Tiles_32x32.png');

	// Heroes
	var charactersDir = assetsDir + "Characters/";
	var heroesDir = charactersDir + "Heroes/";

    this.load.spritesheet("lucy", heroesDir + "lucy_full.png", 64, 64);
	this.load.spritesheet("barton", heroesDir + "barton_full.png", 64, 64);


	// Audio
	var audioDir = "audio/";
	var musicDir = audioDir + "Music/";
	var sfxDir = audioDir + "SFX/";

	this.load.audio("mainTheme", musicDir + "Adventure_Meme.wav");
	this.load.audio("cursor_select", sfxDir + "cursor_select.wav");
	this.load.audio("explosion_0", sfxDir + "explosion_0.wav");
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
