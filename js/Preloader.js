BasicGame.Preloader = function (game) {
    this.background = null;
    this.preloadBar = null;
    this.ready = false;
};

BasicGame.Preloader.prototype.preload =  function(){
	var centerX = this.game.camera.width / 2;
	var centerY = this.game.camera.height / 2; 

	var assetsDir = "assets/";
	var miscDir = assetsDir + "Misc/";
	var particlesDir = miscDir + "Particles/";

    this.preloadBar = this.game.add.sprite(centerX - 50,
										   centerY,
										   'preloaderBar');
	
	this.preloadBarBackground = this.game.add.sprite(centerX,
													 centerY - 25,
													 "preloaderBarBackground");
	this.preloadBarBackground.anchor.setTo(0.5);

    this.load.setPreloadSprite(this.preloadBar);
	this.preloadBar.angle = -90;
    
	this.load.image("ground2", miscDir + "platform2.png");
	this.load.image("blood", particlesDir + "blood.png");
	this.load.image("circle", miscDir + "circle.png");
	this.load.spritesheet("icons", miscDir + "icons.png", 16, 16);

	// Skills
	var skillDir = assetsDir + "Skills/";

	this.load.image("template_icon", skillDir + "template_icon.png", 64, 64);
	this.load.image("barrier_icon", skillDir + "barrier_icon.png");
	this.load.image("teleport_icon", skillDir + "teleport_icon.png");
	this.load.spritesheet("slash", skillDir + "swoosh_0.png", 32, 32);
	this.load.spritesheet("fireball_0", skillDir + "fireball_1.png", 64, 16);
	this.load.image("fireball_icon", skillDir + "fireball_icon.png");
	this.load.spritesheet("iceball_0", skillDir + "iceball_0.png", 64, 64);
	this.load.spritesheet("poison", skillDir + "poison.png", 64, 64);
	this.load.image("iceball_icon", skillDir + "iceball_icon.png");
	this.load.spritesheet("thunder_0", skillDir + "thunder_0.png", 256, 64);
	this.load.image("thunder_icon", skillDir + "thunder_icon.png");
	this.load.image("arrow_icon", skillDir + "arrow_icon.png");
	this.load.image("multArrow_icon", skillDir + "multArrow_icon.png");
	this.load.image("speedUpArrow_icon", skillDir + "speedUpArrow_icon.png");
	this.load.image("poweredArrow_icon", skillDir + "poweredArrow_icon.png");
	this.load.image("heroicStrike_icon", skillDir + "heroicStrike_icon.png");
	this.load.image("mana_icon", skillDir + "mana_icon.png");
	this.load.image("heal_icon", skillDir + "heal_icon.png");
	this.load.image("selfHeal_icon", skillDir + "selfHeal_icon.png");
	this.load.image("dash_icon", skillDir + "dash_icon.png");
	this.load.image("fury_icon", skillDir + "fury_icon.png");
	this.load.image("spikes_0", skillDir + "spikes_0.png");
	this.load.spritesheet("quake_0", skillDir + "quake_0.png", 256, 128);
	this.load.image("trap_icon", skillDir + 'trap_icon.png');
	this.load.image("slash_icon", skillDir + "slash_icon.png");
	this.load.spritesheet("death", skillDir + "death.png", 32, 32);
	this.load.image("death_icon", skillDir + "death_icon.png");
	this.load.image("poison_icon", skillDir + "poison_icon.png");
	this.load.spritesheet("explosion_0", skillDir + "explosion_0.png", 64, 64);
	this.load.spritesheet("explosion_1", skillDir + "explosion_1.png", 64, 64);
	this.load.image("shield_icon", skillDir + "shield_icon.png", 64, 64);

	// Ammo
	var ammoDir = miscDir + "Ammo/";

	this.load.spritesheet("arrow", ammoDir + "arrow.png", 25, 4);

	// Levels
	var levelsDir = "levels/";
	
	// Tiles assets.
	var tilesDir = assetsDir + "Tiles 32x32/";

	for(var i in BasicGame.allLevels){
		var levelDirectory = levelsDir + i + "/";
		var levelTilemap = levelDirectory + i + ".json";

		this.load.tilemap(i, levelTilemap, null,
						  Phaser.Tilemap.TILED_JSON);
		
		try{
			this.load.image(i + "_Tiles", tilesDir + "Tiles_32x32.png");
		}
		catch(err){}
	}

	// Heroes
	var charactersDir = assetsDir + "Characters/";
	var heroesDir = charactersDir + "Heroes/";
	var ennemiesDir = charactersDir + "Ennemies/";

    this.load.spritesheet("lucy", heroesDir + "lucy_full.png", 64, 64);
	this.load.spritesheet("barton", heroesDir + "barton_full.png", 64, 64);
	this.load.spritesheet("archer_1", ennemiesDir + "archer_1.png", 64, 64);
	this.load.spritesheet("mob_1", ennemiesDir + "mob_1.png", 64, 64);
	this.load.spritesheet("boss_1", ennemiesDir + "boss_1.png", 64, 64);

	// Checkpoints

	this.load.spritesheet("checkpoint", tilesDir + "separate png/tile_50.png", 32, 32);


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
    if (this.cache.isSoundDecoded('mainTheme') &&
		this.ready == false)
    {
        this.ready = true;
        this.state.start('MainMenu');
    }
}
