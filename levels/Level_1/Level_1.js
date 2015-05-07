BasicGame.allLevels.Level_1 = function(game){
	this.game = game;
	
	Level.call(this, "Level_1", "Level_1_Tiles", "sky");

	this.nextLevel = "MainMenu";
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
				this.save();

				this.saveMenu.onEndClose.add(function(){
					this.returnToTitle();
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
}

var mob1;
var mob2;

BasicGame.allLevels.Level_1.prototype.create = function(){
	Level.prototype.create.call(this);

	this.map.setCollisionBetween(0, 63);
	this.tagPlatforms();

	this.initPathFinders();

	this.barton = new Barton(this.game, 1000, 200, 1);
	//this.barton.scale.setTo(1.3);
	this.barton.allResistances[Elements.FIRE] = 2;
	/*this.barton.allStats.endurance.add(100);
	this.barton.allStats.mainStat.add(100);
	this.barton.allStats.health.set(1, 1);
	this.barton.allStats.agility.add(99);*/

	this.lucy = new Lucy(this.game, 600, 800, 1);
/*	this.lucy.allStats.endurance.add(100);
	this.lucy.allStats.mainStat.add(100);
	this.lucy.allStats.agility.add(100);
	this.lucy.allStats.special.set(1, 1);*/
	this.lucy.allResistances[Elements.WIND] = 0.5;
	this.lucy.allResistances[Elements.PHYSIC] = -0.5;

	this.allHeroes.add(this.barton);
	this.allHeroes.add(this.lucy);

	this.initPlayers();

	mob1 = this.allEnemies.getChildAt(0);
	mob2 = this.allEnemies.getChildAt(1);

	mob1.follow(this.lucy);
	mob2.follow(this.barton);

	mob1.allStats.special.setMax(1000);
	mob1.allStats.special.set(1, 1);
	
	mob1.allStats.attack.add(5);

	mob1.onDeath.add(function(){
		this.allHeroes.forEach(function(item){
			item.gainExperience(10);
		})
	}, this);

	mob1.allSkills[0].firstSkill = new ArrowSkill(mob1, 1, ["platform", "hero"]);

	this.barton.quiverRegen.start();
}

BasicGame.allLevels.Level_1.prototype.update = function (){
    Level.prototype.update.call(this);

	if (!this.completed && !this.gameOvered){
		this.lucy.allStats.special.add(0.01 / 60, 1);
		//this.lucy.allStats.health.add(0.01, 1);

		//this.lucy.allStats.experience.add(100);

		if (Math.abs(this.lucy.x - mob1.x) < 500){

			if (this.lucy.x < mob1.x){
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
}
