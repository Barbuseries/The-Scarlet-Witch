/*********/
/* Skill */
/******************************************************************************/
var Elements = {};

Elements.FIRE = 1;
Elements.WATER = 2;
Elements.WIND = 3;
Elements.ROCK = 4;
Elements.THUNDER = 5;
Elements.PHYSIC = 6;

var Skill = function(user, level, costFunction, cooldown){
	if (typeof(user) != "object") user = null;

	if (typeof(level) != "number") level = 0;

	if (typeof(costFunction) != "function") costFunction = function(){return true};
	
	if (typeof(cooldown) != "number") cooldown = 0;

	this.game = (user != null) ? user.game : null;
	
	this.user = user;
	this.level = level;
	this.costFunction = costFunction;

	this.canBeUsed = true;

	this.cooldownTween = null;
	this.cooldown = new Stat(this, "Cooldown", STAT_PERCENT_LINK, 0, cooldown);
	this.setCooldown(cooldown);

	this.breakable = false; // Can it be stopped by the USER while it's
	                        // still being used.
	
	this.breakArmor = new Stat(this, "breakArmor", STAT_BRUT_LINK, Infinity);
	// How much it takes for an ENEMY to
	// stop the skill while it's still being used.

	this.breakArmor.onUpdate.add(this._checkBreak, this);

	this.launchFunction = null;

	this.onUse = new Phaser.Signal();
	this.onFailedUse = new Phaser.Signal();

	this.cooldownBar = null;
}

Skill.Fail = {};

Skill.Fail.NO_USER = 0;
Skill.Fail.COOLDOWN = 1;
Skill.Fail.COST = 2;

Skill.prototype.useSkill = function(){
	if (this.user == null){
		this.onFailedUse.dispatch(this, Skill.Fail.NO_USER);
		
		return false;
	}
	
	if (!this.canBeUsed){
		this.onFailedUse.dispatch(this, Skill.Fail.COOLDOWN);
		
		return false;
	}
	
	if (this.costFunction.call(this)){

		if (typeof(this.launchFunction) === "function"){
			this.launchFunction.apply(this);
		}
		
		if (this.cooldown.getMax() > 0){
			this.canBeUsed = false;
			this.cooldown.set(1, 1);
			
			resumeLoopedTween(this.cooldownTween);
		}

		this.onUse.dispatch(this);
		
		return true;
	}
	else{
		this.onFailedUse.dispatch(this, Skill.Fail.COST);
		
		return false;
	}
}

Skill.prototype.setCooldown = function(cooldown){
	if (typeof(cooldown) != "number") return;

	if (this.cooldownTween != null){
		this.cooldownTween.stop();
		this.cooldownTween = null;
	}

	this.cooldown.setMax(cooldown);
	this._cooldown = cooldown;

	this.cooldownTween = this.game.add.tween(this)
		.to({_cooldown: 0}, cooldown);

	function updateCooldown(){
		this.cooldown.set(this._cooldown);
	}

	this.cooldownTween.onUpdateCallback(updateCooldown, this);
	this.cooldownTween.onRepeat.add(this.refreshSkill, this);
	this.cooldownTween.loop();
}

Skill.prototype.breakSkill = function(){
	//this.breakArmor.set(1, 1);
}

Skill.prototype._checkBreak = function(oldBreakArmor, newBreakArmor){
	if (newBreakArmor == 0){
		this.breakSkill();
	}
}

Skill.prototype.refreshSkill = function(){
	this.cooldownTween.pause();

	this.cooldown.set(0);
	this.canBeUsed = true;
	this.breakArmor.set(1, 1);
}

Skill.prototype.createCooldownBar = function(x, y, width, height, fillColor,
											 backgroundColor, belowSprite, upperSprite,
											 orientation){
	this.cooldownBar = new MonoGauge(this.game, x, y, width, height, this.cooldown,
									 fillColor, backgroundColor, belowSprite,
									 upperSprite, orientation);

	this.cooldownBar.allowIncreaseAnimation = false;
	this.cooldownBar.allowDecreaseAnimation = false;
	this.cooldownBar.valueDisplayType = GAUGE_NONE;
	this.cooldownBar.updateValueText();
	this.cooldownBar.backgroundFill.alpha = 0;

	this.cooldownBar.onUpdate.add(function(){
		this.visible = (this.stat.get() > 0);
	}, this.cooldownBar);
}

