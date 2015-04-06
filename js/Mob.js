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
	this.allSkills = {};
	this.allResistances = [];

	for(var i = 0; i <= Elements.PHYSIC; i++) {
		this.allResistances[i] = 0;
	}

	this.allStats.level = new Stat(this, "Level", STAT_NO_MAXSTAT, level, level,
								   0, 99);
	this.allStats.health = new Stat(this, "Health", STAT_NO_LINK, 1);

	this.allStats.health.onUpdate.add(function(stat, oldValue, newValue){
		if (newValue == 0){
			this.die();
		}
	}, this);

	this.SPEED = 250;
	this.ACCELERATION = 250;
	this.JUMP_POWER = 200;
	this.DRAG = 500;
	this.MAXJUMP = 1;
	this.jumpCount = this.MAXJUMP;

	this.body.maxVelocity.setTo(this.SPEED, this.SPEED * 3);
	this.body.drag.setTo(this.DRAG, 0);
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
	var color = WHITE;

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
	
	createTextDamage(this.game, this.x + this.width / 2, this.y + this.height / 2,
					 actualDamage, color);

	this.allStats.health.subtract(actualDamage);
}
/******************************************************************************/
/* Mob */
/*******/
