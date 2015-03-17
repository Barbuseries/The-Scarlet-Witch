/*********/
/* Skill */
/******************************************************************************/
var Elements = {};

Elements.None = 0;
Elements.Fire = 1;
Elements.Water = 2;
Elements.Wind = 3;
Elements.Rock = 4;
Elements.Thunder = 5;

var Skill = function(game, user, damageStructure, costStructure, cooldown,
					 targetTags){
	if (typeof(game) === "undefined") return;
	
	if (typeof(user) != "object") user = null;
	
	if (typeof(damageStructure) != "object") damageStructure = [function(){return 0},
																null, []];
	if (typeof(costStructure) != "object") costStructure = [function(){return 0},
															null, []];
	
	if (typeof(cooldown) != "number") cooldown = 0;
	if (typeof(targetTags) === "string") targetTags = [targetTags];
	if (typeof(targetTags) != "object") targetTags = ["ennemy"];

	this.game = game;
	
	this.user = user;
	this.damageStructure = damageStructure;
	this.costStructure = costStructure;
	this.targetTags = targetTags;

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
	
	this.breakStrenght = new Stat(this, "breakStrenght", STAT_BRUT_LINK, 0);
	// How much damages it does to an ENEMY
	// breakArmor.

	this.element = Elements.None;

	this.launchFunction = null;

	this.onUse = new Phaser.Signal();
	this.onFailedUse = new Phaser.Signal();

	this.cooldownBar = null;
}

Skill.prototype.useSkill = function(){
	if (this.user == null){
		this.onFailedUse.dispatch(this);
		
		return false;
	}
	
	if (!this.canBeUsed){
		this.onFailedUse.dispatch(this);
		
		return false;
	}

	var costFunction = this.costStructure[0];
	var costContext = this.costStructure[1];
	var costArguments = this.costStructure[2];
	
	var cost = costFunction.apply(costContext, costArguments);
	
	if (this.user.special.canSubtract(cost)){
		this.user.special.subtract(cost);

		if (typeof(this.launchFunction) === "function"){
			this.launchFunction.apply(this);
		}

		this.canBeUsed = false;
		this.cooldown.set(1, 1);
		resumeLoopedTween(this.cooldownTween);

		this.onUse.dispatch(this);
		
		return true;
	}
	else{
		this.onFailedUse.dispatch(this);
		
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
//	this.cooldownTween.loop(cooldown, this.refreshSkill, this);
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

/*******************/
/* ProjectileSkill */ 
/******************************************************************************/
var ProjectileSkill = function(game, user, damageStructure, costStructure,
							   cooldown, spriteName, spritePool, targetTags){
	Skill.apply(this, [game, user, damageStructure, costStructure, cooldown, targetTags]);

	if (typeof(spriteName) != "string") spriteName = "";
	if (typeof(spritePool) != "object") spritePool = null;
	
	this.spriteName = spriteName;
	this.spritePool = spritePool;

	this.initFunction = null;
	this.updateFunction = null;
	this.killFunction = null;
}

ProjectileSkill.prototype = Object.create(Skill.prototype);
ProjectileSkill.prototype.constructor = ProjectileSkill;

/*ProjectileSkill.prototype.useSkill = function(){
	if (Skill.prototype.useSkill.call(this)){
		var newProjectile;

		if (this.spritePool != null){
			var reusableSprite = this.spritePool.getFirstDead();
			
			if (reusableSprite == null){
				newProjectile = new Projectile(this.game, 0, 0, this.spriteName,
											   this.initFunction, this.updateFunction,
											   this.killFunction);
				this.spritePool.add(newProjectile);
			}
			else{
				newProjectile = reusableSprite;
				newProjectile.reset(0, 0, 1);
				
				newProjectile.setInitFunction(this.initFunction);
				newProjectile.setUpdateFunction(this.updateFunction);
				newProjectile.setKillFunction(this.killFunction);
			}
		}
		else{
			newProjectile = new Projectile(this.game, 0, 0, this.spriteName,
										   initFunction, updateFunction,
										   killFunction);
			this.spritePool.add(newProjectile);
		}

		newProjectile.init();

		var damageFunction = this.damageStructure[0];
		var damageContext = this.damageStructure[1];
		var damageArguments = this.damageStructure[2];
		
		newProjectile.damages = damageFunction.apply(damageContext, damageArguments);
	}
}*/
/******************************************************************************/
/* ProjectileSkill */
/*******************/

/**************/
/* Projectile */
/******************************************************************************/

var Projectile = function(game, x, y, spriteName, initFunction, updateFunction,
						  killFunction){
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
Projectile.prototype.kill = function(){
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
/******************************************************************************/
/* Projectile */
/**************/


function createProjectile(game, x, y, spriteName, spritePool, initFunction,
						  updateFunction, killFunction){
	var newProjectile;

	if (spritePool != null){
		var reusableSprite = spritePool.getFirstDead();
		
		if (reusableSprite == null){
			newProjectile = new Projectile(game, x, y, spriteName,
										   initFunction, updateFunction,
										   killFunction);
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
		}
	}
	else{
		newProjectile = new Projectile(game, 0, 0, spriteName,
									   initFunction, updateFunction,
									   killFunction);
	}

	newProjectile.init();

	return newProjectile;
}
