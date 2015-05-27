/*******/
/* Mob */
/******************************************************************************/
var Mob = function(game, x, y, spritesheet, name, level, tag, initFunction,
				   updateFunction, killFunction){
	Npc.apply(this, [game, x, y, spritesheet, name, initFunction, updateFunction,
					killFunction]);

	this.body.collideWorldBounds = true;

	this.tag = tag;

	this.allStats = {};

	this.currentMode = 0;

	this.allSkills = [];
	this.allSkills[0] = {};
	this.allSkills[1] = {};

	this.allResistances = [];

	for(var i = Elements.PHYSIC; i <= Elements.ALMIGHTY; i++) {
		this.allResistances[i] = 0;
	}

	for(var i = Disabilities.STUN; i <= Disabilities.SLOW; i++){
		this.allResistances[i] = 0;
	}

	this.allTimers = {
		follow: null,
		skillCharge: null,
		stun: null,
		slow: null,
		dot: null,
		regen: null
	};

	this.allStats.level = new Stat(this, "Level", STAT_NO_MAXSTAT, level, level,
								   0, 99);
	this.allStats.health = new Stat(this, "Health", STAT_PERCENT_LINK, 1);
	this.allStats.special = new Stat(this, "Special", STAT_PERCENT_LINK, 0);

	this.allStats.attack = new Stat(this, "Attack", STAT_NO_MAXSTAT, 0);
	this.allStats.defense = new Stat(this, "Defense", STAT_NO_MAXSTAT, 0, 0, 0, 100);

	this.allStats.mainStat = new Stat(this, "Main Stat", STAT_NO_MAXSTAT, 0, 0,
									  0, 100);
	this.allStats.endurance = new Stat(this, "Endurance", STAT_NO_MAXSTAT, 0, 0,
									   0, 100);
	this.allStats.agility = new Stat(this, "Agility", STAT_NO_MAXSTAT, 0, 0,
									 0, 100);

	this.allStats.dodge = new Stat(this, "Dodge", STAT_NO_MAXSTAT, 0, 0, 0, 100);
	this.allStats.criticalRate = new Stat(this, "Critical Rate", STAT_NO_MAXSTAT, 0,
										  0, 0, 100);
	this.allStats.attackSpeed = new Stat(this, "Attack Speed", STAT_NO_MAXSTAT, 1000,
										 1000, 0, true);

	this.allStats.level.onUpdate.add(this.allStats.health.grow,
									 this.allStats.health);
	this.allStats.level.onUpdate.add(this.allStats.special.grow,
									 this.allStats.special);
	this.allStats.level.onUpdate.add(this.allStats.attack.grow,
									 this.allStats.attack);
/*	this.allStats.level.onUpdate.add(this.allStats.mainStat.grow,
									 this.allStats.mainStat);
	this.allStats.level.onUpdate.add(this.allStats.endurance.grow,
									 this.allStats.endurance);*/
	this.allStats.level.onUpdate.add(this.allStats.defense.grow,
									 this.allStats.defense);
/*	this.allStats.level.onUpdate.add(this.allStats.agility.grow,
									 this.allStats.agility);*/
	this.allStats.level.onUpdate.add(this.allStats.dodge.grow,
									 this.allStats.dodge);
	this.allStats.level.onUpdate.add(this.allStats.criticalRate.grow,
									 this.allStats.criticalRate);
	this.allStats.level.onUpdate.add(this.allStats.attackSpeed.grow,
									 this.allStats.attackSpeed);


	this.allStats.mainStat.onUpdate.add(this.allStats.attack.grow,
										this.allStats.attack);
	
	this.allStats.endurance.onUpdate.add(this.allStats.health.grow,
										 this.allStats.health);
	this.allStats.endurance.onUpdate.add(this.allStats.defense.grow,
										 this.allStats.defense);
	

	this.allStats.agility.onUpdate.add(this.allStats.dodge.grow,
									   this.allStats.dodge);
	this.allStats.agility.onUpdate.add(this.allStats.criticalRate.grow,
									   this.allStats.criticalRate);
	this.allStats.agility.onUpdate.add(this.allStats.attackSpeed.grow,
									   this.allStats.attackSpeed);

	this.allStats.health.onUpdate.add(function(stat, oldValue, newValue){
		if (newValue == 0){
			this.die();
		}
	}, this);

	this.healthBar = new MonoGauge(this.game,
								   0, 0,
								   this.width, 2,
								   this.allStats.health, H_RED, H_WHITE,
								   "", "");
	this.healthBar.width /= this.scale.x;
	this.healthBar.height /= this.scale.y;
	this.healthBar.x /= this.scale.x;
	this.healthBar.y /= this.scale.y;

	this.healthBar.backgroundFill.alpha = 0;
	this.healthBar.allowIncreaseAnimation = false;
	this.healthBar.allowDecreaseAnimation = false;

	this.allStats.health.onUpdate.add(function(){
		this.healthBar.x = (this.width - this.healthBar.fill.width) / 2;
		this.healthBar.x /= this.scale.x;
	}, this);
	this.addChild(this.healthBar);

	this.SPEED = 250;
	this.ACCELERATION = 200;
	this.JUMP_POWER = 200;
	this.DRAG = 1000;
	this.MAXJUMP = 1;
	this.jumpCount = this.MAXJUMP;

	this.body.maxVelocity.setTo(this.SPEED, this.SPEED * 1.5);
	this.body.drag.setTo(this.DRAG, 0);

	this.pathFinder = null;

	this._textDamageDir = 1;
}

