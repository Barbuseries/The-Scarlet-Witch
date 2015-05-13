/*************/
/* Game Save */
/******************************************************************************/
var GameSave = function(index){
	if (typeof(index) != "number") return;

	this.index = index;

	this.players = {
		p1: {
			hero: "lucy"
		},
		
		p2: {
			hero: "barton"
		}
	};

	for(var i in this.players){
		this.players[i].controls = {};
		this.players[i].controlType = CONTROL_KEYBOARD;
	}
	
	this.heroes = {
		lucy: {},
		
		barton: {}
	};

	for(var i in this.heroes){
		this.heroes[i].level = 1;
		this.heroes[i].experience = 0;

		this.heroes[i].mainStat = 0;
		this.heroes[i].endurance = 0;
		this.heroes[i].agility = 0;
	}

	this.level = {
		key: "",

		checkpoint: 0
	};

	this.misc = {
		volume: {
			music: 1,
			sfx: 1
		},

		timePlayed: 0,
		scarletWitch: false
	};
}
/******************************************************************************/
/* Game Save */
/*************/

GameSave.prototype.save = function(){
	var players = BasicGame.allPlayers;


	for(var i in players){
		var hero = players[i].hero;
		var heroName = hero.name.toLowerCase();

		this.players[i].hero = heroName;
		
		var controls = players[i].controller.allControls;

		for(var j in controls){
			this.players[i].controls[j] = {};

			if (controls[j] instanceof Control){
				this.players[i].controls[j] = {
					keyboardCode: controls[j].keyboardCode,

					gamePadCode: controls[j].gamepadCode
				};
			}

			if (controls[j] instanceof PadControl){
				this.players[i].controls[j] = {
					axis: controls[j].axis,

					min: controls[j].min,

					min: controls[j].max
				};
			}
		}

		this.players[i].controlType = players[i].controller.type;

		for(var j in this.heroes[heroName]){
			this.heroes[heroName][j] = hero.allStats[j].get();

			if ((j != "level") &&
				(j != "experience")){
				this.heroes[heroName][j] /= 5;
			}
		}
	}

	if (BasicGame.level.completed){
		this.level.key = BasicGame.level.mapName;
		this.level.checkpoint = BasicGame.level.checkpoint;
	}
	else{
		this.level.key = BasicGame.level;
		this.level.checkpoint = BasicGame.level.checkpoint;
	}

	for(var i in this.misc.volume){
		this.misc.volume[i] = BasicGame.volume[i];
	}

}


GameSave.prototype.reload = function(){
	for(var i in this.players){
		var player = BasicGame.allPlayers[i];
		var savedHero = this.heroes[this.players[i].hero];
		var checkpoint = BasicGame.level.allCheckpoints.getChildAt(this.level.checkpoint);
		
		if (player.hero != null){
			player.hero.destroy();
			player.setHero(null);
		}
		
		if (this.players[i].hero == "barton"){
			player.setHero(new Barton(BasicGame.level.game,
									  checkpoint.barton.x, checkpoint.barton.y,
									  savedHero.level));
		}
		else{
			player.setHero(new Lucy(BasicGame.level.game, 
									checkpoint.lucy.x, checkpoint.lucy.y,
									savedHero.level));
		}

		player.hero.allStats.experience.add(savedHero.experience);

		for(var j = 0; j < savedHero.mainStat; j++) {
			player.hero.upgradeStat("mainStat");
		}

		for(var j = 0; j < savedHero.endurance; j++) {
			player.hero.upgradeStat("endurance");
		}

		for(var j = 0; j < savedHero.agility; j++) {
			player.hero.upgradeStat("agility");
		}

		player.hero.menu.updateStatPoints();
		

		BasicGame.level.allHeroes.addChild(player.hero);
	}
}


GameSave.prototype.retrieve = function(){
	
}

GameSave.prototype.hardSave = function(){
	BasicGame.allGameSaves.push(this);

	localStorage.setItem("save_" + this.index.toString(), JSON.stringify(this));

	console.log("HARD SAVED !");
}
