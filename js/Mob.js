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

	for(var i = 0; i <= Elements.PHYSIC; i++) {
		this.allResistances[i] = 0;
	}

	this.allStats.level = new Stat(this, "Level", STAT_NO_MAXSTAT, level, level,
								   0, 99);
	this.allStats.health = new Stat(this, "Health", STAT_NO_LINK, 1);
	this.allStats.special = new Stat(this, "Special", STAT_NO_LINK, 0);

	this.allStats.attack = new Stat(this, "Attack", STAT_NO_MAXSTAT, 0);
	this.allStats.defense = new Stat(this, "Defense", STAT_NO_MAXSTAT, 0, 0, 0, 100);

	this.allStats.mainStat = new Stat(this, "Main Stat", STAT_NO_MAXSTAT, 0);
	this.allStats.endurance = new Stat(this, "Endurance", STAT_NO_MAXSTAT, 0);
	this.allStats.agility = new Stat(this, "Agility", STAT_NO_MAXSTAT, 0);

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
	this.allStats.level.onUpdate.add(this.allStats.mainStat.grow,
									 this.allStats.mainStat);
	this.allStats.level.onUpdate.add(this.allStats.endurance.grow,
									 this.allStats.endurance);
	this.allStats.level.onUpdate.add(this.allStats.defense.grow,
									 this.allStats.defense);
	this.allStats.level.onUpdate.add(this.allStats.agility.grow,
									 this.allStats.agility);
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

	this.SPEED = 250;
	this.ACCELERATION = 200;
	this.JUMP_POWER = 200;
	this.DRAG = 1000;
	this.MAXJUMP = 1;
	this.jumpCount = this.MAXJUMP;

	this.body.maxVelocity.setTo(this.SPEED, this.SPEED * 1.5);
	this.body.drag.setTo(this.DRAG, 0);

	this._textDamageDir = 1;
}

Mob.prototype = Object.create(Npc.prototype);
Mob.prototype.constructor = Mob;

Mob.prototype.update = function(){
	if (this.body.onFloor()){
		this.jumpCount = this.MAXJUMP;
		this.body.drag.setTo(this.DRAG, 0);
	}

	Npc.prototype.update.call(this);
}

Mob.prototype.suffer = function(brutDamages, damageRange, criticalChance, element){
	var actualDamage = (Math.random() * (damageRange[1] - damageRange[0]) +
						damageRange[0]) * brutDamages;
	var color = (this.tag == "hero") ? RED : WHITE;
	var stroke = BLACK;

	if (Math.random() * 100 < criticalChance){
		actualDamage *= 1.5;
		
		color = YELLOW;
	}

	actualDamage *= (1 - this.allResistances[element]);

	if (actualDamage < 0){
		color = GREEN;
	}
	else{
		actualDamage *= (1 - this.allStats.defense.get() / 100);
	}

	if (actualDamage == 0){
		color = GREY;
	}

	switch(element){
	case Elements.ALMIGHTY:
		stroke = GREY;
		break;
	case Elements.FIRE:
		stroke = RED;
		break;
	case Elements.ICE:
		stroke = BLUE;
		break;
	case Elements.WIND:
		stroke = GREEN;
		break;
	case Elements.ROCK:
		stroke = ORANGE;
		break;
	case Elements.THUNDER:
		stroke = YELLOW;
		break;
	default:
		break;
	}

	actualDamage = actualDamage.toFixed(0);
	
	createTextDamage(this.game, this.x + this.width / 2, this.y + this.height / 2,
					 actualDamage, color).text.stroke = stroke;

	this.allStats.health.subtract(actualDamage);
	this._textDamageDir *= -1;
}

Mob.prototype.castFirst = function(){
	try{
		this.allSkills[this.currentMode].firstSkill.charge();
	}
	catch(err){}
}

Mob.prototype.castSecond = function(){
	try{
		this.allSkills[this.currentMode].secondSkill.charge();
	}
	catch(err){}
}

Mob.prototype.castThird = function(){
	try{
		this.allSkills[this.currentMode].thirdSkill.charge();
	}
	catch(err){}
}

Mob.prototype.castFourth = function(){
	try{
		this.allSkills[this.currentMode].fourthSkill.charge();
	}
	catch(err){}
}

Mob.prototype.castFifth = function(){
	try{
		this.allSkills[this.currentMode].fifthSkill.charge();
	}
	catch(err){}
}

Mob.prototype.releaseFirst = function(){
	try{
		this.allSkills[this.currentMode].firstSkill.release();
	}
	catch(err){}
}

Mob.prototype.releaseSecond = function(){
	try{
		this.allSkills[this.currentMode].secondSkill.release();
	}
	catch(err){}
}

Mob.prototype.releaseThird = function(){
	try{
		this.allSkills[this.currentMode].thirdSkill.release();
	}
	catch(err){}
}

Mob.prototype.releaseFourth = function(){
	try{
		this.allSkills[this.currentMode].fourthSkill.release();
	}
	catch(err){}
}

Mob.prototype.releaseFifth = function(){
	try{
		this.allSkills[this.currentMode].fifthSkill.release();
	}
	catch(err){}
}
/******************************************************************************/
/* Mob */
/*******/
