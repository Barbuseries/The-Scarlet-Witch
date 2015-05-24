var Level = function(mapName, platformTileset, backgroundName,
					 tilesetCollisions, walkableTiles, nextLevel,
					 nextLevelCheckpoint){
	if (typeof(tilesetCollisions) === "undefined"){
		tilesetCollisions = [];
	}

	if (typeof(nextLevelCheckpoint) != "number"){
		nextLevelCheckpoint = 0;
	}

	//Phaser.State.call(this);

	//this.game = game;

	this.mapName = mapName;
	this.map = null;

	this.platformTileset = platformTileset;

	this.backgroundName = backgroundName;
	this.background = null;

	this.tilesetCollisions = tilesetCollisions;
	this.walkableTiles = walkableTiles;

	this.nextLevel = nextLevel;
	this.nextLevelCheckpoint = nextLevelCheckpoint;

	this.checkpoint = 0;

	this.onGameOver = null;
	this.checkGameOverFuncion = null;
	this.gameOvered = false;

	this.onComplete = null;
	this.checkCompleteFunction = null;
	this.completed = false;

	this.saveMenu = null;
	this.gameOverMenu = null;

	this.allHeroes = null;
	this.allEnemies = null;
	this.allItems = null;
	this.allCheckpoints =  null;

	this.allTweens = {
		opening: {
			world: null,
			background: null
		},

		closing: {
			world: null,
			background: null
		}
	};
	
	this.toKill = [];
}

/*Level.prototype = Object.create(Phaser.State.prototype);
Level.prototype.constructor = Level;*/

Level.prototype.preload = function(){
	BasicGame.level = this;

	this.game.world.alpha = 1;
	
	BasicGame.sfx = {};
	BasicGame.musics = {};

	BasicGame.sfx.EXPLOSION_0 = this.game.add.audio("explosion_0");
	BasicGame.sfx.EXPLOSION_0.allowMultiple = true;

	BasicGame.gameSave.level.key = this;
	BasicGame.allPlayers.p1.controller.setTargetByTag(BasicGame.gameSave, "save");

	this.onGameOver = new Phaser.Signal();
	this.onComplete = new Phaser.Signal();

	this.allHeroes = this.game.add.group();
	this.allEnemies = this.game.add.group();
	this.allItems = this.game.add.group();
	this.allCheckpoints = this.game.add.group();
	
	for(var i in BasicGame.pool) {
		BasicGame.pool[i] = this.game.add.group();
	}
	
	this.game.physics.startSystem(Phaser.Physics.ARCADE);
	this.game.physics.arcade.gravity.y = 600;

	this.loadMap();

	this.tagPlatforms();

	this.allTweens.opening.world = this.game.add.tween(this.game.world)
		.from({alpha: 0}, 2000, Phaser.Easing.Quadratic.Out);

	this.allTweens.opening.background = this.game.add.tween(this.background)
		.from({alpha: 0}, 2000, Phaser.Easing.Quadratic.Out);
	
	for(var i in BasicGame.allPlayers){
			BasicGame.allPlayers[i].controller.disable();
		}

	this.allTweens.opening.background.onComplete.add(function(){
		for(var i in BasicGame.allPlayers){
			BasicGame.allPlayers[i].controller.enable();
		}
	});
	
	
	for(var i in this.allTweens.opening){
		this.allTweens.opening[i].start();
	}
}

Level.prototype.createPathFinder = function(i){
	if (typeof(i) != "number"){
		return;
	}
	
	if (i < 0){
		return;
	}

	var prevPathFinder = "_" + (i - 1).toString();
	var pathFinder = "_" + i.toString();

	if (typeof(BasicGame.easyStar[prevPathFinder]) === "undefined"){
		this.createPathFinder(i - 1);
	}

	if (typeof(BasicGame.easyStar[pathFinder]) === "undefined"){
		BasicGame.easyStar[pathFinder] = new EasyStar.js();

		BasicGame.easyStar[pathFinder].enableDiagonals();
		BasicGame.easyStar[pathFinder].setIterationsPerCalculation(1000);
	}

	return BasicGame.easyStar[pathFinder];
}

