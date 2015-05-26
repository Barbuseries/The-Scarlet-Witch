BasicGame.allLevels.Level_2 = function(game){
	this.game = game;
	
	Level.call(this, "Level_2", "Level_1_Tiles", "sky");

	this.nextLevel = "Level_1";
}

BasicGame.allLevels.Level_2.prototype = Object.create(Level.prototype);
BasicGame.allLevels.Level_2.prototype.constructor = BasicGame.allLevels.Level_2;

BasicGame.allLevels.Level_2.prototype.preload = function(){
	Level.prototype.preload.call(this);
	
	this.checkCompleteFunction = function(){
		return this.allEnemies.getFirstAlive() == null;
	}

	function returnToTitle(victory){
		this.timerToTitle = this.game.time.create(true);

		this.timerToTitle.add(1000, function(){
			if (victory){
				this.save();

				/*this.saveMenu.onEndClose.add(function(){
					this.returnToTitle();
				}, this);*/
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

var mob1;
var mob2;

BasicGame.allLevels.Level_2.prototype.create = function(){
	Level.prototype.create.call(this);

	this.map.setCollisionBetween(0, 63);
	this.tagPlatforms();

	this.initPathFinders();

	this.initPlayers();
}

/*BasicGame.allLevels.Level_2.prototype.update = function (){
    Level.prototype.update.call(this);
}*/
