/*********/
/* Skill */
/******************************************************************************/
var Elements = {
	PHYSIC: 0,
	FIRE: 1,
	ICE: 2,
	WIND: 3,
	EARTH: 4,
	THUNDER: 5,
	POISON: 6,
	ALMIGHTY: 7
};

var Disabilities = {
	STUN: 8,
	SLOW: 9
};

var Skill = function(user, level, costFunction, cooldown, element,
					 targetTags){
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

	this.chargeTime = new Stat(this, "Charge Time", STAT_NO_MAXSTAT, 0);
	this.setCastTime(0);
	
	this.setCooldown(this.getCooldown());

	/*this.breakable = false; // Can it be stopped by the USER while it's
	                        // still being used.
	
	this.breakArmor = new Stat(this, "breakArmor", STAT_BRUT_LINK, Infinity);
	// How much it takes for an ENEMY to
	// stop the skill while it's still being used.

	this.breakArmor.onUpdate.add(this._checkBreak, this);*/

	this.launchFunction = null;

	this.onUncheckedCharge = new Phaser.Signal(); // Dispatched even if this.onCharge
	                                              // can't.
	this.onUncheckedRelease = new Phaser.Signal(); // Dispatched even if
	                                               // this.onRelease can't.

	this.onCharge = new Phaser.Signal();
	this.onChargeComplete = new Phaser.Signal();
	this.onRelease = new Phaser.Signal();

	this.chargeFactor = 1;
	this.chargeCompleted = false;

	this.onUse = new Phaser.Signal();
	this.onFailedUse = new Phaser.Signal();

	this.onBreak = new Phaser.Signal();

	this.cooldownBar = null;
	this.chargeBar = null;

	this.icon = null;

	this.onDestroy = new Phaser.Signal();
	
	user.onDeath.add(this.breakSkill, this);
	user.onDestroy.add(this.destroy, this);
}

Skill.Fail = {};

Skill.Fail.NO_USER = 0;
Skill.Fail.COOLDOWN = 1;
Skill.Fail.COST = 2;
Skill.Fail.NOT_ABLE = 3;