Level.prototype._create0thGrid = function(){
	this._grid = [];

	var layer = this.map.layers[0];

	for(var i = 0; i < layer.height; i++) {
		this._grid.push(new Array(layer.width));

		// By default, tile = -1.
		for(var j = 0; j < layer.width; j++) {
			this._grid[i][j] = -1;

			var tile = layer.data[i][j];

			if (tile.tag == 'platform'){
				this._grid[i][j] = -3;
			}
			else if (this._grid[i][j] == -1){
				var tileBelow = this.map.getTileBelow(0, j, i);
				var tileBelowBelow = (tileBelow != null) ?
					this.map.getTileBelow(0, tileBelow.x, tileBelow.y) :
					null;
				var tileAbove = this.map.getTileAbove(0, j, i);

				function isPlatform(tile){
					return ((tile != null) &&
							(tile.tag =="platform"));
				}

				if (isPlatform(tileBelow)){
					this._grid[i][j] = 0;
				}
				else{
					if (isPlatform(tileBelowBelow)){
						this._grid[i][j] = 0;
					}
				}
			}

			if (isPlatform(tileAbove)){
				this._grid[i][j] = -2;
			}			
		}
	}

	return this._grid;
}

Level.prototype._createIthGrid = function(i){
	if (typeof(i) != "number"){
		return;
	}
	
	if (i < 0){
		return;
	}

	if (i == 0){
		return this._create0thGrid();
	}

	var layer = this.map.layers[0];

	for(var y = 0; y < layer.height; y++) {
		for(var x = 0; x < layer.width; x++) {
			var tile = layer.data[y][x];

			if (this._grid[y][x] != -1){
				
				/*if (this._grid[y][x] == i){
					for(var k = 1; k <= 2; k++){
						if (x + k < layer.width){
							if (this._grid[y][x + k] == -1){
								this._grid[y][x + k] = i;
							}
							
							if (this._grid[y - 1][x + k] == -1){
								this._grid[y - 1][x + k] = i;
							}
						}
					}
				}*/

				continue;
			}
			else{
				var tileBelow = this.map.getTileBelow(0, x, y);
				var tileBelowBelow = (tileBelow != null) ?
					this.map.getTileBelow(0, tileBelow.x, tileBelow.y) :
					null;

				function isPlatform(tile){
					return ((tile != null) &&
							(tile.tag =="platform"));
				}

				if ((tileBelowBelow != null) &&
					(this._grid[y + 2][x] == (i - 1))){
					this._grid[y][x] = i;

					if (this._grid[y + 1][x] == -1){
						this._grid[y + 1][x] = i;
					}

					/*for(var k = 1; k <= 2; k++){
						if (x - k >  0){
							if (this._grid[y][x - k] == -1){
								this._grid[y][x - k] = i;
							}

							if (this._grid[y + 1][x - k] == -1){
								this._grid[y + 1][x - k] = i;
							}
						}
					}*/
				}
			}
		}
	}

	return this._grid;
}


