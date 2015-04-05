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
	
	this.allStats.level = new Stat(this, "Level", STAT_NO_MAXSTAT, level, level,
								   0, 99);

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
/******************************************************************************/
/* Mob */
/*******/
