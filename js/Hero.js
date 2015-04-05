/********/
/* Hero */
/******************************************************************************/
var Hero = function(game, x, y, name, level, player){
	Mob.apply(this, [game, x, y, name.toLowerCase(), name, level, "hero"]);

	this.animations.add("walkRight", [144, 145, 146, 147, 148, 149, 150, 151], 15);
	this.animations.add("walkLeft", [118, 119, 120, 121, 122, 123, 124, 125], 15);
	this.animations.add("spellCastLeft", [13, 14, 15, 16, 17, 18, 19, 13], 15);
	this.animations.add("spellCastRight", [40, 41, 42, 43, 44, 45, 39], 15);

	this.body.setSize(32, 48, 16, 16);

	this.currentMode = "offensive";

	this.allSkills["offensive"] = {};
	this.allSkills["defensive"] = {};
	
	this.player = player;

	this.player.controller.target = this;


	this.frame = 26;

	this.allStats.endurance = new Stat(this, "Endurance", STAT_NO_MAXSTAT, 0);
	this.allStats.agility = new Stat(this, "Agility", STAT_NO_MAXSTAT, 0);
}

Hero.prototype = Object.create(Mob.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.goLeft = function(control, factor){
	if (typeof(factor) === "undefined"){
        factor = 1;
    }

	this.orientationH = -1;

    this.animations.play("walkLeft", 15 * Math.abs(factor));
    this.body.acceleration.x -= this.ACCELERATION * Math.abs(factor);
}

Hero.prototype.goRight = function(control, factor){	
    if (typeof(factor) === "undefined"){
        factor = 1;
    }

	this.orientationH = 1;

    this.animations.play("walkRight", 15 * Math.abs(factor));
    this.body.acceleration.x += this.ACCELERATION * Math.abs(factor);
}

Hero.prototype.jump = function(control, factor){
    if (typeof(factor) === "undefined"){
        factor = 1;
    }
	
	if (this.jumpCount > 0){
		if ((control.manager.type == CONTROL_GAMEPAD &&
			 control.input.justPressed(250)) ||
			(control.manager.type == CONTROL_KEYBOARD &&
			 control.input.downDuration(250))){
			this.body.velocity.y = -this.JUMP_POWER;
		}
	}
}

Hero.prototype.reduceJump = function(control, factor){
	this.jumpCount--;
}

Hero.prototype.stopMovement = function(){
	if (this.orientationH == 1){
		this.animations.stop("walkRight");
		this.frame = 143;
	}
	else if (hero.orientationH == -1){
		this.animations.stop("walkLeft");
		this.frame = 117;
	}
	
	this.orientationV = 0;
}

var Lucy = function(game, x, y, level, player){
	Hero.apply(this, [game, x, y, "Lucy", level, player]);

	this.MAXJUMP = 2;
	
	this.currentMode = "defensive";

	this.allStats.mainStat = new Stat(this, "Intelligence", STAT_NO_MAXSTAT, 0);

	this.allStats.health = new Stat(this, "Health", STAT_NO_LINK, 30);
	this.allStats.health.setGrowth(function(){
		return this._basicValue + 5 * this.entity.allStats.level.get() +
			2 * this.entity.allStats.endurance.get();
	}, -1, [], true);
	this.allStats.endurance.onUpdate.add(this.allStats.health.grow,
										 this.allStats.health);
	this.allStats.level.onUpdate.add(this.allStats.health.grow,
									 this.allStats.health);

	this.allStats.special = new Stat(this, "Mana", STAT_NO_LINK, 50);
	this.allStats.special.setGrowth(function(){
		return this._basicValue + 5 * this.entity.allStats.level.get() +
			5 * this.entity.allStats.mainStat.get();
	}, -1, [], true);
	this.allStats.mainStat.onUpdate.add(this.allStats.special.grow,
										this.allStats.special);
	this.allStats.level.onUpdate.add(this.allStats.special.grow,
									 this.allStats.special);

	this.allStats.attack = new Stat(this, "Attack", STAT_NO_MAXSTAT, 2);
	this.allStats.attack.setGrowth(function(){
		return this._basicValue + this.entity.allStats.level.get() +
			0.3 * this.entity.allStats.mainStat.get();
	}, -1, [], true);
	this.allStats.mainStat.onUpdate.add(this.allStats.attack.grow,
										 this.allStats.attack);
	this.allStats.level.onUpdate.add(this.allStats.attack.grow,
									 this.allStats.attack);

	this.allStats.defense = new Stat(this, "Defense", STAT_NO_MAXSTAT, 0, 0, 0, 100);
	this.allStats.defense.setGrowth(function(){
		return this._basicValue + 0.125 * this.entity.allStats.level.get() +
			0.1 * this.entity.allStats.endurance.get();
	}, -1, [], true);
	this.allStats.endurance.onUpdate.add(this.allStats.defense.grow,
										 this.allStats.defense);
	this.allStats.level.onUpdate.add(this.allStats.defense.grow,
									 this.allStats.defense);

	this.allStats.dodge = new Stat(this, "Dodge", STAT_NO_MAXSTAT, 5, 5, 0, 100);
	this.allStats.dodge.setGrowth(function(){
		return this._basicValue + 0.1 * this.entity.allStats.level.get() +
			0.5 * this.entity.allStats.agility.get();
	}, -1, [], true);
	this.allStats.agility.onUpdate.add(this.allStats.dodge.grow,
									   this.allStats.dodge);
	this.allStats.level.onUpdate.add(this.allStats.dodge.grow,
									 this.allStats.dodge);

	this.allStats.criticalRate = new Stat(this, "Critical Rate", STAT_NO_MAXSTAT, 5,
										  5, 0, 100);
	this.allStats.criticalRate.setGrowth(function(){
		return this._basicValue + 0.125 * this.entity.allStats.level.get() +
			0.3 * this.entity.allStats.agility.get();
	}, -1, [], true);
	this.allStats.agility.onUpdate.add(this.allStats.criticalRate.grow,
									   this.allStats.criticalRate);
	this.allStats.level.onUpdate.add(this.allStats.criticalRate.grow,
									 this.allStats.criticalRate);

	this.allStats.attackSpeed = new Stat(this, "Attack Speed", STAT_NO_MAXSTAT, 1000,
										 1000, 0, true);
	this.allStats.attackSpeed.setGrowth(function(){
		return this._basicValue - 4 * this.entity.allStats.level.get() -
			2 * this.entity.allStats.agility.get();
	}, -1, [], true);
	this.allStats.agility.onUpdate.add(this.allStats.attackSpeed.grow,
									   this.allStats.attackSpeed);
	this.allStats.level.onUpdate.add(this.allStats.attackSpeed.grow,
									 this.allStats.attackSpeed);

	this.statusUi = new Status_UI(this.game, this, 0, 0);
	this.statusUi.profilSprite.frame = 26;
}

Lucy.prototype = Object.create(Hero.prototype);
Lucy.prototype.constructor = Lucy;

var Barton = function(game, x, y, level, player){
	Hero.apply(this, [game, x, y, "Barton", level, player]);

	this.JUMP_POWER = 250;

	this.allStats.mainStat = new Stat(this, "Strength", STAT_NO_MAXSTAT, 0);

	this.allStats.health = new Stat(this, "Health", STAT_NO_LINK, 40);
	this.allStats.health.setGrowth(function(){
		return this._basicValue + 10 * this.entity.allStats.level.get() +
			3 * this.entity.allStats.endurance.get();
	}, -1, [], true);
	this.allStats.endurance.onUpdate.add(this.allStats.health.grow,
										 this.allStats.health);
	this.allStats.level.onUpdate.add(this.allStats.health.grow,
									 this.allStats.health);

	this.allStats.fury = new Stat(this, "Fury", STAT_NO_LINK, 0, 100, 0, 100);
	
	this.allStats.quiver = new Stat(this, "Quiver", STAT_NO_LINK, 10);
	
	this.allStats.attack = new Stat(this, "Attack", STAT_NO_MAXSTAT, 5);
	this.allStats.attack.setGrowth(function(){
		return this._basicValue + this.entity.allStats.level.get() +
			0.5 * this.entity.allStats.mainStat.get();
	}, -1, [], true);

	this.allStats.defense = new Stat(this, "Defense", STAT_NO_MAXSTAT, 0, 0, 0, 100);
	this.allStats.defense.setGrowth(function(){
		return this._basicValue + 0.5 * this.entity.allStats.level.get() +
			0.1 * this.entity.allStats.endurance.get();
	}, -1, [], true);

	this.allStats.dodge = new Stat(this, "Dodge", STAT_NO_MAXSTAT, 0, 0, 0, 100);
	this.allStats.dodge.setGrowth(function(){
		return this._basicValue + 0.1 * this.entity.allStats.level.get() +
			0.2 * this.entity.allStats.agility.get();
	}, -1, [], true);

	this.allStats.criticalRate = new Stat(this, "Critical Rate", STAT_NO_MAXSTAT, 5,
										  5, 0, 100);
	this.allStats.criticalRate.setGrowth(function(){
		return this._basicValue + 0.125 * this.entity.allStats.level.get() +
			0.3 * this.entity.allStats.agility.get();
	}, -1, [], true);

	this.allStats.attackSpeed = new Stat(this, "Attack Speed", STAT_NO_MAXSTAT, 1000,
										 1000, 0, true);
	this.allStats.attackSpeed.setGrowth(function(){
		return this._basicValue - 4 * this.entity.allStats.level.get() -
			2 * this.entity.allStats.agility.get();
	}, -1, [], true);

	this.statusUi = new Status_UI(this.game, this, 0, 0, true);
	this.statusUi.profilSprite.frame = 26;
}

Barton.prototype =  Object.create(Hero.prototype);
Barton.prototype.constructor = Barton;
/******************************************************************************/
/* Hero */
/********/