Skill.prototype.useSkill = function(factor){
	if (typeof(factor) === "undefined"){
		factor = 0;
	}

	if (this.user == null){
		this.onFailedUse.dispatch(this, Skill.Fail.NO_USER);
		
		return false;
	}

	if (this.user._dying ||
		!this.user.alive){
		return;
	}
	
	if (!this.canBeUsed){
		this.onFailedUse.dispatch(this, Skill.Fail.COOLDOWN);
		
		return false;
	}

	if (!this.user.can.action && (this.user.current.action != this)){
		this.onFailedUse.dispatch(this, Skill.Fail.NOT_ABLE);
		
		return false;
	}
	
	if (this.costFunction.call(this, 1)){
		if (typeof(this.launchFunction) === "function"){
			this.user.can.action = false;
			this.user.current.action = this;

			this.launchFunction.call(this, factor);
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

Skill.prototype.charge = function(){
	if (this.user._dying ||
		!this.user.alive){
		this.chargeTime.set(0);

		return;
	}

	this.onUncheckedCharge.dispatch(this);

	if (this.canBeUsed &&
		(this.user.can.action || (this.user.current.action == this)) &&
		this.costFunction.call(this, 0)){
		
		if (!this.chargeTime.get()){
			this.onCharge.dispatch(this);

			this.user.can.action = false;
			this.user.current.action = this;
		}

		if ((this.chargeTime._link != STAT_NO_MAXSTAT) &&
			 this.chargeTime.get(1) == 1){

			this.chargeTime.set(0);

			this.chargeCompleted = false;
			
			this.useSkill();
		}
		
		this.chargeTime.add(this.chargeFactor * 1000 / 60);

		if (!this.chargeCompleted &&
			(this.chargeTime.get(1) == 1)){
			this.chargeCompleted = true;

			this.onChargeComplete.dispatch(this);
		}
	}
	else{
		this.chargeTime.set(0);

		
		this.chargeCompleted = false;
	}
}

Skill.prototype.release = function(){
	this.onUncheckedRelease.dispatch(this);
	
	if (this.user._dying ||
		!this.user.alive){
		this.chargeTime.set(0);
		
		return;
	}

	if (this.canBeUsed &&
		(this.user.can.action || (this.user.current.action == this)) &&
		this.costFunction.call(this, 0)){
		var factor = this.chargeTime.get(1, this.chargeTime._max);
		
		this.chargeTime.set(0);

		if (factor){
			this.useSkill(factor);
			this.onRelease.dispatch(this);
		}
	}
	else{
		this.chargeTime.set(0);

		this.chargeCompleted = false;
	}
}

Skill.prototype.setCastTime = function(time){
	this.chargeTime._link = STAT_NO_LINK;
	this.chargeTime._max = time;
	this.chargeTime.setMax(time);
}

Skill.prototype.setChargeTime = function(time){
	this.chargeTime._link = STAT_NO_MAXSTAT;
	this.chargeTime._max = time;
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
		//this.refreshSkill();
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
	
	if (this.cooldown.get() != 0){
		this.cooldownTween.start();
	}
}

Skill.prototype.updateCooldown = function(cooldown){
	this.setCooldown(cooldown);
}

Skill.prototype.updateChargeTime = function(chargeTime){
	this.setChargeTime(chargeTime);
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

	this.cooldown.onUpdate.add(function(stat, oldValue, newValue){
		this.visible = (newValue > 0);
	}, this.cooldownBar);
}

Skill.prototype.createChargeBar = function(x, y, width, height, fillColor,
										   backgroundColor, belowSprite, upperSprite,
										   orientation){
	this.chargeBar = new MonoGauge(this.game, x, y, width, height, this.chargeTime,
								   fillColor, backgroundColor, belowSprite,
								   upperSprite, orientation);

	this.chargeBar.allowIncreaseAnimation = false;
	this.chargeBar.visible = false;

	this.chargeTime.onUpdate.add(function(stat, oldValue, newValue){
		this.visible = (newValue > 0);
	}, this.chargeBar);
}

Skill.prototype.breakSkill = function(){
	if (this.user.current.action == this){
		this.user.can.action = true;
		this.user.current.action = null;
	}

	this.onBreak.dispatch(this);
}

Skill.prototype.destroy = function(){
	if (this.onDestroy == null){
		return;
	}

	this.onDestroy.dispatch();

	this.onDestroy.dispose();
	this.onDestroy = null;
	this.game = null;
	this.user = null;
	this.level = 0;
	this.costFunction = null;
	this.element = 0;
	this.targetTags = [];
	this.canBeUsed = false;
	this.allCooldowns = [];

	if (this.cooldownTween != null){
		this.cooldownTween.stop();
		this.cooldownTween = null;
	}
	
	this.cooldown.destroy();
	this.chargeTime.destroy();
	this.launchFunction = null;
	this.onUncheckedCharge.dispose();
	this.onUncheckedCharge = null;
	this.onUncheckedRelease.dispose();
	this.onUncheckedRelease = null;
	this.onCharge.dispose();
	this.onCharge = null;
	this.onChargeComplete.dispose();
	this.onChargeComplete = null;
	this.onRelease.dispose();
	this.onRelease = null;
	this.chargeFactor = 0;
	this.chargeCompleted = false;
	this.onUse.dispose();
	this.onUpdate = null;
	this.onFailedUse.dispose();
	this.onFailedUse = null;
	
	this.icon = null;
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
	
	this.element = Elements.ALMIGHTY;

	this.targetTags = [];
	
	this.transfer = {
		velocity: {
			x: 1,

			y: 1
		}
	};
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
				this.damageFunction(obstacle);
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

function createProjectile(game, x, y, spriteName, initFunction,
						  updateFunction, killFunction, collideFunction,
						  collideProcess, damageFunction){
	var newProjectile;
	var spritePool = BasicGame.pool[spriteName];

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
		BasicGame.pool[spriteName] = game.add.group();

		newProjectile = new Projectile(game, 0, 0, spriteName,
									   initFunction, updateFunction,
									   killFunction, collideFunction,
									   collideProcess, damageFunction);
		BasicGame.pool[spriteName].add(newProjectile);
	}

	newProjectile.tag = "projectile";
	newProjectile.tint = H_WHITE;
	newProjectile.init();

	return newProjectile;
}

/*****************/
/* Common Skills */
/******************************************************************************/
var FireBallSkill = function(user, level, targetTags){
	var cooldown = user.allStats.attackSpeed.get();

	function costFunction(applyCost){
		if (this.user.allStats.special.canSubtract(5)){
			if (applyCost){
				this.user.allStats.special.subtract(5);
			}
			
			return true;
		}
		else{
			return false;
		}
	}

	Skill.call(this, user, level, costFunction, cooldown, Elements.FIRE,
			   targetTags);

	this.launchFunction = function(factor){
		var user = this.user;
		var self = this;

		function initProjectile(){
			this.x = user.x;

			this.y = user.y + user.height * 0.65;

			this.anchor.setTo(0.5);

			this.frame = 0;

			this.lifespan = 1000 * Math.sqrt(self.level) * (1 + 0.5*factor);

			this.orientationH = user.orientationH;
			
			if (user.orientationH >= 0){
				this.animations.add("animation", [0, 1, 2, 3, 4, 5, 6, 7]);
			}
			else{
				this.animations.add("animation", [8, 9, 10, 11, 12, 13, 14, 15]);
			}
			
			this.animations.play("animation", null, true);

			this.game.physics.enable(this, Phaser.Physics.ARCADE);
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
				.to({y : 100}, this.lifespan / (2 + factor))
				.to({y : -100}, this.lifespan / (2 + factor));

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

			if (this.orientationH > 0){
				x += this.width / 2;
			}
			else{
				x -= this.width / 2;
			}
			

			createProjectile(this.game, x, y, "explosion_0",
							 function(){initExplosion.call(this, x, y)});

			return true;
		}

		function collideFunction(obstacle){
			if (obstacle.tag != "platform"){
				var damages = this.damageFunction(obstacle);

				if (damages > 0){
					obstacle.dot(5000, 500, 0.25, user.allStats.attack.get() / 5,
								 [0.9, 1.1], 0.1, Elements.FIRE);
				}
			}

			this.kill();
		}

		function collideProcess(obstacle){
			return ((this.targetTags.indexOf(obstacle.tag) != -1) ||
					(obstacle.tag == "platform"));
		}

		function damageFunction(obstacle){
			var damage = self.user.allStats.attack.get() * (1 + factor) * (1 + factor);
			var damageRange = [0.9, 1.1];
			var criticalRate = self.user.allStats.criticalRate.get();
			
			return obstacle.suffer(damage, damageRange, criticalRate, this.element);
		}

		function initExplosion(x, y){
			this.x = x;
			this.y = y;
			this.anchor.setTo(0.5);
			this.tint = H_WHITE;
			this.frame = 0;
			this.animations.add("explosionAnimation", [0, 1, 2, 3, 4, 5, 6, 7, 8]);
			this.animations.play("explosionAnimation", null, false, true);

			BasicGame.sfx.EXPLOSION_0.play("", 0, BasicGame.volume.sfx);
		}
		
		createProjectile(this.game, 0, 0, "fireball_0",
						 initProjectile, updateProjectile, killProjectile,
						 collideFunction, collideProcess, damageFunction);

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
		}, this);
		
		var animation = null;

		if (this.user.orientationH >= 0){
			animation = this.user.animations.play("spellCastRight");
		}
		else{
			animation = this.user.animations.play("spellCastLeft");
		}

		this.user.can.move = false;

		animation.onComplete.addOnce(function(){
			this.user.can.move = true;
			this.user.can.action = true;
			this.user.current.action = null;

			this.onBreak.removeAll();
		}, this);
	};

	this.icon = "fireball_icon";
}

FireBallSkill.prototype = Object.create(Skill.prototype);
FireBallSkill.prototype.constructor = FireBallSkill;


var IceBallSkill = function(user, level, targetTags){
	var cooldown = [15000 / 3, 14000 / 3, 13000 / 3,
					12000/3, 11000 / 3];

	function costFunction(applyCost){
		var cost = (20 - this.level) * this.user.allStats.special.getMax() / 100;

		if (this.user.allStats.special.canSubtract(cost)){
			if (applyCost){
				this.user.allStats.special.subtract(cost);
			}

			return true;
		}
		else{
			return false;
		}
		
	}
	
	Skill.call(this, user, level, costFunction, cooldown, Elements.ICE,
			   targetTags);

	this.launchFunction = function(factor){
		var user = this.user;
		var self = this;

		function initProjectile(direction){
			this.x = user.x;
			this.y = user.y + user.height * 0.65;

			this.anchor.setTo(0.5);

			this.alpha = 1;

			this.frame = 0;
			
			this.lifespan = 1000 * (15000 / 3 / self.getCooldown()) *
				(15000 / 3 / self.getCooldown() * (1  + 0.5*factor));

			this.orientationH = user.orientationH;
			
			if (user.orientationH >= 0){
				this.animations.add("animation", [32, 33, 34, 35, 36, 37, 38, 39], 15);
			}
			else{
				this.animations.add("animation", [0, 1, 2, 3, 4, 5, 6, 7], 15);
			}
			
			this.animations.play("animation", null, true);
			
			this.game.physics.enable(this, Phaser.Physics.ARCADE);
			this.body.velocity.x = 500 ;
			
			if (user.orientationH < 0){
				this.x += user.width * 1 / 4;
				this.body.velocity.x *= -1;
			}
			else{
				this.x += user.width * 3 / 4;
			}

			this.body.velocity.y = -direction * 100 * (1 + factor);
			this.body.allowGravity = false;

			this.tween = this.game.add.tween(this.body.velocity)
				.to({y : direction * 100 * (1 + factor)},
					this.lifespan / (1 + factor), Phaser.Easing.Quintic.InOut);

			this.targetTags = self.targetTags;
			this.element = self.element;

			this.tween.yoyo();
			this.tween.loop();

			this.tween.start();
		}

		function initProjectile1(){
			initProjectile.call(this, 1);
		}
		
		function initProjectile2(){
			initProjectile.call(this, -1);
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

			if (this.orientationH > 0){
				x += this.width / 2;
			}
			else{
				x -= this.width / 2;
			}
			
			createProjectile(this.game, x, y, "explosion_1",
							 function () { initExplosion.call(this, x, y) });
			
			return true;
		}

		function collideFunction(obstacle){
			try{
				var damages = this.damageFunction(obstacle);

				if (damages > 0){
					obstacle.slow(self.level * 1000, self.level / 10 * 1.5, 0.33);
				}
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
		    this.animations.add("explosionAnimation", [1, 2, 3, 4, 5, 6, 7, 8]);
		    this.animations.play("explosionAnimation", null, false, true);

		    BasicGame.sfx.EXPLOSION_0.play("", 0, BasicGame.volume.sfx);
		}

		function damageFunction(obstacle){
			var damage = self.user.allStats.attack.get();

			switch(self.level){
			case 1:
				damage *= 2;
				break;
				
			case 2:
				damage *= 2.5;
				break;
				
			case 3:
				damage *= 3;
				break;
				
			case 4:
				damage *= 3;
				break;

			case 5:
				damage *= 4;
				break;
				
			default:
				break;
			}

			var damageRange = [0.9, 1.1];
			var criticalRate = self.user.allStats.criticalRate.get();
			
			return obstacle.suffer(damage * (1 + factor) * (1 + factor), damageRange,
								   criticalRate, this.element);
		}

		createProjectile(this.game, 0, 0, "iceball_0",
						 initProjectile1, updateProjectile, killProjectile,
						 collideFunction, undefined, damageFunction);
		
		if (factor >= 0.5){
			createProjectile(this.game, 0, 0, "iceball_0",
							 initProjectile2, updateProjectile, killProjectile,
							 collideFunction, undefined, damageFunction);
		}

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
		}, this);

		var animation = null;
		
		if (this.user.orientationH >= 0){
			animation = this.user.animations.play("spellCastRight");
		}
		else{
			animation = this.user.animations.play("spellCastLeft");
		}
		
		this.user.can.move = false;

		animation.onComplete.addOnce(function(){
			this.user.can.move = true;
			this.user.can.action = true;
			this.user.current.action = null;

			this.onBreak.removeAll();
		}, this);
	};
	
	this.icon = "iceball_icon";
};

IceBallSkill.prototype = Object.create(Skill.prototype);
IceBallSkill.prototype.constructor = IceBallSkill;

