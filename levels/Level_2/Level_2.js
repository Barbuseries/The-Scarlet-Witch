BasicGame.allLevels.Level_2 = function(game){
	this.game = game;
	
	Level.call(this, "Level_2", "Level_1_Tiles", "sky");

	this.nextLevel = "MainMenu";
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

	mob1 = this.allEnemies.getChildAt(0);
	mob2 = this.allEnemies.getChildAt(1);

	mob1.allStats.special.setMax(1000);
	mob1.allStats.special.set(1, 1);
	
	mob1.allStats.attack.add(5);

	mob1.onDeath.add(function(){
		this.allHeroes.forEach(function(item){
			item.gainExperience(100);
		})
	}, this);

	mob1.allSkills[0].firstSkill = new ArrowSkill(mob1, 1, ["platform", "hero"]);
}

BasicGame.allLevels.Level_2.prototype.update = function (){
    Level.prototype.update.call(this);

	if (!this.completed && !this.gameOvered){
		/*this.lucy.allStats.special.add(0.01 / 60, 1);
		this.lucy.allStats.health.add(0.01, 1);*/

		//this.lucy.allStats.experience.add(100);

		var nearest = mob1.getNearestTarget();

		if (nearest != mob1.target){
			mob1.follow(nearest);
		}

		if (mob1.target != null){
			if (Math.abs(mob1.target.x - mob1.x) < 500){
				if (mob1.target.x < mob1.x){
					mob1.orientLeft();
				}

				else{
					mob1.orientRight();
				}

				mob1.castFirst(null, 0.75);
			}
			else if (mob1.allSkills[mob1.currentMode].firstSkill.chargeTime.get()){
				mob1.releaseFirst();
			}
		}

		var nearest = mob2.getNearestTarget();

		if (nearest != mob2.target){
			mob2.follow(nearest);
		}
	}
}