Level.prototype.initPathFinders = function(){
	var j = 0;
	var acceptableTiles = [];

	for(var i in BasicGame.easyStar){
		acceptableTiles.push(j);
		
		this._createIthGrid(j);

		BasicGame.easyStar[i].setGrid(this._grid);
		BasicGame.easyStar[i].setAcceptableTiles(acceptableTiles);

		// A 0 tile cost 0,
		// A 1 tile cost 10,
		// ...
		// That way, mobs will try to stay on the ground,
		// not jump around like rabbits...
		for(var k = 0; k < acceptableTiles.length; k++) {
			BasicGame.easyStar[i].setTileCost(acceptableTiles[k], 10 * k);
		}

		j++;
	}
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

	for(var i in BasicGame.emitters){
		this.game.physics.arcade.collide(BasicGame.emitters[i], this.game.platforms);
	}

	this.game.physics.arcade.collide(this.allHeroes, this.allEnemies);

	// Collisions (Mob)
	this.game.physics.arcade.overlap(this.allHeroes, this.game.platforms);
	this.game.physics.arcade.overlap(this.allEnemies, this.game.platforms);
	
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

	this.gameOvered = !this.completed && this.checkGameOver();
	this.completed = !this.gameOvered && this.checkComplete();
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

	this.background = this.game.add.tileSprite(0, 0, this.map.widthInPixels,
											   this.map.heightInPixels,
											   this.backgroundName);

	this.game.world.bringToTop(this.game.platforms);
}

Level.prototype.createMobs = function(){
	var allMobs = findObjectsByType("enemy", this.map, "baddies");

	allMobs.forEach(function(item){
		createFromTiledObject(item, this.allEnemies);
	}, this);

	this.allEnemies.forEach(function(item){
		item.tag = "enemy";
	});
}

Level.prototype.createItems = function(){
	var allItems = findObjectsByType("item", this.map, "items");

	allItems.forEach(function(item){
		createFromTiledObject(item, this.allItems);
	}, this);

	this.allItems.forEach(function(item){
		item.tag = "item";
	});
}

Level.prototype.createCheckpoints = function(){
	var allCheckpoints = findObjectsByType("checkpoint", this.map, "checkpoints");

	allCheckpoints.forEach(function(item){
		createFromTiledObject(item, this.allCheckpoints);
	}, this);

	this.allCheckpoints.forEach(function(item){
		item.tag = "checkpoint";
	});
}

Level.prototype.create = function(){
	for(var i in BasicGame.emitters){
		BasicGame.emitters[i] = this.game.add.emitter(0, 0);

		BasicGame.emitters[i].gravity = 200;
		BasicGame.emitters[i].makeParticles(i);
		BasicGame.emitters[i].setAlpha(0, 1, 4000, Phaser.Easing.Quadratic.Out);
	}

	this.createMobs();
	//this.createItems();
	//this.createCheckpoints();

	var checkpoint = this.game.add.sprite(0, 0, "");

	checkpoint.barton = {
		x: 1000,
		
		y: 200
	};
	
	checkpoint.lucy = {
		x: 600,
		
		y: 800
	};

	this.allCheckpoints.addChild(checkpoint);

	BasicGame.gameSave.reload();

	this.game.world.bringToTop(this.allHeroes);
	this.game.world.bringToTop(this.allEnemies);
	
	for(var i in BasicGame.pool){
		this.game.world.bringToTop(BasicGame.pool[i]);
	}
}

Level.prototype.initPlayers = function(){
	for(var i in BasicGame.allPlayers){
		BasicGame.allPlayers[i].menu = new PlayerMenu(BasicGame.allPlayers[i]);

		BasicGame.allPlayers[i].controller.enable("action");

		if (BasicGame.allPlayers[i].hero != null){
			this.game.world.bringToTop(BasicGame.allPlayers[i].hero.menu);
		}
	}

}

Level.prototype.checkGameOver = function(){
	if(typeof(this.checkGameOverFunction) != "function"){
		return false;
	}

	if (this.checkGameOverFunction()){
		this.onGameOver.dispatch();

		return true;
	}

	return false;
}

Level.prototype.checkComplete = function(){
	if(typeof(this.checkCompleteFunction) != "function"){
		return false;
	}

	if (this.checkCompleteFunction()){
		this.onComplete.dispatch();

		return true;
	}

	return false;
}


