BasicGame.allLevels.Level_1 = function(game){
	this.game = game;
	
	Level.call(this, "Level_1", "Level_1_Tiles", "sky");

	this.nextLevel = "Level_2";
}

BasicGame.allLevels.Level_1.prototype = Object.create(Level.prototype);
BasicGame.allLevels.Level_1.prototype.constructor = BasicGame.allLevels.Level_1;

BasicGame.allLevels.Level_1.prototype.preload = function(){
	Level.prototype.preload.call(this);
	
	this.checkCompleteFunction = function(){
		return this.allEnemies.getFirstAlive() == null;
	}

	function returnToTitle(victory){
		this.timerToTitle = this.game.time.create(true);

		this.timerToTitle.add(1000, function(){
			if (victory){
				this.saveAndNextLevel();
			}
			else{
				this.gameOver();
			}
		}, this);
		
		this.timerToTitle.start();
	}

	this.onComplete.addOnce(function(){
		returnToTitle.call(this, 1);
	}, this);

	this.checkGameOverFunction = function(){
		return this.allHeroes.getFirstDead() != null;
	}

	this.onGameOver.addOnce(function(){
		returnToTitle.call(this, 0);
		
		this.allHeroes.forEach(function(item){
			for(var i in item.can) {
				item.can[i] = false;
			}
		});
	}, this);
}

BasicGame.allLevels.Level_1.prototype.create = function(){
	Level.prototype.create.call(this);

	this.map.setCollisionBetween(0, 23);
	this.map.setCollisionBetween(25, 63);

	this.tagPlatforms();

	this.initPathFinders();

	this.initPlayers();
}