Mob.prototype = Object.create(Npc.prototype);
Mob.prototype.constructor = Mob;

Mob.prototype.update = function(){
	if (this.body.onFloor()){
		this.jumpCount = this.MAXJUMP;
		this.body.drag.setTo(this.DRAG, 0);
	}

	var nearest = this.getNearestTarget();

	if (nearest != this.target){
		this.follow(nearest);
	}

	Npc.prototype.update.call(this);
}

Mob.prototype.jump = function(factor){
	if (this._dying ||
		!this.can.jump){
		return;
	}

	if (typeof(factor) === "undefined"){
        factor = 1;
    }
	
	if (this.jumpCount > 0){
		this.body.velocity.y = -this.JUMP_POWER * factor;

		this.jumpCount--;
	}
}

Mob.prototype.suffer = function(brutDamages, damageRange, criticalChance, element,
								stat, stroke){
	if (typeof(stat) === "undefined"){
		stat = this.allStats.health;
	}

	var actualDamage = (Math.random() * (damageRange[1] - damageRange[0]) +
						damageRange[0]) * brutDamages;
	var color = (this.tag == "hero") ? RED : WHITE;

	if (Math.random() * 100 < criticalChance){
		actualDamage *= 1.5;
		
		color = YELLOW;
	}

	actualDamage *= (1 - this.allResistances[element]);

	if (actualDamage < 0){
		color = GREEN;
	}
	else{
		var finalDefense = this.allStats.defense.get() / 100;

		finalDefense = (finalDefense > 1) ? 1 : finalDefense;

		actualDamage *= (1 - this.allStats.defense.get() / 100);
	}

	if (actualDamage == 0){
		color = GREY;
	}

	if (typeof(stroke) === "undefined"){
		switch(element){
		case Elements.FIRE:
			stroke = RED;
			break;
		case Elements.ICE:
			stroke = BLUE;
			break;
		case Elements.WIND:
			stroke = GREEN;
			break;
		case Elements.EARTH:
			stroke = ORANGE;
			break;
		case Elements.THUNDER:
			stroke = YELLOW;
			break;
		case Elements.POISON:
			stroke = PURPLE;
			break;k
		case Elements.ALMIGHTY:
			stroke = GREY;
			break;
		default:
			stroke = BLACK;
			break;
		}
	}

	actualDamage = actualDamage.toFixed(0);
	
	createTextDamage(this.game, this.x + this.width / 2, this.y + this.height / 2,
					 actualDamage, color).text.stroke = stroke;

	stat.subtract(actualDamage);

	this._textDamageDir *= -1;

	if (actualDamage > 0){
		BasicGame.emitters.blood.x = this.x + this.width / 2;
		BasicGame.emitters.blood.y = this.y + this.height / 2;

		BasicGame.emitters.blood.start(true, 250, null,
									   ((actualDamage / stat.getMax()) * 20)
									   .toFixed(0));
	}

	return actualDamage;
}

Mob.prototype.heal = function(brutHeal, healRange, criticalChance, stat, stroke){
	this.suffer(-brutHeal, healRange, criticalChance, Elements.ALMIGHTY, stat, stroke);
}