Level.prototype.shutdown = function(){
	BasicGame.level = null;

	this.onGameOver.dispose();
	this.onGameOver = null;

	this.onComplete.dispose();
	this.onComplete = null;

	this.background.destroy();
	this.background = null;

	this.allHeroes.destroy();
	this.allHeroes = null;

	this.allEnemies.destroy();
	this.allEnemies = null;

	this.allItems.destroy();
	this.allItems = null;

	this.allCheckpoints.destroy();
	this.allCheckpoints = null;

	if (this.saveMenu != null){
		this.saveMenu.destroy();
		this.saveMenu = null;
	}

	if (this.gameOverMenu != null){
		this.gameOverMenu.destroy();
		this.gameOverMenu = null;
	}

	for(var i in this.allTweens){
		for(var j in this.allTweens[i]){
			if (this.allTweens[i][j] != null){
				this.allTweens[i][j].stop();
				this.allTweens[i][j] = null;
			}
		}
	}

	for(var i in BasicGame.allPlayers){
		BasicGame.allPlayers[i].controller.enable();
	}
}

Level.prototype.goToState = function(state){
	this.allTweens.closing.world = this.game.add.tween(this.game.world)
		.to({alpha: 0}, 2000, Phaser.Easing.Quadratic.Out);

	this.allTweens.closing.background = this.game.add.tween(this.background)
		.to({alpha: 0}, 2000, Phaser.Easing.Quadratic.Out);
	
	for(var i in this.allTweens.closing){
		this.allTweens.closing[i].start();
	}

	this.allTweens.closing.background.onComplete.addOnce(function(){
		/*if (this.loadSaveMenu != null){
			this.loadSaveMenu.destroy();
			this.loadSaveMenu = null;
		}*/

		if (this.saveMenu != null){
			this.saveMenu.destroy();
			this.saveMenu = null;
		}

		if (this.gameOverMenu != null){
			this.gameOverMenu.destroy();
			this.gameOverMenu = null;
		}

		for(var i in BasicGame.allPlayers){
			BasicGame.allPlayers[i].menu.destroy();
			BasicGame.allPlayers[i].menu = null;
		}

		this.game.state.start(state);
	}, this);

	for(var i in BasicGame.allPlayers){
		BasicGame.allPlayers[i].menu.close();

		BasicGame.allPlayers[i].controller.disable();
	}
}

Level.prototype.returnToTitle = function(){
	this.goToState("MainMenu");
}

Level.prototype.reload = function(){
	this.goToState(this.state.current);
}

Level.prototype.goToNextLevel = function(){
	this.goToState(this.nextLevel);
}

Level.prototype.save = function(){
	BasicGame.gameSave.save();

	this.saveMenu = new LoadSaveMenu(this.game, BasicGame.allPlayers.p1.controller,
									 true);
	this.saveMenu.toggle();
}

Level.prototype.saveAndNextLevel = function(){
	BasicGame.gameSave.level.key = this.nextLevel;
	BasicGame.gameSave.level.checkpoint = this.nextLevelCheckpoint;

	BasicGame.gameSave.save();

	this.saveMenu = new LoadSaveMenu(this.game, BasicGame.allPlayers.p1.controller,
									 true);
	this.saveMenu.onEndClose.addOnce(function(){
		this.goToNextLevel();
	}, this);

	this.saveMenu.toggle();
}

Level.prototype.gameOver = function(){
	var choice = 1;

	function gameOver(){
		if (choice){
			this.reload();
		}
		else{
			this.returnToTitle();
		}
	}
	
	function confirm(){
		if (choice){
			this.gameOverMenu.title.text = "Êtes-vous sûr ?";
			
			choice = !choice;
		}
		else{
			this.gameOverMenu.title.text = "Réessayer ?";
			
			choice = !choice;
		}
	}

	this.gameOverMenu = new ConfirmationMenu(BasicGame.allPlayers.p1.controller,
											 gameOver, this);

	this.gameOverMenu.title.text = "Réessayer ?";
	
	this.gameOverMenu.noOption.onSelect.removeAll();
	this.gameOverMenu.noOption.onSelect.add(confirm, this);

	this.gameOverMenu.toggle();
}
