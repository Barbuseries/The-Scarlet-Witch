/*******/
/* Npc */
/******************************************************************************/
var Npc = function(game, x, y, spritesheet, name, initFunction, updateFunction,
				   killFunction){
	if (typeof(name) != "string") name = "";

	Entity.call(this, game, x, y, spritesheet, initFunction, updateFunction,
				killFunction, "npc");
	
	this.name = name;

	this.orientationH = 0;
	this.orientationV = 0;

	this.game.physics.enable(this, Phaser.Physics.ARCADE);
}

Npc.prototype = Object.create(Entity.prototype);
Npc.prototype.constructor = Entity;
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
