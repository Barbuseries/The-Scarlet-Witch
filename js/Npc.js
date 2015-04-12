/*******/
/* Npc */
/******************************************************************************/
var Npc = function(game, x, y, spritesheet, name, initFunction, updateFunction,
				   killFunction){
	if (typeof(name) != "string") name = "";

	Entity.call(this, game, x, y, spritesheet, initFunction, updateFunction,
				killFunction, "npc");

	this.animations.add("walkRight", [144, 145, 146, 147, 148, 149, 150, 151], 15)
		.allowBreak = true;
	this.animations.add("walkLeft", [118, 119, 120, 121, 122, 123, 124, 125], 15)
		.allowBreak = true;

	this.animations.add("spellCastLeft", [14, 15, 16, 17, 18, 19, 13], 15)
		.allowBreak = false;
	this.animations.add("spellCastRight", [40, 41, 42, 43, 44, 45, 39], 15)
		.allowBreak = false;
	this.animations.add("spellCastBoth", [27, 28, 29, 30, 31, 32, 26], 15)
		.allowBreak = false;

	/**************/
	/* A tester ! */
	/******************************************************************************/
	this.animations.add("swordRight", [195, 196, 197, 198, 199, 200, 200, 195], 15)
		.allowBreak = false;
	this.animations.add("swordLeft", [169, 170, 171, 172, 173, 174, 174, 169], 15)
		.allowBreak = false;

	this.animations.add("bowLeft", [221, 222, 223, 224, 225, 226, 227, 228, 229, 230,
									 231, 232, 233, 221], 15)
		.allowBreak = false;
	this.animations.add("bowRight", [247, 248, 249, 250, 251, 252, 253, 254, 255, 256,
									257, 258, 259, 247], 15)
		.allowBreak = false;
	/******************************************************************************/

	this.animations.add("death", [260, 261, 262, 264], 5)
		.allowBreak = false;

	this.animations.add("idle", [26])
		.allowBreak = true;
	
	this.name = name;

	this.orientationH = 0;
	this.orientationV = 0;

	this.game.physics.enable(this, Phaser.Physics.ARCADE);

	this._cached = {};
	this._cached.velocity = {};
	this._cached.acceleration = {};
	this._cached.velocity.x = 0;
	this._cached.velocity.y = 0;
	this._cached.acceleration.x = 0;
	this._cached.acceleration.y = 0;

	this._dying = false;

	this.animations.play("idle");
}

Npc.prototype = Object.create(Entity.prototype);
Npc.prototype.constructor = Entity;

Npc.prototype.kill = function(){
	this._dying = false;

	Entity.prototype.kill.call(this);
}

Npc.prototype.die = function(){
	this.animations.play("death", null, false, true);
	this._dying = true;
}
/******************************************************************************/
/* Npc */
/*******/

function createNpc(game, x, y, spritesheet, spritePool, name, initFunction,
				   updateFunction, killFunction){
	var newNpc;
	
	if (spritePool != null){
		var reusableSprite = spritePool.getFirstDead();
		
		if (reusableSprite == null){
			newNpc = new Npc(game, x, y, spritesheet, name,
							 initFunction, updateFunction,
							 killFunction);
										 
			spritePool.add(newNpc);
		}
		else{
			newNpc = reusableSprite;
			newNpc.reset(0, 0, 1);
			newNpc.scale.x = 1;
			newNpc.scale.y = 1;
				
			newNpc.setInitFunction(initFunction);
			newNpc.setUpdateFunction(updateFunction);
			newNpc.setKillFunction(killFunction);
			newNpc.setCollideFunction(collideFunction);
			newNpc.setCollideProcess(collideProcess);
			newNpc.setDamageFunction(damageFunction);
		}
	}
	else{
		newNpc = new Npc(game, 0, 0, spritesheet, name,
						 initFunction, updateFunction,
						 killFunction);
	}

	newNpc.init();

	return newNpc;
}
