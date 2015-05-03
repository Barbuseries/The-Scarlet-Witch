var Level = function(game, mapName, platformTileset, backgroundName,
					 tilesetCollisions){
	if (typeof(tilesetCollisions) === "undefined"){
		tilesetCollisions = [];
	}

	this.game = game;

	this.mapName = mapName;
	this.map = null;

	this.platformTileset = platformTileset;

	this.backgroundName = backgroundName;
	this.background = null;

	this.tilesetCollisions = tilesetCollisions;
	
	this.onComplete = new Phaser.Signal();
	this.checkCompleteFunction = null;
	this.completed = false;

	this.allHeroes = null;
	this.allEnnemies = null;
	this.allItems = null;
	this.allCheckpoints =  null;
	
	this.toKill = [];
}

Level.prototype.init = function(){
	this.allHeroes = this.game.add.group();
	this.allEnnemies = this.game.add.group();
	this.allItems = this.game.add.group();
	
	for(var i in BasicGame.pool) {
		BasicGame.pool[i] = this.game.add.group();
	}
	
	this.game.physics.startSystem(Phaser.Physics.ARCADE);
	this.game.physics.arcade.gravity.y = 600;
}

Level.prototype.update = function(){
	// Collisions (projectiles)
	for(var i in BasicGame.pool) {
		this.game.physics.arcade.overlap(BasicGame.pool[i], this.game.platforms,
										 collideProjectile, collideProcessProjectile);
		
		if (i != "textDamage"){
			this.game.physics.arcade.overlap(BasicGame.pool[i], this.allHeroes,
											 collideProjectile,
											 collideProcessProjectile);
			
			this.game.physics.arcade.overlap(BasicGame.pool[i], this.allEnnemies,
											 collideProjectile,
											 collideProcessProjectile);
			
			for(var j in BasicGame.pool){
				if (i == j){
					continue;
				}
				
				this.game.physics.arcade.overlap(BasicGame.pool[i], BasicGame.pool[j],
												 collideProjectile,
												 collideProcessProjectile);
			}
		}
	}

	// Collisions (Mob)
	this.game.physics.arcade.overlap(this.allHeroes, this.game.platforms);
	this.game.physics.arcade.overlap(this.allEnnemies, this.game.platforms);

	this.game.physics.arcade.collide(this.allHeroes, this.allEnnemies);

	
	this.game.physics.arcade.overlap(this.allHeroes, this.allCheckpoints);


	this.allHeroes.forEachAlive(function(item){
		item.body.acceleration.x = 0;
	});

	this.allEnnemies.forEachAlive(function(item){
		item.body.acceleration.x = 0;
	});


	for(var i in BasicGame.allPlayers){
		BasicGame.allPlayers[i].controller.update();
	}
	

	for(var i in this.toKill){
		this.toKill[i].kill();
	}
	
	this.toKill = [];

	this.completed = this.complete();
}

Level.prototype.tagPlatforms = function(){
	var map = this.game.platforms.map;

	for(var i = 0; i < map.layer.data.length; i++) {
		for(var j = 0; j < map.layer.data[i].length; j++) {
			if (map.layer.data[i][j].canCollide){
				map.layer.data[i][j].tag = "platform";
				//map.layer.data[i][j]._dying = false;
			}
		}
	}
}

Level.prototype.loadMap = function(){
	//Chargement des propriétés du tilemap
	this.map = this.game.add.tilemap(this.mapName);

	this.game.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

	// Chargement du Tileset
	this.map.addTilesetImage("platforms", this.platformTileset);

	this.game.platforms = this.map.createLayer('blockedLayer');

	var background = this.game.add.tileSprite(0, 0, this.map.widthInPixels,
											  this.map.heightInPixels,
											  this.backgroundName);

	this.game.world.bringToTop(this.game.platforms);
}

Level.prototype.createMobs = function(){
	var allMobs = findObjectsByType("enemy", this.map, "baddies");

	allMobs.forEach(function(item){
		createFromTiledObject(item, this.allEnnemies, "Mob");
	}, this);

	this.allEnnemies.forEach(function(item){
		item.tag = "enemy";
	});
}

Level.prototype.createItems = function(){
	var allItems = findObjectsByType("item", this.map, "items");

	allItems.forEach(function(item){
		createFromTiledObject(item, this.allItems, "Item");
	}, this);

	this.allItems.forEach(function(item){
		item.tag = "item";
	});
}

Level.prototype.createCheckpoints = function(){
	var allCheckpoints = findObjectsByType("checkpoint", this.map, "checkpoints");

	allCheckpoints.forEach(function(item){
		createFromTiledObject(item, this.allCheckpoints, "Checkpoint");
	}, this);

	this.allCheckpoints.forEach(function(item){
		item.tag = "checkpoint";
	});
}

Level.prototype.load = function(){
	var map = this.loadMap();

	this.tagPlatforms();

	this.createMobs();
	//this.createItems();
	//this.createCheckpoints();

	this.game.world.bringToTop(this.allHeroes);
	this.game.world.bringToTop(this.allEnnemies);
	
	for(var i in BasicGame.pool){
		this.game.world.bringToTop(BasicGame.pool[i]);
	}
}

Level.prototype.complete = function(){
	if(typeof(this.checkCompleteFunction) != "function"){
		return false;
	}

	if (this.checkCompleteFunction()){
		this.onComplete.dispatch();

		return true;
	}

	return false;
}