var PoisonSkill = function(user, level, targetTags){
	var cooldown = [15000 / 3, 14000 / 3, 13000 / 3,
					12000/3, 11000 / 3];

	function costFunction(applyCost){
		var cost = (20 - this.level) * this.user.allStats.special.getMax() / 100;

		if (this.user.allStats.special.canSubtract(cost)){
			if (applyCost){
				this.user.allStats.special.subtract(cost);
			}

			return true;
		}
		else{
			return false;
		}
		
	}
	
	Skill.call(this, user, level, costFunction, cooldown, Elements.POISON,
			   targetTags);

	this.launchFunction = function(factor){
		var user = this.user;
		var self = this;

		function initProjectile(){
			this.x = user.x;
			this.y = user.y + user.height * 0.65;

			this.anchor.setTo(0.5);

			this.alpha = 1;
			
			this.tint = H_PURPLE;
			this.frame = 0;
			
			this.lifespan = 1000 * (15000 / 3 / self.getCooldown()) *
				(15000 / 3 / self.getCooldown() * (1  + 0.5*factor));
			this.maxLifespan = this.lifespan;

			this.orientationH = user.orientationH;
			
			if (user.orientationH >= 0){
				this.animations.add("animation", [32, 33, 34, 35, 36, 37, 38, 39], 15);
			}
			else{
				this.animations.add("animation", [0, 1, 2, 3, 4, 5, 6, 7], 15);
			}
			
			this.animations.play("animation", null, true);
			
			this.game.physics.enable(this, Phaser.Physics.ARCADE);
			this.body.velocity.x = 200 * (1 + 0.5 * factor) ;
			
			if (user.orientationH < 0){
				this.x += user.width * 1 / 4;
				this.body.velocity.x *= -1;
			}
			else{
				this.x += user.width * 3 / 4;
			}

			this.body.velocity.y = 0;
			this.body.allowGravity = false;

			this.targetTags = self.targetTags;
			this.element = self.element;

			this.alreadyHit = [];

			this.transfer.velocity.x = 0;
			this.transfer.velocity.y = 0;
		}

		function updateProjectile(){
			this.scale.x = this.lifespan / 1000;
			this.scale.y = this.scale.x;

			this.alpha = this.lifespan / this.maxLifespan;
		}

		function killProjectile(){
			this.alreadyHit = [];
			
			return true;
		}

		function collideFunction(obstacle){
			this.damageFunction(obstacle);
			this.alreadyHit.push(obstacle);
			
			obstacle.slow(5000, 0.5, 0.5);
		}

		function collideProcess(obstacle){
			return ((this.targetTags.indexOf(obstacle.tag) != -1) &&
					(this.alreadyHit.indexOf(obstacle) == -1));
		}

		function damageFunction(obstacle){
			var damage = self.user.allStats.attack.get() / 5;

			switch(self.level){
			case 1:
				damage *= 2;
				break;
				
			case 2:
				damage *= 2.5;
				break;
				
			case 3:
				damage *= 3;
				break;
				
			case 4:
				damage *= 3;
				break;

			case 5:
				damage *= 4;
				break;
				
			default:
				break;
			}

			var damageRange = [0.9, 1.1];
			var criticalRate = self.user.allStats.criticalRate.get();
			
			return obstacle.dot(5000, 500, 1,
								damage * (1 + this.alpha),
								[0.9, 1.1], 0.1, this.element);
		}

		createProjectile(this.game, 0, 0, "iceball_0",
						 initProjectile, updateProjectile, killProjectile,
						 collideFunction, collideProcess, damageFunction);

		var animation = null;
		
		if (this.user.orientationH >= 0){
			animation = this.user.animations.play("spellCastRight");
		}
		else{
			animation = this.user.animations.play("spellCastLeft");
		}
		
		this.user.can.move = false;

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
		}, this);

		animation.onComplete.addOnce(function(){
			this.user.can.move = true;
			this.user.can.action = true;
			this.user.current.action = null;

			this.onBreak.removeAll();
		}, this);
	};
	
	this.icon = "poison_icon";
};

PoisonSkill.prototype = Object.create(Skill.prototype);
PoisonSkill.prototype.constructor = PoisonSkill;

var DeathSkill = function (user, level, targetTags) {
    var cooldown = 1500;

    function costFunction(applyCost) {
        var cost = (0.4 - this.level / 50) * this.user.allStats.special.getMax();
		
		if (this.user.allStats.special.canSubtract(cost)) {
			if (applyCost){
				this.user.allStats.special.subtract(cost);
			}
				
			return true;
		}
		else {
			return false;
		}
    }

    Skill.call(this, user, level, costFunction, cooldown, Elements.ALMIGHTY,
			   targetTags);

	var self = this;
	var user = this.user;

	this.deathZone = null;
	this.range = 3 * user.width * Math.sqrt(this.level);

	this.onCharge.add(function(){
		if (this.deathZone != null){
			return;
		}

		user.can.move = false;
		user.can.jump = false;
		user.can.orient = false;

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
			this.user.can.jump = true;
			this.user.can.orient = true;
		}, this);

		function initProjectile(){
			this.anchor.setTo(0.5);

			this.game.physics.enable(this, Phaser.Physics.ARCADE);
			this.body.allowGravity = false;

			this.x = user.x + user.width / 2;
			this.y = user.y + user.height / 2;

			this.width = user.width;
			this.height = this.width;

			this.tint = H_BLACK;
			this.alpha = 0.5;

			this.element = self.element;
			this.targetTags = self.targetTags;

			this._frame = 0;
			this.activated = false;
		}

		function updateProjectile(){
			switch(this._frame){
			case 0:
				this.width = user.width + self.chargeTime.get(1) *
					(self.range - user.width);
				break;
			case 2:
				this.width -= 5;
				break;
			default:
				break;
			}

			this.height = this.width;

			this._frame++;

			this._frame %= 5;

			this.x = user.x + user.width / 2;
			this.y = user.y + user.height / 2;
		}

		function collideProcess(obstacle){
			return (this.activated &&
					(this.targetTags.indexOf(obstacle.tag) != -1));
		}

		function damageFunction(obstacle){
			var damage = obstacle.allStats.health.getMax();

            obstacle.suffer(damage, [1, 1], 0, this.element);
		}	

		user.animations.play("spellChargeBoth")
			.onComplete.addOnce(function(){
				this.deathZone = createProjectile(this.game, 0, 0, "circle",
												  initProjectile, updateProjectile,
												  null, null, collideProcess,
												  damageFunction);

				this.onBreak.addOnce(this.deathZone.kill, this.deathZone);
			}, this);
	}, this);

    this.launchFunction = function (factor) {
		if (!user.animations.currentAnim.isFinished){
			user.animations.currentAnim.onComplete.addOnce(
				function(){
					this.launchFunction.call(this, factor);
				}, this);
			return;
		}

		this.deathZone.activated = true;
		this.onBreak.removeAll();
		BasicGame.level.toKill.push(this.deathZone);

		this.deathZone = null;
        /*function initProjectile() {
            this.x = user.x;
            this.y = user.y;

            this.anchor.setTo(0);

            this.frame = 0;

            this.lifespan = 800;

            this.animations.add("animation", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
											  12, 13]);
            this.animations.play("animation");

            this.game.physics.enable(this, Phaser.Physics.ARCADE);

            this.body.allowGravity = false;

            this.targetTags = self.targetTags;

            this.element = self.element;
        }

        function updateProjectile() {
        }

        function killProjectile() {
            return true;
        }

        function collideFunction(obstacle) {
            this.damageFunction(obstacle);

            this.kill();
        }

        function damageFunction(obstacle) {
            var damage = self.user.allStats.attack.get();
            var damageRange = [0.9, 1.1];
            var criticalRate = self.user.allStats.criticalRate.get();

            obstacle.suffer(damage, damageRange, criticalRate, this.element);
        }


        user.animations.stop("spellCastRight");
        user.animations.stop("spellCastLeft");

        createProjectile(this.game, 0, 0, "death",
						 initProjectile, updateProjectile, killProjectile,
						 collideFunction, null, damageFunction);

        if (user.orientationH >= 0) {
            user.animations.play("spellCastRight");
        }
        else {
            user.animations.play("spellCastLeft");
        }*/

		user.animations.play("spellReleaseBoth")
			.onComplete.add(function(){
				user.can.action = true;
				user.can.move = true;
				user.can.jump = true;
				user.can.orient = true;
			}, this);
    };

    this.icon = "death_icon";
}

DeathSkill.prototype = Object.create(Skill.prototype);
DeathSkill.prototype.constructor = ThunderSkill;


