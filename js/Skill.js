/*********/
/* Skill */
/******************************************************************************/
var Elements = {};

Elements.ALMIGHTY = 0;
Elements.FIRE = 1;
Elements.ICE = 2;
Elements.WIND = 3;
Elements.ROCK = 4;
Elements.THUNDER = 5;
Elements.PHYSIC = 6;

var Skill = function(user, level, costFunction, cooldown, element, targetTags){
	if (typeof(user) != "object") user = null;

	if (typeof(level) != "number") level = 0;

	if (typeof(costFunction) != "function") costFunction = function(){return true};
	
	if (typeof(cooldown) == "number") cooldown = [cooldown];
	
	if (typeof(cooldown) != "object") cooldown = [0];
	
	if (typeof(element) === "undefined"){
		element = Elements.ALMIGHTY;
	}

	
	if (typeof(targetTags) === "undefined"){
		targetTags = [];
	}

	this.game = (user != null) ? user.game : null;
	
	this.user = user;
	this.level = level;
	this.costFunction = costFunction;
	
	this.element = element;
	this.targetTags = targetTags;

	this.canBeUsed = true;

	this.allCooldowns = cooldown;
	this.cooldownTween = null;
	this.cooldown = new Stat(this, "Cooldown", STAT_PERCENT_LINK, 0,
							 this.getCooldown());

	this.setCooldown(this.getCooldown());

	/*this.breakable = false; // Can it be stopped by the USER while it's
	                        // still being used.
	
	this.breakArmor = new Stat(this, "breakArmor", STAT_BRUT_LINK, Infinity);
	// How much it takes for an ENEMY to
	// stop the skill while it's still being used.

	this.breakArmor.onUpdate.add(this._checkBreak, this);*/

	this.launchFunction = null;

	this.onUse = new Phaser.Signal();
	this.onFailedUse = new Phaser.Signal();

	this.cooldownBar = null;

	this.icon = null;
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

Skill.prototype.getCooldown = function(){
	if (validIndex(this.level, this.allCooldowns)){
		return this.allCooldowns[this.level - 1];
	}
	else{
		return this.allCooldowns[this.allCooldowns.length - 1];
	}
}

Skill.prototype.setCooldown = function(cooldown){
	if (typeof(cooldown) != "number") return;

	if (this.cooldownTween != null){
		this.cooldownTween.stop();
		this.refreshSkill();
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
	//this.breakArmor.set(1, 1);
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
	Entity.call(this, game, x, y, spriteName, initFunction, updateFunction,
				killFunction, "projectile");

	this.setCollideFunction(collideFunction);
	this.setCollideProcess(collideProcess);
	this.setDamageFunction(damageFunction);

	this.damageRange = [1, 1];

	this.criticalChance = 0;
	
	this.element = Elements.ALMIGHTY;

	this.targetTags = [];
}

Projectile.prototype = Object.create(Entity.prototype);
Projectile.prototype.constructor = Projectile;

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
				this.damageFunction(this, obstacle);
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

/*****************/
/* Common Skills */
/******************************************************************************/
var FireBallSkill = function(user, level, targetTags){
	var cooldown = user.allStats.attackSpeed.get();

	function costFunction(){
		if (this.user.allStats.special.canSubtract(5)){
			this.user.allStats.special.subtract(5);

			return true;
		}
		else{
			return false;
		}
	}

	Skill.call(this, user, level, costFunction, cooldown, Elements.FIRE,
			   targetTags);

	this.launchFunction = function(){
		var user = this.user;
		var self = this;

		function initProjectile(){
			this.x = user.x;

			this.y = user.y + user.height * 0.65;

			this.anchor.setTo(0.5);

			this.frame = 0;
			
			this.lifespan = 1000 * Math.sqrt(self.level);
			
			if (user.orientationH >= 0){
				this.animations.add("animation", [0, 1, 2, 3, 4, 5, 6, 7]);
			}
			else{
				this.animations.add("animation", [8, 9, 10, 11, 12, 13, 14, 15]);
			}
			
			this.animations.play("animation", null, true);

			this.game.physics.enable([this], Phaser.Physics.ARCADE);
			this.body.velocity.x = 500;

			if (user.orientationH < 0){
				this.x += user.width * 1 / 4;
				this.body.velocity.x *= -1;
			}
			else{
				this.x += user.width * 3 / 4;
			}

			this.body.velocity.y = -100;
			this.body.allowGravity = false;

			this.targetTags = self.targetTags;
			this.element = self.element;

			this.tween = this.game.add.tween(this.body.velocity)
				.to({y : 100}, this.lifespan / 2)
				.to({y : -100}, this.lifespan / 2);

			this.tween.loop();

			this.tween.start();
		}

		function updateProjectile(){
			this.scale.x = this.lifespan / 1000;
			this.scale.y = this.scale.x;
		}

		function killProjectile(){
			if (this.tween != null){
				this.tween.stop();
				this.tween = null;
			}

			this.timer = undefined;
			
			var x = this.x;
			var y = this.y;

			createProjectile(this.game, x, y, "explosion_0", BasicGame.explosionPool,
							 function(){initExplosion.call(this, x, y)});

			return true;
		}

		function collideFunction(obstacle){
			if (obstacle.tag != "platform"){
				this.damageFunction(obstacle);
			}
			else{
				this.kill();
			}
		}

		function collideProcess(obstacle){
			return ((this.targetTags.indexOf(obstacle.tag) != -1) ||
					(obstacle.tag == "platform"));
		}

		function damageFunction(obstacle){
			var damage = this.user.attack.get();
			
			obstacle.allStats.health.subtract(damage);
		}

		function initExplosion(x, y){
			this.x = x;
			this.y = y;
			this.anchor.setTo(0.5);
			this.tint = H_WHITE;
			this.frame = 0;
			this.animations.add("explosionAnimation", [0, 1, 2, 3, 4, 5, 6, 7, 8]);
			this.animations.play("explosionAnimation", null, false, true);

			BasicGame.sfx.EXPLOSION_0.play();
		}

		user.animations.stop("spellCastRight");
		user.animations.stop("spellCastLeft");
		
		createProjectile(this.game, 0, 0, "fireball_0", BasicGame.firePool,
						 initProjectile, updateProjectile, killProjectile,
						 collideFunction, collideProcess, damageFunction);

		if (user.orientationH >= 0){
			user.animations.play("spellCastRight");	
		}
		else{
			user.animations.play("spellCastLeft");
		}
	};

	this.icon = "fireball_icon";
}

FireBallSkill.prototype = Object.create(Skill.prototype);
FireBallSkill.prototype.constructor = FireBallSkill;


var IceBallSkill = function(user, level, targetTags){
	var cooldown = [15000 / 3, 14000 / 3, 13000 / 3,
					12000/3, 11000 / 3];

	function costFunction(){
		var cost = (20 - this.level) * this.user.allStats.special.getMax(1);

		if (this.user.allStats.special.canSubtract(cost)){
			this.user.allStats.special.subtract(cost);

			return true;
		}
		else{
			return false;
		}
		
	}
	
	Skill.call(this, user, level, costFunction, cooldown, Elements.ICE,
			   targetTags);

	this.launchFunction = function(){
		var user = this.user;
		var self = this;

		function initProjectile(){
			this.x = user.x;
			this.y = user.y + user.height * 0.65;

			this.anchor.setTo(0.5);

			this.frame = 0;
			
			this.lifespan = 1000 * (15000 / 3 / self.getCooldown()) *
				(15000 / 3 / self.getCooldown());
			
			if (user.orientationH >= 0){
				this.animations.add("animation", [32, 33, 34, 35, 36, 37, 38, 39]);
			}
			else{
				this.animations.add("animation", [0, 1, 2, 3, 4, 5, 6, 7]);
			}
			
			this.animations.play("animation", null, true);

			this.game.physics.enable([this], Phaser.Physics.ARCADE);
			this.body.velocity.x = 500 ;
			
			if (user.orientationH < 0){
				this.x += user.width * 1 / 4;
				this.body.velocity.x *= -1;
			}
			else{
				this.x += user.width * 3 / 4;
			}

			this.body.velocity.y = -100;
			this.body.allowGravity = false;

			this.tween = this.game.add.tween(this.body.velocity)
				.to({y : 100}, this.lifespan / 2)
				.to({y : -100}, this.lifespan / 2);

			this.targetTags = self.targetTags;
			this.element = self.element;

			this.tween.loop();

			this.tween.start();
		}

		function updateProjectile(){
			this.scale.x = this.lifespan / 1000;
			this.scale.y = this.scale.x;
		}

		function killProjectile(){
			if (this.tween != null){
				this.tween.stop();
				this.tween = null;
			}

			var x = this.x;
			var y = this.y;
			
			createProjectile(this.game, x, y, "explosion_1",
							 BasicGame.iceExplosionPool,
							 function () { initExplosion.call(this, x, y) });
			
			return true;
		}

		function collideFunction(obstacle){
			try{
				this.damageFunction(obstacle);
			}
			catch(err){}

			this.kill();
		}

		function initExplosion(x, y) {
		    this.x = x;
		    this.y = y;
		    this.tint = H_WHITE;
		    this.tint = 0x99ffff;
		    this.anchor.setTo(0.5);
		    this.frame = 0;
		    this.animations.add("explosionAnimation", [0, 1, 2, 3, 4, 5, 6, 7, 8]);
		    this.animations.play("explosionAnimation", null, false, true);

		    BasicGame.sfx.EXPLOSION_0.play();
		}

		function damageFunction(obstacle){
			var damage = 0;
			var userAttack = this.user.allStats.attack.get();

			switch(this.level){
				case 1:
				damage = 2 * userAttack;
				break;

				case 2:
				damage = 2.5 * userAttack;
				break;

				case 3:
				damage = 3 * userAttack;
				break;

				case 4:
				damage = 3 * userAttack;
				break;

				case 5:
				damage = 4 * userAttack;
				break;

				default:
				damage = 0;
				break;
			}

			console.log(damage);

			obstacle.allStats.health.subtract(damage);
		}

		createProjectile(this.game, 0, 0, "iceball_0", BasicGame.icePool,
						 initProjectile, updateProjectile, killProjectile,
						 collideFunction, undefined, damageFunction);

		user.animations.stop("spellCastRight");
		user.animations.stop("spellCastLeft");

		if (user.orientationH >= 0){
			user.animations.play("spellCastRight");	
		}
		else{
			user.animations.play("spellCastLeft");
		}
	};

	this.icon = "iceball_icon";
};

IceBallSkill.prototype = Object.create(Skill.prototype);
IceBallSkill.prototype.constructor = IceBallSkill;
/******************************************************************************/
/* Common Skills */
/*****************/
