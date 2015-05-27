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
		var result = false;

		this.allHeroes.forEachAlive(function(item){
			if (item.x > 2000){
				result = true;
			}
		});

		return result;
	}

	function returnToTitle(victory){
		this.timerToTitle = this.game.time.create(true);

		this.timerToTitle.add(1000, function(){
			if (victory){
				this.saveAndNextLevel();

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
<<<<<<< HEAD

/*BasicGame.allLevels.Level_2.prototype.update = function (){
    Level.prototype.update.call(this);
}*/
=======
>>>>>>> 4cd2fa0de6d6fb5f401631b52a05c07d83d0da97