var ThunderSkill = function (user, level, targetTags) {
    var cooldown = [30000 / 3, 28000 / 3, 26000 / 3, 24000 / 3, 20000 / 3];
	
    function costFunction(applyCost) {
		var cost = (0.4 - this.level / 50) * this.user.allStats.special.getMax();
		
		if (this.user.allStats.special.canSubtract(cost)) {
			if (applyCost){
				this.user.allStats.special.subtract(cost);
			}
				
			return true;
		}
		else {
			return false;
		}
		
    }
    
    Skill.call(this, user, level, costFunction, cooldown, Elements.THUNDER,
            targetTags);

    this.launchFunction = function (factor) {
        var user = this.user;
        var self = this;

        function initProjectile(direction) {
            this.x = user.x;
            this.y = user.y + user.height * 0.65;

            this.frame = 0;

			this.scale.x = 1 + factor;

            this.lifespan = 500;
			this.maxLifespan = this.lifespan;
            
            if (this.orientationH >= 0) {
                this.x += user.width;
            }

			this.animations.add("animation", [0, 1, 2]);
            
            this.animations.play("animation", null, true);

            this.game.physics.enable([this], Phaser.Physics.ARCADE);
           

            if (direction < 0) {
                this.anchor.setTo(1, 0.5);
            }
            else{
				this.anchor.setTo(0, 0.5);
            }
            
            this.body.allowGravity = false;
            
            this.targetTags = self.targetTags;
           
            this.element = self.element;
			
			this.alpha = 0;

			this.tween = this.game.add.tween(this)
				.to({alpha : 1},
					this.lifespan / 2, Phaser.Easing.Elastic.Out);

			this.tween.yoyo();

			this.tween.loop();

			this.tween.start();
		}

		function initProjectile1(){
			initProjectile.call(this, 1);
			
			this.orientationH = 1;
		}
		
		function initProjectile2(){
			initProjectile.call(this, -1);
			
			this.orientationH = -1;
		}

        function updateProjectile(){
			//this.scale.x = (this.maxLifespan - this.lifespan) / 300;
			
			this.x = user.x;

			if (this.orientationH >= 0) {
                this.x += user.width;
            }

			this.y = user.y + user.height * 0.65;
        }

        function killProjectile() {
			this.tween.stop();
			this.tween = null;

            return true;
        }

        function collideFunction(obstacle) {
            try{
                this.damageFunction(obstacle);
				
				obstacle.body.velocity.x += 500 * this.orientationH;
            }
			catch(err){}
        }

        function collideProcess(obstacle) {
            return ((this.alpha >= 0.95) && (this.alpha <= 1)) &&
				((this.targetTags.indexOf(obstacle.tag) != -1) ||
				 (obstacle.tag == "platform"));
        }

        function damageFunction(obstacle) {
			var damage = self.user.allStats.attack.get() / 20;
            var damageRange = [0.9, 1.1];
            var criticalRate = self.user.allStats.criticalRate.get();

			switch(self.level){
			case 1:
				damage *= 2;
				break;
				
			case 2:
				damage *= 2;
				break;

			case 3:
				damage *= 2.5;
				break;

			case 4:
				damage *= 2.5;
				break;
			
			case 5:
				damage *= 3;
				break;

			default:
				break;
			}
			
            obstacle.suffer(damage * (1 + factor) * (1 + factor), damageRange,
							2 * criticalRate, this.element);
        }

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
		}, this);

        var animation = null;
		
		if (factor < 0.5){
			if (this.user.orientationH >= 0){
				createProjectile(this.game, 0, 0, "thunder_0",
								 initProjectile1, updateProjectile, killProjectile,
								 collideFunction, collideProcess, damageFunction);
				
				animation = this.user.animations.play("spellCastRight");
			}
			else{
				createProjectile(this.game, 0, 0, "thunder_0",
								 initProjectile2, updateProjectile, killProjectile,
								 collideFunction, collideProcess, damageFunction);

				animation = this.user.animations.play("spellCastLeft");
			}
		}
		else{
			createProjectile(this.game, 0, 0, "thunder_0",
							 initProjectile1, updateProjectile, killProjectile,
							 collideFunction, collideProcess, damageFunction);
			
			createProjectile(this.game, 0, 0, "thunder_0",
							 initProjectile2, updateProjectile, killProjectile,
							 collideFunction, collideProcess, damageFunction);
			
			animation = this.user.animations.play("spellCastBoth");
		}
		
		this.user.can.move = false;

		animation.onComplete.addOnce(function(){
			this.user.can.move = true;
			this.user.can.action = true;
			this.user.current.action = null;
			
			this.onBreak.removeAll();
		}, this);
    };

    this.icon = "thunder_icon";
}

ThunderSkill.prototype = Object.create(Skill.prototype);
ThunderSkill.prototype.constructor = ThunderSkill;


var SlashSkill = function(user, level, targetTags){
	function costFunction(applyCost){
		return true;
	}

	Skill.call(this, user, level, costFunction, user.allStats.attackSpeed.get(),
			   Elements.PHYSIC, targetTags);

	var speed = (1 + this.user.allStats.agility.get()) / 100;
	
	this.onCharge.add(function(){
		if (this.user.orientationH >= 0){
			this.user.frame = 195;
		}
		else{
			this.user.frame = 169;
		}

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
		}, this);

		this.user.can.move = false;
		
		this.user.orientRight = function(){
			this.orientationH = 1;
			
			this.frame = 195;
		}
		
		this.user.orientLeft = function(){
			this.orientationH = -1;
			
			this.frame = 169;
		}

		this.user.animations.currentAnim.stop();

		if (this.user.orientationH >= 0){
			this.user.orientRight();
		}
		else{
			this.user.orientLeft();
		}
	}, this);

	this.launchFunction = function(factor){
		var self = this;
		var user = this.user;

		function initProjectile(){
			this.x = user.x;
			this.y = user.y + 3 * user.height / 5;

			this.game.physics.enable(this, Phaser.Physics.ARCADE);
			this.body.allowGravity = false;
			
			this.body.velocity.x = -50 * (1 + factor);

			if (user.orientationH >= 0){
				this.x += user.width;
				this.body.velocity.x *= -1;
			}
			
			this.anchor.setTo(0.5);
			this.scale.setTo(1 + factor, 0.5);
			
			if (user.orientationH >= 0){
				this.animations.add("animation", [3, 2, 1, 0], 15);
			}
			else{
				this.animations.add("animation", [4, 5, 6, 7], 15);
			}
			
			this.alpha = 1;
			this.angle = 0;

			this.tint = H_WHITE;

			this.targetTags = self.targetTags;
			this.element = self.element;
			
			this.orientationH = user.orientationH;
			this.alreadyHit = [];

			this.animations.play("animation", null, false, true);
		}

		function updateProjectile(){
			this.y = user.y + 3 * user.height / 5;
		}

		function damageFunction(obstacle){
			var damage = self.user.allStats.attack.get() * 
				(1 + factor + user.allStats.fury.get(1));
			var damageRange = [0.9, 1.1];
			var criticalRate = self.user.allStats.criticalRate.get();
			
			obstacle.suffer(damage, damageRange, criticalRate, this.element);
		}

		function collideFunction(obstacle){
			if (this.alreadyHit.indexOf(obstacle) != -1){
				return;
			}

			this.alreadyHit.push(obstacle);

			if (this.orientationH >= 0){
				obstacle.body.velocity.x += 100 * (1 + 2 * factor);
			}
			else{
				obstacle.body.velocity.x -= 100 * (1 + 2 * factor);
			}

			user.allStats.special.add(10 * (1 + factor));

			this.damageFunction(obstacle);
		}

		this.onBreak.removeAll();
		
		this.onBreak.addOnce(function(){
			this.user.can.move = true;
			this.user.can.orient = true;
		}, this);

		user.orientRight = Hero.prototype.orientRight;
		user.orientLeft = Hero.prototype.orientLeft;

		user.can.orient = false;

		createProjectile(this.game, 0, 0, "slash",
						 initProjectile, updateProjectile, undefined,
						 collideFunction, undefined, damageFunction);

		var animation = null;

		if (user.orientationH >= 0){
			animation = user.animations.play("swordRight", 12 * (speed + 1));
		}
		else{
			animation = user.animations.play("swordLeft", 12 * (speed + 1));
		}
		
		animation.onComplete.add(function(){
			this.user.can.move = true;
			this.user.can.action = true;
			this.user.current.action = null;
			this.user.can.orient = true;

			this.onBreak.removeAll();
		}, this);
	}

	this.setChargeTime(this.user.allStats.attackSpeed.get());
	
	this.updateChargeTime = function(){
		Skill.prototype.updateChargeTime.call(this, this.user.allStats.attackSpeed.get());
	}

	this.updateCooldown = function(){
		Skill.prototype.updateCooldown.call(this, this.user.allStats.attackSpeed.get());
	}
	
	this.user.allStats.attackSpeed.onUpdate.add(this.updateCooldown, this);
	this.user.allStats.attackSpeed.onUpdate.add(this.updateChargeTime, this);

	this.onDestroy.addOnce(function(){
		if (this.user.allStats.attackSpeed.onUpdate != null){
			this.user.allStats.attackSpeed.onUpdate.remove(this.updateCooldown);
			this.user.allStats.attackSpeed.onUpdate.remove(this.updateChargeTime);
		}
	}, this);

	this.icon = 'slash_icon';
};

SlashSkill.prototype = Object.create(Skill.prototype);
SlashSkill.prototype.constructor = SlashSkill;

