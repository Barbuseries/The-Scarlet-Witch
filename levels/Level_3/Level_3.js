BasicGame.allLevels.Level_3 = function(game){
	this.game = game;
	
	Level.call(this, "Level_3", "Level_1_Tiles", "sky");

	this.nextLevel = "Level_1";
}

BasicGame.allLevels.Level_3.prototype = Object.create(Level.prototype);
BasicGame.allLevels.Level_3.prototype.constructor = BasicGame.allLevels.Level_2;

BasicGame.allLevels.Level_3.prototype.preload = function(){
	Level.prototype.preload.call(this);
	
	this.checkCompleteFunction = function(){
		return this.allEnemies.getFirstAlive() == null;
	}

	function returnToTitle(victory){
		this.timerToTitle = this.game.time.create(true);

		this.timerToTitle.add(1000, function(){
			if (victory){
				//this.saveAndNextLevel();
				
				this.save();

				this.saveMenu.onEndClose.addOnce(function(){
					this.goToState("ToBeContinued");
				}, this);
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

	this.music = this.game.add.audio("mainTheme");
	this.music.volume = 0;
}

BasicGame.allLevels.Level_3.prototype.create = function(){
	Level.prototype.create.call(this);

	this.map.setCollisionBetween(0, 23);
	this.map.setCollisionBetween(25, 63);

	this.tagPlatforms();

	this.initPathFinders();

	this.initPlayers();
}

BasicGame.allLevels.Level_3.prototype.update = function(){
	Level.prototype.update.call(this);

	var maxDistance = 0;

	this.allHeroes.forEach(function(item){
		if (item.x > maxDistance){
			maxDistance = item.x
		}
	});

	this.music.volume = maxDistance / this.map.widthInPixels * BasicGame.volume.music;
}