/******************************************************************************/
/* Skill */
/*********/

/**************/
/* Projectile */
/******************************************************************************/

var Projectile = function(game, x, y, spriteName, initFunction, updateFunction,
						  killFunction, collideFunction, collideProcess,
						  damageFunction){
	if (typeof(game) === "undefined"){
		return;
	}

	if (typeof(x) != "number"){
		x = 0;
	}

	if (typeof(y) != "number"){
		y = 0;
	}

	if (typeof(spriteName) != "string"){
		spriteName = "";
	}
	
	Phaser.Sprite.apply(this, [game, x, y, spriteName]);

	this.setInitFunction(initFunction);
	this.setUpdateFunction(updateFunction);
	this.setKillFunction(killFunction);
	this.setCollideFunction(collideFunction);
	this.setCollideProcess(collideProcess);
	this.setDamageFunction(damageFunction);

	this.damageRange = [1, 1];

	this.criticalChance = 0;
	
	this.element = Elements.NONE;

	this.targetTags = [];
}

Projectile.prototype = Object.create(Phaser.Sprite.prototype);
Projectile.prototype.constructor = Projectile;


Projectile.prototype.init = function(){
	if (this.initFunction != null){
		this.initFunction.apply(this);
	}
}

Projectile.prototype.update = function(){
	if (this.updateFunction != null){
		this.updateFunction.apply(this);
	}

	Phaser.Sprite.prototype.update.apply(this);
}

// The Projectile is NOT killed in this function.
// Only in YOUR kill function.
Projectile.prototype.kill = function(code){
	if (this.killFunction != null){
		this.killFunction.apply(this);
	}
}

Projectile.prototype.setInitFunction = function(initFunction){
	if (typeof(initFunction) != "function"){
		initFunction = null;
	}

	this.initFunction = initFunction;
}

Projectile.prototype.setUpdateFunction = function(updateFunction){
	if (typeof(updateFunction) != "function"){
		updateFunction = null;
	}

	this.updateFunction = updateFunction;
}

Projectile.prototype.setKillFunction = function(killFunction){
	if (typeof(killFunction) != "function"){
		killFunction = function(){
			Phaser.Sprite.prototype.kill.apply(this);
		};
	}

	this.killFunction = killFunction;
}

Projectile.prototype.setDamageFunction = function(damageFunction){
	if (typeof(damageFunction) != "function"){
		damageFunction = null;
	}

	this.damageFunction = damageFunction;
}

Projectile.prototype.setCollideFunction = function(collideFunction){
	if (typeof(collideFunction) != "function"){
		collideFunction = function(obstacle){
			if (this.damageFunction != null){
				this.damageFunction.call(this, obstacle);
			}

			this.kill();
		};
	}

	this.collideFunction = collideFunction;
}

Projectile.prototype.setCollideProcess = function(collideProcess){
	if (typeof(collideProcess) != "function"){
		collideProcess = function(obstacle){
			return (this.targetTags.indexOf(obstacle.tag) != -1);
		};
	}

	this.collideProcess = collideProcess;
}
/******************************************************************************/
/* Projectile */
/**************/


function createProjectile(game, x, y, spriteName, spritePool, initFunction,
						  updateFunction, killFunction, collideFunction,
						  collideProcess, damageFunction){
	var newProjectile;

	if (spritePool != null){
		var reusableSprite = spritePool.getFirstDead();
		
		if (reusableSprite == null){
			newProjectile = new Projectile(game, x, y, spriteName,
										   initFunction, updateFunction,
										   killFunction, collideFunction,
										   collideProcess, damageFunction);
			spritePool.add(newProjectile);
		}
		else{
			newProjectile = reusableSprite;
			newProjectile.reset(0, 0, 1);
			newProjectile.scale.x = 1;
			newProjectile.scale.y = 1;
				
			newProjectile.setInitFunction(initFunction);
			newProjectile.setUpdateFunction(updateFunction);
			newProjectile.setKillFunction(killFunction);
			newProjectile.setCollideFunction(collideFunction);
			newProjectile.setCollideProcess(collideProcess);
			newProjectile.setDamageFunction(damageFunction);
		}
	}
	else{
		newProjectile = new Projectile(game, 0, 0, spriteName,
									   initFunction, updateFunction,
									   killFunction, collideFunction,
									   collideProcess, damageFunction);
	}

	newProjectile.init();

	return newProjectile;
}