var HeroicStrikeSkill = function(user, level, targetTags){
	function costFunction(applyCost){
		return true;
	}

	Skill.call(this, user, level, costFunction, user.allStats.attackSpeed.get(),
			   Elements.PHYSIC, targetTags);

	var speed = (1 + this.user.allStats.agility.get()) / 300;
	
	this.onCharge.add(function(){
		if (this.user.orientationH >= 0){
			this.user.frame = 195;
		}
		else{
			this.user.frame = 169;
		}

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
		}, this);

		this.user.can.move = false;
		
		this.user.orientRight = function(){
			this.orientationH = 1;
			
			this.frame = 195;
		}
		
		this.user.orientLeft = function(){
			this.orientationH = -1;
			
			this.frame = 169;
		}

		this.user.animations.currentAnim.stop();

		if (this.user.orientationH >= 0){
			this.user.orientRight();
		}
		else{
			this.user.orientLeft();
		}
	}, this);

	this.launchFunction = function(factor){
		var self = this;
		var user = this.user;

		function initProjectile(){
			this.x = user.x;
			this.y = user.y + 3 * user.height / 5;

			this.game.physics.enable(this, Phaser.Physics.ARCADE);
			this.body.allowGravity = false;
			
			this.body.velocity.x = -50 * (1 + factor);

			if (user.orientationH >= 0){
				this.x += user.width;
				this.body.velocity.x *= -1;
			}
			
			this.anchor.setTo(0.5);
			this.scale.setTo(3 + factor, 1.5);
			
			if (user.orientationH >= 0){
				this.animations.add("animation", [3, 2, 1, 0], 15);
			}
			else{
				this.animations.add("animation", [4, 5, 6, 7], 15);
			}
			
			this.alpha = 1;
			this.angle = 0;

			this.tint = H_RED;


			this.targetTags = self.targetTags;
			this.element = self.element;
			
			this.orientationH = user.orientationH;
			this.alreadyHit = [];

			this.animations.play("animation", null, false, true);
		}

		function updateProjectile(){
			this.y = user.y + 3 * user.height / 5;
		}

		function damageFunction(obstacle){
			var damage = self.user.allStats.attack.get() * 
				(1 + factor + user.allStats.fury.get(1));
			var damageRange = [0.9, 1.1];
			var criticalRate = self.user.allStats.criticalRate.get();
			
			obstacle.suffer(damage, damageRange, criticalRate, this.element);
		}

		function collideFunction(obstacle){
			if (this.alreadyHit.indexOf(obstacle) != -1){
				return;
			}

			this.alreadyHit.push(obstacle);

			if (this.orientationH >= 0){
				obstacle.body.velocity.x += 100 * (1 + 2 * factor);
			}
			else{
				obstacle.body.velocity.x -= 100 * (1 + 2 * factor);
			}

			user.allStats.special.add(10 * (1 + factor));

			this.damageFunction(obstacle);
		}

		this.onBreak.removeAll();
		
		this.onBreak.addOnce(function(){
			this.user.can.move = true;
			this.user.can.orient = true;
		}, this);

		user.orientRight = Hero.prototype.orientRight;
		user.orientLeft = Hero.prototype.orientLeft;

		user.can.orient = false;

		createProjectile(this.game, 0, 0, "slash",
						 initProjectile, updateProjectile, undefined,
						 collideFunction, undefined, damageFunction);

		var animation = null;

		if (user.orientationH >= 0){
			animation = user.animations.play("swordRight", 12 * (speed + 1));
		}
		else{
			animation = user.animations.play("swordLeft", 12 * (speed + 1));
		}
		
		animation.onComplete.add(function(){
			this.user.can.move = true;
			this.user.can.action = true;
			this.user.current.action = null;
			this.user.can.orient = true;

			this.onBreak.removeAll();
		}, this);
	}

	this.setChargeTime(this.user.allStats.attackSpeed.get());
	
	this.updateChargeTime = function(){
		Skill.prototype.updateChargeTime.call(this, this.user.allStats.attackSpeed.get());
	}

	this.updateCooldown = function(){
		Skill.prototype.updateCooldown.call(this, this.user.allStats.attackSpeed.get());
	}
	
	this.user.allStats.attackSpeed.onUpdate.add(this.updateCooldown, this);
	this.user.allStats.attackSpeed.onUpdate.add(this.updateChargeTime, this);

	this.onDestroy.addOnce(function(){
		if (this.user.allStats.attackSpeed.onUpdate != null){
			this.user.allStats.attackSpeed.onUpdate.remove(this.updateCooldown);
			this.user.allStats.attackSpeed.onUpdate.remove(this.updateChargeTime);
		}
	}, this);

	this.icon = 'heroicStrike_icon';
};

HeroicStrikeSkill.prototype = Object.create(Skill.prototype);
HeroicStrikeSkill.prototype.constructor = HeroicStrikeSkill;

var DashSkill = function(user, level, targetTags){
	function costFunction(applyCost){
		return true;
	}

	Skill.call(this, user, level, costFunction, user.allStats.attackSpeed.get(),
			   Elements.PHYSIC, targetTags);

	var speed = (1 + this.user.allStats.agility.get()) / 300;
	
	this.onCharge.add(function(){
		if (this.user.orientationH >= 0){
			this.user.frame = 195;
		}
		else{
			this.user.frame = 169;
		}

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
		}, this);

		this.user.can.move = false;
		
		this.user.orientRight = function(){
			this.orientationH = 1;
			
			this.frame = 195;
		}
		
		this.user.orientLeft = function(){
			this.orientationH = -1;
			
			this.frame = 169;
		}

		this.user.animations.currentAnim.stop();

		if (this.user.orientationH >= 0){
			this.user.orientRight();
		}
		else{
			this.user.orientLeft();
		}
	}, this);

	this.launchFunction = function(factor){
		var self = this;
		var user = this.user;

		var velocity = 500;

		this.dashTimer = this.game.time.create(true);

		if(user.orientationH == -1){
			velocity *= -1;
		}

		this.dashTimer.repeat(1, 20, function(){
			user.body.velocity.x = velocity;
		});

		this.dashTimer.start();
		user.body.velocity.x = 0;

		this.onBreak.removeAll();
		
		this.onBreak.addOnce(function(){
			this.user.can.move = true;
			this.user.can.orient = true;
		}, this);

		user.orientRight = Hero.prototype.orientRight;
		user.orientLeft = Hero.prototype.orientLeft;

		user.can.orient = false;

		var animation = null;

		if (user.orientationH >= 0){
			animation = user.animations.play("swordRight"*2, 12 * (speed + 1));
		}
		else{
			animation = user.animations.play("swordLeft"*2, 12 * (speed + 1));
		}
		
		animation.onComplete.add(function(){
			this.user.can.move = true;
			this.user.can.action = true;
			this.user.current.action = null;
			this.user.can.orient = true;

			this.onBreak.removeAll();
		}, this);
	}

	this.setChargeTime(this.user.allStats.attackSpeed.get());
	
	this.updateChargeTime = function(){
		Skill.prototype.updateChargeTime.call(this, this.user.allStats.attackSpeed.get());
	}

	this.updateCooldown = function(){
		Skill.prototype.updateCooldown.call(this, this.user.allStats.attackSpeed.get());
	}
	
	this.user.allStats.attackSpeed.onUpdate.add(this.updateCooldown, this);
	this.user.allStats.attackSpeed.onUpdate.add(this.updateChargeTime, this);

	this.onDestroy.addOnce(function(){
		if (this.user.allStats.attackSpeed.onUpdate != null){
			this.user.allStats.attackSpeed.onUpdate.remove(this.updateCooldown);
			this.user.allStats.attackSpeed.onUpdate.remove(this.updateChargeTime);
		}
	}, this);

	this.icon = 'dash_icon';
};

DashSkill.prototype = Object.create(Skill.prototype);
DashSkill.prototype.constructor = DashSkill;