// You can't stun what's already stunned !
Mob.prototype.stun = function(duration, chanceToStun){
	if (!this.alive ||
		this._dying){
		return;
	}

	if (this.allTimers.stun != null){
		return;
	}

	if (Math.random() < chanceToStun - this.allResistances[Disabilities.STUN]){
		if (this.current.action instanceof Skill){
			this.current.action.breakSkill();
		}

		var canMove = this.can.move;
		var canAction = this.can.action;

		this.allTimers.stun = this.game.time.create(true);
		
		this.allTimers.stun.add(duration, function(){
			this.can.move = canMove;
			this.can.action = canAction;
		}, this);

		this.allTimers.stun.onComplete.add(function(){
			this.allTimers.stun.destroy();
			this.allTimers.stun = null;
		}, this);

		this.can.move = false;
		this.can.action = false;

		this.allTimers.stun.start();
	}
}

// You can't slow what's already slowed !
Mob.prototype.slow = function(duration, slowFactor, chanceToSlow){
	if (!this.alive ||
		this._dying){
		return;
	}

	if (this.allTimers.slow != null){
		return;
	}

	if (Math.random() < chanceToSlow - this.allResistances[Disabilities.SLOW]){
		this.allTimers.slow = this.game.time.create(true);
		
		this.allTimers.slow.add(duration, function(){
			this.allStats.attackSpeed.factor /= slowFactor;
			this.SPEED /= slowFactor;

			this.body.maxVelocity.x = this.SPEED;
		}, this);

		this.allTimers.slow.onComplete.add(function(){
			this.allTimers.slow.destroy();
			this.allTimers.slow = undefined;
		}, this);

		this.allStats.attackSpeed.factor *= slowFactor;
		this.SPEED *= slowFactor;

		this.body.maxVelocity.x = this.SPEED;

		this.allTimers.slow.start();
	}
}

// You can't dot what's already dotted !
Mob.prototype.dot = function(duration, tick, chanceToDot, brutDot, dotRange,
							 criticalChance, element, stat, stroke){
	if (!this.alive ||
		this._dying){
		return;
	}

	if (this.allTimers.dot != null){
		return;
	}

	if (Math.random() < chanceToDot){
		this.allTimers.dot = this.game.time.create(true);

		this.allTimers.dot.repeat(tick, duration / tick, function(){
			this.suffer(brutDot, dotRange, criticalChance, element, stat, stroke);
		}, this);

		this.allTimers.dot.onComplete.add(function(){
			this.allTimers.dot.destroy();
			this.allTimers.dot = null;
		}, this);

		this.allTimers.dot.start();
	}
}

// You can't regen what's already regened !
Mob.prototype.regen = function(duration, tick, chanceToRegen, brutRegen, regenRange,
							   criticalChance, stat, stroke){
	if (!this.alive ||
		this._dying){
		return;
	}

	if (this.allTimers.regen != null){
		return;
	}

	if (Math.random() < chanceToRegen){
		this.allTimers.regen = this.game.time.create(true);

		this.allTimers.regen.repeat(tick, duration / tick, function(){
			this.heal(brutRegen, regenRange, criticalChance, stat, stroke);
		}, this);

		this.allTimers.regen.onComplete.add(function(){
			this.allTimers.regen.destroy();
			this.allTimers.regen = null;
		}, this);

		this.allTimers.regen.start();
	}
}


Mob.prototype.cast = function(skill, control, factor){
	if (typeof(skill) != "string"){
		return;
	}

	if (!this.alive ||
		this._dying){
		return;
	}

	var skill = this.allSkills[this.currentMode][skill + "Skill"];

	
	if (skill instanceof Skill){
		if (skill.chargeTime.getMax() > 0){
			if (typeof(factor) != "undefined"){
				if (skill.chargeTime.get(1) >= factor){
					skill.release();

					return;
				}
				
			}
		}
		
		skill.charge();
	}
}

Mob.prototype.castFirst = function(control, factor){
	this.cast("first", control, factor);
}

Mob.prototype.castSecond = function(control, factor){
	this.cast("second", control, factor);
}

Mob.prototype.castThird = function(control, factor){
	this.cast("third", control, factor);
}

Mob.prototype.castFourth = function(control, factor){
	this.cast("fourth", control, factor);
}

Mob.prototype.castFifth = function(control, factor){
	this.cast("fifth", control, factor);
}

Mob.prototype.release = function(skill){
	if (typeof(skill) != "string"){
		return;
	}

	if (this.allSkills[this.currentMode][skill + "Skill"] instanceof Skill){
		this.allSkills[this.currentMode][skill + "Skill"].release();
	}
}

Mob.prototype.releaseFirst = function(){
	this.release("first");
}

Mob.prototype.releaseSecond = function(){
	this.release("second");
}

