var Level = function(game, mapName, platformTileset, backgroundName,
					 tilesetCollisions, walkableTiles){
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
	this.walkableTiles = walkableTiles;
	
	this.onComplete = new Phaser.Signal();
	this.checkCompleteFunction = null;
	this.completed = false;

	this.allHeroes = null;
	this.allEnemies = null;
	this.allItems = null;
	this.allCheckpoints =  null;
	
	this.toKill = [];
}

Level.prototype.init = function(){
	this.allHeroes = this.game.add.group();
	this.allEnemies = this.game.add.group();
	this.allItems = this.game.add.group();
	
	for(var i in BasicGame.pool) {
		BasicGame.pool[i] = this.game.add.group();
	}
	
	this.game.physics.startSystem(Phaser.Physics.ARCADE);
	this.game.physics.arcade.gravity.y = 600;
}

//Create a basic grid.
Level.prototype.initPathFinders = function(){
	var grid = [];
	var layer = this.map.layers[0];

	for(var i = 0; i < layer.height; i++){
		grid.push(new Array(layer.width));
		
		for(var j = 0; j < layer.width; j++) {
			grid[i][j] = 0;

			var tile = layer.data[i][j];

			// If the tile is not a platform (you can walk ON a
			// platform, not THROUGH it).
			if (tile.tag != "platform"){
				var tileBelow = this.map.getTileBelow(0, j, i);
				var tileLeftBelow = (tileBelow != null) ? this.map.getTileLeft(0, tileBelow.x, tileBelow.y) :
					null;
				var tileRightBelow = (tileBelow != null) ? this.map.getTileRight(0, tileBelow.x, tileBelow.y) :
					null;
				
				var tileAbove = this.map.getTileAbove(0, j, i);
				var tileLeftAbove = (tileAbove != null) ? this.map.getTileLeft(0, tileAbove.x, tileAbove.y) :
					null;
				var tileRightAbove = (tileAbove != null) ? this.map.getTileRight(0, tileAbove.x, tileAbove.y) :
					null;

				var tileLeft = this.map.getTileLeft(0, j, i);
				var tileRight = this.map.getTileRight(0, j, i);
				var tileBelowBelow = (tileBelow != null) ? this.map.getTileBelow(0, tileBelow.x, tileBelow.y) :
					null;

				// If the tile below is a platform, you can move
				// through this tile.
				if ((tileBelow != null) &&
					(tileBelow.tag == "platform")){
					grid[i][j] = 1;
				}
				else{
					// You can also do it if the tile in the
					// bottom-left is a platform (by jumping).
					if ((tileLeftBelow != null) &&
						(tileLeftBelow.tag == "platform")){
						grid[i][j] = 1;
					}
					// The same goes for the right.
					else if ((tileRightBelow != null) &&
							 (tileRightBelow.tag == "platform")){
						grid[i][j] = 1;
					}

					if ((tileBelowBelow != null) &&
						(tileBelowBelow.tag == "platform")){
						grid[i][j] = 1;
					}
				}

				// If the tile above is not a platform.
				if ((tileAbove == null) ||
					(tileAbove.tag != "platform")){
					// You can fall.
					if ((tileLeftAbove != null) &&
						(tileLeftAbove.tag == "platform")){
						grid[i][j] = 1;
					}
					else if ((tileRightAbove != null) &&
							 (tileRightAbove.tag == "platform")){
						grid[i][j] = 1;
					}
				}
				// TODO: Check to see if there's enough space. Instead
				// of just setting it to 0.
				else{
					grid[i][j] = 0;
 				}

				if ((tileLeft != null) &&
					(tileLeft.tag == "platform")){
					grid[i][j] = 1;
				}
				
				if ((tileRight != null) &&
					(tileRight.tag == "platform")){
					grid[i][j] = 1;
				}
			}
		}
	}

	for(var i in BasicGame.easyStar){
		BasicGame.easyStar[i].setGrid(grid);
		BasicGame.easyStar[i].setAcceptableTiles(1);
	}

	this._grid = grid;
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
			
			this.game.physics.arcade.overlap(BasicGame.pool[i], this.allEnemies,
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
	this.game.physics.arcade.overlap(this.allEnemies, this.game.platforms);

	this.game.physics.arcade.collide(this.allHeroes, this.allEnemies);

	
	this.game.physics.arcade.overlap(this.allHeroes, this.allCheckpoints);


	this.allHeroes.forEachAlive(function(item){
		item.body.acceleration.x = 0;
	});

	this.allEnemies.forEachAlive(function(item){
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
		createFromTiledObject(item, this.allEnemies, "Mob");
	}, this);

	this.allEnemies.forEach(function(item){
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
	this.game.world.bringToTop(this.allEnemies);
	
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