var ArrowSkill = function(user, level, targetTags){
	function costFunction(applyCost){
		if (this.user.allStats.special.canSubtract(1)){
			if (applyCost){
				this.user.allStats.special.subtract(1);
			}
			
			return true;
		}
		else{
			return false;
		}
	}

	Skill.call(this, user, level, costFunction, user.allStats.attackSpeed.get(),
			   Elements.PHYSIC, targetTags);

	var self = this;

	this.onCharge.add(function(){
		var animation = null;
		var user = this.user;
		var speed = 60 / (1 + this.user.allStats.attackSpeed.get()) * 200;
		
		function orient(direction){
			if (!user.alive ||
				user._dying){
				return;
			}

			if (!user.can.orient){
				return;
			}

			if (user.orientationH != direction){
				user.orientationH *= -1;
				
				user.animations.currentAnim.stop();
				
				self.onBreak.addOnce(function(){
					this.user.can.orient = true;
				}, self);

				user.can.orient = false;
				
				var animationName = (direction >= 0) ? "bendBowRight" : "bendBowLeft";

				user.animations.play(animationName, speed)
					.onComplete.addOnce(
						function(){
							user.can.orient = true;

							self.onBreak.removeAll();
						}, this);
			}
		}

		user.orientLeft = function(){
			orient(-1);
		}

		user.orientRight = function(){
			orient(1);
		}

		user.orientationH *=-1;
		
		if (!user.orientationH){
			user.orientationH = -1;
		}

		if (user.orientationH > 0){
			user.orientLeft();
		}
		else{
			user.orientRight();
		}

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
		}, this)

		user.can.move = false;
	}, this);

	this.launchFunction = function(factor){
		if (!this.user.animations.currentAnim.isFinished){
			this.user.animations.currentAnim.onComplete.addOnce(
				function(){
					this.launchFunction.call(this, factor);
				}, this);
			return;
		}
		
		var user = this.user;
		var speed = 60 / (1 + this.user.allStats.attackSpeed.get()) * 200;

		function initProjectile(){
			var speed = -600 * (1 + factor);

			this.anchor.set(0, 0.5);
			
			this.x = user.x;
			this.y = user.y + user.width / 2;

			this.frame = 0;

			if (user.orientationH >= 0){
				this.x += user.width / 2;
				speed *= -1;

				this.frame = 1;
			}

			this.orientationH = user.orientationH;

			this.game.physics.enable(this, Phaser.Physics.ARCADE);
			//this.body.allowGravity = true;
			this.body.velocity.y = -35 * (1 + factor);

			this.body.velocity.x = speed;

			this.lifespan = 2000;

			this.alpha = 1;

			this.tint = H_WHITE;

			this.targetTags = self.targetTags;
			this.element = self.element;

			this.transfer.velocity.x = 0.3;
		}

		function damageFunction(obstacle){
			// Les dégâts sont aussi en fonction de la distance parcourue.
			var damage = self.user.allStats.attack.get() * (1 + factor +
												(1 - (this.lifespan - 1200) / 800));
			var damageRange = [0.9, 1.1];
			var criticalRate = self.user.allStats.criticalRate.get();
			
			obstacle.suffer(damage, damageRange, criticalRate, this.element);
		}

		function updateFunction(){
			if (this.lifespan < 1000){
				this.alpha = this.lifespan / 1000;
			}

			this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);

			if (this.orientationH < 0){
				this.angle += 180;
			}
		}

		function collideFunction(obstacle){
			if (obstacle.tag != "platform"){
				this.damageFunction(obstacle);
				this.kill();
			}
			else{
				// Remplace la flêche par un sprite, parce que ça fait classe !

				var selfSprite = this.game.add.sprite(this.x, this.y, this.key);

				selfSprite.anchor.x = this.anchor.x;
				selfSprite.anchor.y = this.anchor.y;
				selfSprite.frame = this.frame;
				selfSprite.rotation = this.rotation;
				selfSprite.tint = this.tint;
				selfSprite.scale.x = this.scale.x;
				selfSprite.scale.y = this.scale.y;

				selfSprite.tween = this.game.add.tween(selfSprite)
					.to({alpha: 0}, 3000, Phaser.Easing.Quadratic.Out);

				selfSprite.tween.start();

				this.kill();
			}
		}

		function collideProcess(obstacle){
			arrowElementChange.call(this, obstacle);

			return (this.targetTags.indexOf(obstacle.tag) != -1) &&
				this.body.allowGravity;
		}

		this.onBreak.removeAll();

		user.orientLeft = Hero.prototype.orientLeft;
		user.orientRight = Hero.prototype.orientRight;

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
			this.user.can.orient = true;
		}, this);

		user.can.orient = false;

		createProjectile(this.game, 0, 0, "arrow",
						 initProjectile, updateFunction, 
						 undefined, collideFunction,
						 collideProcess, damageFunction);

		var animation = null;

		if (this.user.orientationH >= 0){
			animation = this.user.animations.play("unbendBowRight", speed);
		}
		else{
			animation = this.user.animations.play("unbendBowLeft", speed);
		}
		
		animation.onComplete.addOnce(function(){
			this.user.can.move = true;
			this.user.can.action = true;
			this.user.current.action = null;
			this.user.can.orient = true;

			this.onBreak.removeAll();
		}, this);
	}

	this.setChargeTime(2 * this.user.allStats.attackSpeed.get());
	this.icon = "arrow_icon";
}

ArrowSkill.prototype = Object.create(Skill.prototype);
ArrowSkill.prototype.constructor = ArrowSkill;

var MultArrowSkill = function(user, level, targetTags){
	function costFunction(applyCost){
		if (this.user.allStats.quiver.canSubtract(3)){
			if (applyCost){
				this.user.allStats.quiver.subtract(3);
			}
			
			return true;
		}
		else{
			return false;
		}
	}

	Skill.call(this, user, level, costFunction, user.allStats.attackSpeed.get(),
			   Elements.PHYSIC, targetTags);

	var self = this;

	this.onCharge.add(function(){
		var animation = null;
		var user = this.user;
		var speed = 60 / (1 + this.user.allStats.attackSpeed.get()) * 200;
		
		function orient(direction){
			if (!user.can.orient){
				return;
			}

			if (user.orientationH != direction){
				user.orientationH *= -1;
				
				user.animations.currentAnim.stop();
				
				self.onBreak.addOnce(function(){
					this.user.can.orient = true;
				}, self);

				user.can.orient = false;
				
				var animationName = (direction >= 0) ? "bendBowRight" : "bendBowLeft";

				user.animations.play(animationName, speed)
					.onComplete.addOnce(
						function(){
							user.can.orient = true;

							self.onBreak.removeAll();
						}, this);
			}
		}

		user.orientLeft = function(){
			orient(-1);
		}

		user.orientRight = function(){
			orient(1);
		}

		user.orientationH *=-1;
		
		if (!user.orientationH){
			user.orientationH = -1;
		}

		if (user.orientationH > 0){
			user.orientLeft();
		}
		else{
			user.orientRight();
		}

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
		}, this)

		user.can.move = false;
	}, this);

	this.launchFunction = function(factor){
		if (!this.user.animations.currentAnim.isFinished){
			this.user.animations.currentAnim.onComplete.addOnce(
				function(){
					this.launchFunction.call(this, factor);
				}, this);
			return;
		}
		
		var user = this.user;
		var speed = 60 / (1 + this.user.allStats.attackSpeed.get()) * 200;

		function initProjectile(){
			var speed = -600 * (1 + factor);

			this.anchor.set(0, 0.5);
			
			this.x = user.x;
			this.y = user.y + user.width / 2;

			this.frame = 0;

			if (user.orientationH >= 0){
				this.x += user.width / 2;
				speed *= -1;

				this.frame = 1;
			}

			this.orientationH = user.orientationH;

			this.game.physics.enable(this, Phaser.Physics.ARCADE);
			this.body.allowGravity = true;
			this.body.velocity.y = -35 * (1 + factor);

			this.body.velocity.x = speed;

			this.lifespan = 2000;

			this.alpha = 1;

			this.tint = H_WHITE;

			this.targetTags = self.targetTags;
			this.element = self.element;

			this.transfer.velocity.x = 0.2;
		}

		function damageFunction(obstacle){
			// Les dégâts sont aussi en fonction de la distance parcourue.
			var damage = self.user.allStats.attack.get() * (1 + factor +
												(1 - (this.lifespan - 1200) / 800));
			damage *= 0.3;

			var damageRange = [0.5, 1.5];
			var criticalRate = self.user.allStats.criticalRate.get();
			
			obstacle.suffer(damage, damageRange, criticalRate, this.element);
		}

		function updateFunction(){
			if (this.lifespan < 1000){
				this.alpha = this.lifespan / 1000;
			}

			this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);

			if (this.orientationH < 0){
				this.angle += 180;
			}
		}

		function collideFunction(obstacle){
			if (obstacle.tag != "platform"){
				this.damageFunction(obstacle);
				this.kill();
			}
			else{
				// Remplace la flêche par un sprite, parce que ça fait classe !

				var selfSprite = this.game.add.sprite(this.x, this.y, this.key);

				selfSprite.anchor.x = this.anchor.x;
				selfSprite.anchor.y = this.anchor.y;
				selfSprite.frame = this.frame;
				selfSprite.rotation = this.rotation;
				selfSprite.tint = this.tint;
				selfSprite.scale.x = this.scale.x;
				selfSprite.scale.y = this.scale.y;

				selfSprite.tween = this.game.add.tween(selfSprite)
					.to({alpha: 0}, 3000, Phaser.Easing.Quadratic.Out);

				selfSprite.tween.start();

				this.kill();
			}
		}

		function collideProcess(obstacle){
			arrowElementChange.call(this, obstacle);

			return (this.targetTags.indexOf(obstacle.tag) != -1) &&
				this.body.allowGravity;
		}

		user.orientLeft = Hero.prototype.orientLeft;
		user.orientRight = Hero.prototype.orientRight;

		this.onBreak.removeAll();

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
			this.user.can.orient = true;
		}, this);

		user.can.orient = false;

		this.fireTimer = this.game.time.create(true);

		this.fireTimer.repeat(200, 1 + Math.floor(Math.pow((1 + factor), 2)),
		function(){
			createProjectile(this.game, 0, 0, "arrow",
							 initProjectile, updateFunction, 
							 undefined, collideFunction,
							 collideProcess, damageFunction);
			
			
		}, this);

		this.fireTimer.onComplete.add(function(){
			var animation = null;
			
			if (this.user.orientationH >= 0){
				animation = this.user.animations.play("unbendBowRight", speed);
			}
			else{
				animation = this.user.animations.play("unbendBowLeft", speed);
			}

			animation.onComplete.addOnce(function(){
				this.user.can.move = true;
				this.user.can.action = true;
				this.user.can.orient = true;
				this.user.current.action = null;

				this.onBreak.removeAll();
			}, this);

			this.onBreak.removeAll();

		}, this);

		this.onBreak.addOnce(this.fireTimer.stop, this.fireTimer);
		
		createProjectile(this.game, 0, 0, "arrow",
							 initProjectile, updateFunction, 
							 undefined, collideFunction,
							 collideProcess, damageFunction);
		
		this.fireTimer.start();
	}
	
	this.setChargeTime(2 * this.user.allStats.attackSpeed.get());
	this.icon = "multArrow_icon";
}