Mob.prototype.releaseThird = function(){
	this.release("third");
}

Mob.prototype.releaseFourth = function(){
	this.release("fourth");
}

Mob.prototype.releaseFifth = function(){
	this.release("fifth");
}

Mob.prototype._deleteTimers = function(){
	for(var i in this.allTimers){
		if (this.allTimers[i] != null){
			this.allTimers[i].stop();
			this.allTimers[i].destroy();
			this.allTimers[i] = null;
		}
	}
}

Mob.prototype.die = function(){
	this._deleteTimers();

	Npc.prototype.die.call(this);
}

Mob.prototype.kill = function(){
	this._deleteTimers();
	
	Npc.prototype.kill.call(this);
}

Mob.prototype.destroy = function(){
	this._deleteTimers();
	
	for(var i in this.allStats){
		this.allStats[i].destroy();
	}
	
	for(var j in this.allSkills){
		for(var i in this.allSkills[j]){
			this.allSkills[j][i].destroy();
		}
	}

	this.pathFinder = null;

	Npc.prototype.destroy.call(this);
}
/******************************************************************************/
/* Mob */
/*******/

/***************/
/* Common Mobs */
/******************************************************************************/
var createMob = function(game, x, y, spriteSheet, name, level, tag, initFunction,
						 updateFunction, killFunction){
	var newMob;
	var mobPool = (tag == "hero" ) ? BasicGame.level.allHeroes :
		BasicGame.level.allEnemies;


	if (mobPool != null){
		var reusableMob = mobPool.getFirstDead();

		if (reusableMob == null){
			newMob = new Mob(game, x, y, spriteSheet, name, level, tag, initFunction,
							 updateFunction, killFunction);

			mobPool.add(newMob);
		}
		else{
			newMob = reusableMob;
			newMob.reset(0, 0, 1);
			newMob.scale.x = 1;
			newMob.scale.y = 1;

			newMob.setInitFunction(initFunction);
			newMob.setUpdateFunction(updateFunction);
			newMob.setKillFunction(killFunction);
		}
	}
	else{
		Error("Can' t create a Mob without a pool !");
		
		return null;
	}

	newMob.init();
	newMob.allStats.health.set(1, 1);
		
	newMob.pathFinder = BasicGame.level.createPathFinder(newMob.MAXJUMP);

	return newMob;
}

var createArcher = function(game, x, y, spriteSheet, level){
	var newArcher;

	function initArcher(){
		this.allStats.health.setMax(40);
		this.allStats.health.setBasic(40);
		this.allStats.health.set(1, 1);
		this.allStats.health.setGrowth(function(){
			return 0.5 * (this._basicValue + 10 * this.entity.allStats.level.get() +
						  3 * this.entity.allStats.endurance.get());
		}, -1, [], true);

		this.allStats.attack.setBasic(5);
		this.allStats.attack.set(1, 1);
		this.allStats.attack.setGrowth(function(){
			return 0.5 * (this._basicValue + this.entity.allStats.level.get() +
						  0.5 * this.entity.allStats.mainStat.get());
		}, -1, [], true);

		this.allStats.defense.setGrowth(function(){
		return 0.2 * (this._basicValue + 0.5 * this.entity.allStats.level.get() +
					  0.1 * this.entity.allStats.endurance.get());
		}, -1, [], true);

		this.allStats.dodge.setBasic(2);
		this.allStats.dodge.set(1, 1);
		this.allStats.dodge.setGrowth(function(){
			return 0.1 * (this._basicValue + 0.1 * this.entity.allStats.level.get() +
						  0.2 * this.entity.allStats.agility.get());
		}, -1, [], true);

		this.allStats.criticalRate.setBasic(5);
		this.allStats.criticalRate.set(1, 1);
		this.allStats.criticalRate.setGrowth(function(){
			return 0.5 * (this._basicValue + 0.125 * this.entity.allStats.level.get() +
						  0.3 * this.entity.allStats.agility.get());
		}, -1, [], true);

		this.allStats.attackSpeed.setGrowth(function(){
			return this._basicValue - 4 * this.entity.allStats.level.get() -
				2 * this.entity.allStats.agility.get();
		}, -1, [], true);

		this.allSkills[0] = {
			firstSkill: new ArrowSkill(this, 1,
									   ["platform", "hero"])
		}
	}

	return createMob(game, x, y, spriteSheet, "Archer", level, "enemy",
					 initArcher, null, null);
}

/******************************************************************************/
/* Common Mobs */
/***************/
