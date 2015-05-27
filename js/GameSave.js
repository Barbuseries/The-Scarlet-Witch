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
		timePlayed: 0,

		scarletWitch: false
	};
}

GameSave.prototype.save = function(){
	var players = BasicGame.allPlayers;

	for(var i in players){
		var hero = players[i].hero;
		var heroName = hero.name.toLowerCase();

		this.players[i].hero = heroName;
		
		var controls = players[i].controller.allControls;

		for(var j in this.heroes[heroName]){
			this.heroes[heroName][j] = hero.allStats[j].get();

			if ((j != "level") &&
				(j != "experience")){
				this.heroes[heroName][j] /= 5;
			}
		}
	}

	
	/*this.level.key = BasicGame.level.mapName;
	this.level.checkpoint = BasicGame.level.checkpoint;*/
}


GameSave.prototype.reload = function(){
	var heroes = this.createHeroes(BasicGame.level.game);

	var j = 0;

	for(var i in BasicGame.allPlayers){
		var player = BasicGame.allPlayers[i];
		var self = this;
		var checkpoint = getFromGroupIf(BasicGame.level.allCheckpoints, function(){
			return this.index == self.level.checkpoint;
		})

		if (player.hero != null){
			player.hero.destroy();
			player.setHero(null);
		}

		if (checkpoint != null){
			heroes[j].x = checkpoint[this.players[i].hero].x + checkpoint.x;
			heroes[j].y = checkpoint[this.players[i].hero].y + checkpoint.y;
			
			checkpoint.tint = H_RED;
		}
		else{
			heroes[j].x = 0;
			heroes[j].y = 0;
		}

		player.setHero(heroes[j]);

		player.hero.menu.updateStatPoints();
		

		BasicGame.level.allHeroes.addChild(player.hero);

		j++;
	}
}

GameSave.prototype.createHeroes = function(game){
	var heroes = [];

	for(var i in this.players){
		var savedHero = this.heroes[this.players[i].hero];
		var createdHero;
		
		if (this.players[i].hero == "barton"){
			createdHero = new Barton(game, 0, 0, savedHero.level);
		}
		else{
			createdHero = new Lucy(game, 0, 0, savedHero.level);
		}

		createdHero.allStats.experience.add(savedHero.experience);

		for(var j = 0; j < savedHero.mainStat; j++) {
			createdHero.upgradeStat("mainStat");
		}

		for(var j = 0; j < savedHero.endurance; j++) {
			createdHero.upgradeStat("endurance");
		}

		for(var j = 0; j < savedHero.agility; j++) {
			createdHero.upgradeStat("agility");
		}

		heroes.push(createdHero);
	}

	return heroes;
}

GameSave.prototype.load = function(game){
	BasicGame.gameSave = this;

	game.state.start(this.level.key);
}


GameSave.prototype.retrieve = function(){
	
}

GameSave.prototype.copy = function(save){
	for(var i in save){
		if (typeof(save[i] === "object")){
			for(var j in save[i]){
				if (typeof(save[i][j]) === "object"){
					for(var k in save[i][j]){
						this[i][j][k] = save[i][j][k];
					}
				}
				else{
					this[i][j] = save[i][j];
				}
			}
		}
		else{
			if (i != "index"){
				this[i] = save[i];
			}
		}
	}
}

GameSave.prototype.createMiniature = function(game, x, y){
	var miniature = game.add.group();

	var heroes = this.createHeroes(game);

	for(var i = 0; i < heroes.length; i++) {
		heroes[i].visible = false;

		heroes[i].statusUi.fixedToCamera = false;
		heroes[i].statusUi.x = x + 400 * i;
		heroes[i].statusUi.y = y;
		
		miniature.add(heroes[i]);
		miniature.add(heroes[i].statusUi);
	}
	
	return miniature;
}

GameSave.prototype.hardSave = function(){
	localStorage.setItem("save_" + this.index.toString(), JSON.stringify(this));

	console.log("HARD SAVED !");
}
/******************************************************************************/
/* Game Save */
/*************/

/***************/
/* Option Save */
/******************************************************************************/
var OptionsSave = function(){
	this.players = {
		p1: {},

		p2: {}
	};

	for(var i in this.players){
		this.players[i].controls = {};
		this.players[i].controlType = CONTROL_KEYBOARD;
	}

	this.misc = {
		volume: {},
		
		soundOn: true
	};
}

OptionsSave.prototype.save = function(){
	var players = BasicGame.allPlayers;

	for(var i in players){
		var controls = players[i].controller.allControls;

		for(var j in controls){
			this.players[i].controls[j] = {};

			if (controls[j] instanceof Control){
				this.players[i].controls[j] = {
					keyboardCode: controls[j].keyboardCode,

					gamePadCode: controls[j].gamepadCode
				};
			}
			else if (controls[j] instanceof PadControl){
				this.players[i].controls[j] = {
					axis: controls[j].axis,

					min: controls[j].min,

					min: controls[j].max
				};
			}
		}

		this.players[i].controlType = players[i].controller.type;
	}

	for(var i in BasicGame.volume){
		this.misc.volume[i] = BasicGame.volume[i];
	}

	this.misc.soundOn = !BasicGame.game.sound.mute;
}


OptionsSave.prototype.load = function(){
	for(var i in this.players){
		var player = BasicGame.allPlayers[i];
		
		for(var j in this.players[i].controls){
			var savedControl = this.players[i].controls[j];
			var control = player.controller.get(savedControl);

			if (control instanceof Control){
				control.change(savedControl.keyboardCode, savedControl.gamepadCode);
			}
			else if (control instanceof PadControl){
				control.change(savedControl.axis, savedControl.min, savedControl.max);
			}
		}

		player.controller.type = this.players[i].controlType;
	}

	for(var i in this.misc.volume){
		BasicGame.volume[i] = this.misc.volume[i];
	}

	BasicGame.game.sound.mute = !this.misc.soundOn;
}


OptionsSave.prototype.hardSave = function(){
	localStorage.setItem("options", JSON.stringify(this));

	console.log("OPTIONS HARD SAVED !");
}
/******************************************************************************/
/* Option Save */
/***************/