MultArrowSkill.prototype = Object.create(Skill.prototype);
MultArrowSkill.prototype.constructor = MultArrowSkill;


var SpeedUpArrowSkill = function(user, level){
	function costFunction(applyCost){
		if (this.user.allStats.quiver.canSubtract(3)){
			if (applyCost){
				this.user.allStats.quiver.subtract(3);
			}
			
			return true;
		}
		else{
			return false;
		}
	}

	Skill.call(this, user, level, costFunction, 20000,
			   Elements.ALMIGHTY);

	this.launchFunction = function(factor){
		var speedFactor = 1.5;
		var duration = 3000;

		switch(this.level){
		case 1:
			speedFactor *= 1.5;
			break;
		
		case 2:
			speedFactor *= 2;
			break;
			
		case 3:
			speedFactor *= 2.5;
			break;
		
		case 4:
			speedFactor *= 3;
			break;

		case 5:
			speedFactor *= 3.5;
			break;

		default:
			break;
		}

		switch(this.level){
		case 5:
			duration *= 5;
			break;
			
		default:
			duration *= 3;
		}

		this.user.allStats.attackSpeed.factor /= speedFactor;
		
		for(var j in this.user.allSkills[this.user.currentMode]){
			this.user.allSkills[this.user.currentMode][j].chargeFactor *= speedFactor;
		}

		this.speedUpTimer = this.game.time.create(true);
		this.speedUpTimer.add(duration, function(){
			this.user.allStats.attackSpeed.factor *= speedFactor;
			
			for(var j in this.user.allSkills[this.user.currentMode]){
				this.user.allSkills[this.user.currentMode][j].chargeFactor /= speedFactor;
			}
		}, this);

		this.speedUpTimer.onComplete.addOnce(this.onBreak.removeAll, this);

		this.speedUpTimer.start();

		this.onBreak.addOnce(function(){
			this.speedUpTimer.stop(true);
		}, this);

		this.user.can.action = true;
		this.user.current.action = null;
	}

	this.icon = "speedUpArrow_icon";
}

SpeedUpArrowSkill.prototype = Object.create(Skill.prototype);
SpeedUpArrowSkill.prototype.constructor = SpeedUpArrowSkill;


var TrapSkill = function(user, level, targetTags){
	function costFunction(applyCost){
		if (this.user.allStats.quiver.canSubtract(2)){
			if (applyCost){
				this.user.allStats.quiver.subtract(2);
			}
			
			return true;
		}
		else{
			return false;
		}
	}

	Skill.call(this, user, level, costFunction, 10000,
			   Elements.EARTH, targetTags);

	this.onCharge.add(function(){
		this.onBreak.addOnce(function(){
			this.user.can.move = true;
		}, this);

		this.user.can.move = false;
	}, this);

	this.launchFunction = function(factor){
		var self = this;
		var user = this.user;

		function initProjectile(){
			this.anchor.set(0.5, 1);

			this.tint = H_ORANGE;

			this.x = user.x + user.width / 2;
			this.y = user.y + user.height - this.height;

			this.width *= (1 + factor);
			this.height *= (1 + factor);

			this.alpha = 1;

			this.game.physics.enable(this, Phaser.Physics.ARCADE);

			this.lifespan = 4000 + 3000 * factor;

			this.maxLifespan = this.lifespan;

			this.targetTags = self.targetTags;
			this.element = self.element;
		}

		function updateProjectile(){
			this.alpha = this.lifespan / this.maxLifespan;
		}

		function collideFunction(obstacle){
			if (obstacle.tag == "platform"){
				return;
			}
			

			explode.call(this);
		}
		
		function collideProcess(obstacle){
			if (obstacle.tag == "platform"){
				return true;
			}

			if ((obstacle.tag == "projectile")){
				this.tint = H_ORANGE;

				switch(obstacle.element){
				case Elements.FIRE:
					this.tint = H_RED;
					this.element = obstacle.element;
					break;
				case Elements.ICE:
					this.tint = H_BLUE;
					this.element = obstacle.element;
					break;
				case Elements.EARTH:
					this.element = obstacle.element;
					break;
				default:
					break;
				}
			}

			return (this.targetTags.indexOf(obstacle.tag) != -1);
		}

		function killProjectile(){
			self.onUncheckedCharge.removeAll();
			
			return true;
		}

		function explode(){
			function initProjectile2(){
				this.anchor.set(0.5);
				
				this.tint = H_ORANGE;

				this.x = trap.x;
				this.y = trap.y;

				this.alpha = 1;

				this.game.physics.enable(this, Phaser.Physics.ARCADE);
				
				this.targetTags = trap.targetTags;
				this.element = trap.element;

				this.alreadyHit = [];

				this.animations.add("animation", [0, 1, 2, 3, 4, 5], 30);
				this.animations.play("animation", null, false, true);

				switch(this.element){
				case Elements.FIRE:
					this.tint = H_ORANGE;
					break;
				case Elements.ICE:
					this.tint = H_BLUE;
					break;
				default:
					break;
				}
			}

			function collideFunction2(obstacle){
				if (this.alreadyHit.indexOf(obstacle) == -1){
					var damage = user.allStats.attack.get() * (1 + factor * 2);
					var damageRange = [0.9, 1.1];
					var criticalRate = user.allStats.criticalRate.get();

					var effectDuration = 2000;

					switch(self.level){
					case 1:
						break;
						
					case 2:
						break;
						
					case 3:
						damage *= 1.5;
						break;
						
					case 4:
						damage *= 1.5;
						break;
						
					case 5:
						damage *=2;
						effectDuration *= 2;
						break;

					default:
						break;
					}
					
					obstacle.suffer(damage, damageRange, criticalRate, this.element);

					switch(this.element){
					case Elements.FIRE:
						obstacle.dot(effectDuration, 400, 0.5 + 0.4 * factor,
									 damage / 4, damageRange, criticalRate,
									 this.element);
						break;
						
					case Elements.ICE:
						obstacle.slow(effectDuration, 0.5 + 0.4 * factor);
						break;

					default:
						obstacle.stun(effectDuration, 0.5 + 0.4 * factor);
						break;
					}
					

					this.alreadyHit.push(obstacle);
				}
			}

			createProjectile(this.game, 0, 0, "quake_0",
							 initProjectile2, undefined,
							 undefined, collideFunction2);

			this.kill();
		}

		var trap = createProjectile(this.game, 0, 0, "spikes_0",
									initProjectile, updateProjectile,
									killProjectile, collideFunction,
									collideProcess);

		this.onUncheckedCharge.add(explode, trap);

		this.onBreak.removeAll();

		this.user.can.move = true;
		this.user.can.action = true;
		this.user.current.action = null;
	}


	this.setChargeTime(2000);
	this.icon = "trap_icon";
}

TrapSkill.prototype = Object.create(Skill.prototype);
TrapSkill.prototype.constructor = TrapSkill;


