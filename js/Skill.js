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

	this.cooldownTimer = null;
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

	this.onUse = new Phaser.Signal();
	this.onFailedUse = new Phaser.Signal();
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

		this.canBeUsed = false;
		resumeLoopedTimer(this.cooldownTimer);

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

	if (this.cooldownTimer != null){
		this.cooldownTimer.destroy();
		this.cooldownTimer = null;
	}

	this.cooldown = cooldown;

	this.cooldownTimer = this.game.time.create(false);
	this.cooldownTimer.loop(cooldown, this.refreshSkill, this);
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
	this.cooldownTimer.pause();

	this.canBeUsed = true;
	this.breakArmor.set(1, 1);
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

	this.trajectory = [function(){return 0}, []]; // [function, arguments].
	// Called for each created projectile.
	// Defined init position, end position, and maybe some tweens...
}

ProjectileSkill.prototype = Object.create(Skill.prototype);
ProjectileSkill.prototype.constructor = ProjectileSkill;

ProjectileSkill.prototype.useSkill = function(){
	if (Skill.prototype.useSkill.call(this)){
		var newProjectile;

		if (this.spritePool != null){
			var reusableSprite = this.spritePool.getFirstDead();

			if (reusableSprite == null){
				newProjectile = this.spritePool.create(0, 0, this.spriteName);
			}
			else{
				newProjectile = reusableSprite;
				newProjectile.reset();
			}
		}
		else{
			newProjectile = this.spritePool.create(0, 0, this.spriteName);
		}

		var trajectoryFunction = this.trajectory[0];
		var trajectoryArguments = this.trajectory[1];

		var damageFunction = this.damageStructure[0];
		var damageContext = this.damageStructure[1];
		var damageArguments = this.damageStructure[2];

		trajectoryFunction.apply(newProjectile, trajectoryArguments);
		
		newProjectile.damages = damageFunction.apply(damageContext, damageArguments);
	}
}
/******************************************************************************/
/* ProjectileSkill */
/*******************/