var PoweredArrowSkill = function(user, level, targetTags){
	function costFunction(applyCost){
		if (this.user.allStats.quiver.canSubtract(5)){
			if (applyCost){
				this.user.allStats.quiver.subtract(5);
			}
			
			return true;
		}
		else{
			return false;
		}
	}

	Skill.call(this, user, level, costFunction, user.allStats.attackSpeed.get(),
			   Elements.PHYSIC, targetTags);

	var self = this;

	this.onCharge.add(function(){
		var animation = null;
		var user = this.user;
		var speed = 60 / (1 + this.user.allStats.attackSpeed.get()) * 200;
		
		function orient(direction){
			if (!user.can.orient){
				return;
			}

			if (user.orientationH != direction){
				user.orientationH *= -1;
				
				user.animations.currentAnim.stop();
				
				self.onBreak.addOnce(function(){
					this.user.can.orient = true;
				}, self);

				user.can.orient = false;
				
				var animationName = (direction >= 0) ? "bendBowRight" : "bendBowLeft";

				user.animations.play(animationName, speed)
					.onComplete.addOnce(
						function(){
							user.can.orient = true;

							self.onBreak.removeAll();
						}, this);
			}
		}

		user.orientLeft = function(){
			orient(-1);
		}

		user.orientRight = function(){
			orient(1);
		}

		user.orientationH *=-1;
		
		if (!user.orientationH){
			user.orientationH = -1;
		}

		if (user.orientationH > 0){
			user.orientLeft();
		}
		else{
			user.orientRight();
		}

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
		}, this)

		user.can.move = false;
	}, this);

	this.launchFunction = function(factor){
		if (!this.user.animations.currentAnim.isFinished){
			this.user.animations.currentAnim.onComplete.addOnce(
				function(){
					this.launchFunction.call(this, factor);
				}, this);
			return;
		}
		
		var user = this.user;
		var speed = 60 / (1 + this.user.allStats.attackSpeed.get()) * 200;

		function initProjectile(){
			var speed = -1600;

			this.anchor.set(0, 0.5);

			this.scale.setTo(1 + factor);
			
			this.x = user.x;
			this.y = user.y + user.width / 2;

			this.frame = 0;

			if (user.orientationH >= 0){
				this.x += user.width / 2;
				speed *= -1;

				this.frame = 1;
			}

			this.orientationH = user.orientationH;

			this.game.physics.enable(this, Phaser.Physics.ARCADE);
			this.body.allowGravity = true;

			this.body.velocity.y = -50 * (1 + factor);
			this.body.velocity.x = speed;

			this.lifespan = 2000;

			this.alpha = 1;

			this.tint = H_WHITE;

			this.alreadyHit = [];

			this.targetTags = self.targetTags;
			this.element = self.element;
		}

		function damageFunction(obstacle){
			// Les dégâts sont aussi en fonction de la distance parcourue.
			var damage = self.user.allStats.attack.get() *
				Math.pow((1 + factor + (1 - (this.lifespan - 1200) / 800)), 1.5);
			var damageRange = [0.9, 1.1];
			var criticalRate = self.user.allStats.criticalRate.get();

			if (this.alreadyHit.indexOf(obstacle) != -1){
				damage *= 0.5;
			} 
			
			obstacle.suffer(damage, damageRange, criticalRate, this.element);
		}

		function updateFunction(){
			if (this.lifespan < 1000){
				this.alpha = this.lifespan / 1000;
			}

			this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);

			if (this.orientationH < 0){
				this.angle += 180;
			}
		}

		function collideFunction(obstacle){
			if (obstacle.tag != "platform"){
				this.damageFunction(obstacle);
				this.alreadyHit.push(obstacle);
			}
			else{
				// Remplace la flêche par un sprite, parce que ça fait classe !

				var selfSprite = this.game.add.sprite(this.x, this.y, this.key);

				selfSprite.anchor.x = this.anchor.x;
				selfSprite.anchor.y = this.anchor.y;
				selfSprite.frame = this.frame;
				selfSprite.rotation = this.rotation;
				selfSprite.tint = this.tint;
				selfSprite.scale.x = this.scale.x;
				selfSprite.scale.y = this.scale.y;

				selfSprite.tween = this.game.add.tween(selfSprite)
					.to({alpha: 0}, 3000, Phaser.Easing.Quadratic.Out);

				selfSprite.tween.start();
				
				this.alreadyHit = [];
				this.kill();
			}
		}

		function collideProcess(obstacle){
			arrowElementChange.call(this, obstacle);

			return (this.targetTags.indexOf(obstacle.tag) != -1) &&
				this.body.allowGravity;
		}

		user.orientLeft = Hero.prototype.orientLeft;
		user.orientRight = Hero.prototype.orientRight;

		this.onBreak.removeAll();

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
			this.user.can.orient = true;
		}, this);
		
		user.can.orient = false;

		createProjectile(this.game, 0, 0, "arrow",
						 initProjectile, updateFunction, 
						 undefined, collideFunction,
						 collideProcess, damageFunction);

		this.timerEvade = this.game.time.create(true);

		var direction = -1;

		if (user.orientationH < 0){
			direction = 1;
		}

		this.timerEvade.repeat(17, 10, function(){
			var evadeThrust = direction * (7000 + (7000 * factor));

			user.body.velocity.x += evadeThrust;
		});

		this.timerEvade.repeat(17, 5, function(){
			var evadeThrust = (50 + (50 * factor));
			
			user.body.velocity.y = -evadeThrust;
		});

		this.timerEvade.onComplete.addOnce(function(){
			this.onBreak.remove(this.timerEvade.stop);
		}, this);

		this.timerEvade.start();

		this.onBreak.addOnce(this.timerEvade.stop, this.timerEvade);

		var animation = null;

		if (this.user.orientationH >= 0){
			animation = this.user.animations.play("unbendBowRight", speed);
		}
		else{
			animation = this.user.animations.play("unbendBowLeft", speed);
		}
		
		animation.onComplete.addOnce(function(){
			this.user.can.move = true;
			this.user.can.action = true;
			this.user.current.action = null;
			this.user.can.orient = true;

			this.onBreak.removeAll();
		}, this);
	}

	this.setChargeTime(5 * this.user.allStats.attackSpeed.get());
	this.icon = "poweredArrow_icon";
}

PoweredArrowSkill.prototype = Object.create(Skill.prototype);
PoweredArrowSkill.prototype.constructor = PoweredArrowSkill;

var ShieldSkill = function(user, level){
	function costFunction(applyCost){
		if (this.chargeTime.get()){
			return true;
		}

		if (this.user.allStats.special.canSubtract(5)){

			return true;
		}
		else{
			return false;
		}
	}

	Skill.call(this, user, level, costFunction, 0, Elements.ALMIGHTY);

	this.onUncheckedCharge.add(function(){
		if (!this.user.alive ||
			this.user._dying){
			return;
		}

		if ((this.user.current.action instanceof Skill) &&
		   !(this.user.current.action instanceof ShieldSkill)){
			this.user.animations.currentAnim.stop();
			this.user.current.action.breakSkill();
		}
	}, this);

	this.onCharge.add(function(){
		this.user.can.move = false;

		var immovable = this.user.body.immovable;

		this.user.body.immovable = true;

		this.user.animations.play("shieldBoth");

		this.user.allStats.special.subtract(5);

		this.user.allStats.defense.factor *= 2;

		for(var i = Elements.PHYSIC; i < Elements.ALMIGHTY; i++){
			if (this.user.allResistances[i] < 0){
				this.user.allResistances[i] /= 2;
			}
			else if (this.user.allResistances[i] < 1){
				this.user.allResistances[i] *= 2;
			}
		}

		for(var i = Disabilities.STUN; i <= Disabilities.SLOW; i++){
			if (this.user.allResistances[i] < 0){
				this.user.allResistances[i] /= 2;
			}
			else if (this.user.allResistances[i] < 1){
				this.user.allResistances[i] *= 2;
			}
		}

		this.onBreak.addOnce(function(){
			this.user.can.move = true;
			this.user.can.action = true;
			this.user.current.action = null;

			this.user.body.immovable = immovable;

			this.user.allStats.defense.factor /= 2;

			for(var i = Elements.PHYSIC; i < Elements.ALMIGHTY; i++){
				if (this.user.allResistances[i] < 0){
					this.user.allResistances[i] *= 2;
				}
				else if (this.user.allResistances[i] < 1){
					this.user.allResistances[i] /= 2;
				}
			}

			for(var i = Disabilities.STUN; i <= Disabilities.SLOW; i++){
				if (this.user.allResistances[i] < 0){
					this.user.allResistances[i] *= 2;
				}
				else if (this.user.allResistances[i] < 1){
					this.user.allResistances[i] /= 2;
				}
			}
		}, this);

		this.onUncheckedRelease.addOnce(function(){
			this.onBreak.dispatch(this);
		}, this);
	}, this);


	this.launchFunction = function(){
		this.onBreak.dispatch(this);

		this.onBreak.removeAll();

		this.user.can.action = true;
		this.user.current.action = null;
	}

	
	this.setChargeTime(1);
	this.icon = "shield_icon";
}

ShieldSkill.prototype = Object.create(Skill.prototype);
ShieldSkill.prototype.constructor = ShieldSkill;
/******************************************************************************/
/* Common Skills */
/*****************/
