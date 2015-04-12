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

	this.onCharge = new Phaser.Signal();
	this.onChargeComplete = new Phaser.Signal();
	this.onRelease = new Phaser.Signal();

	this.chargeCompleted = false;

	this.onUse = new Phaser.Signal();
	this.onFailedUse = new Phaser.Signal();

	this.cooldownBar = null;
	this.chargeBar = null;

	this.icon = null;
}

Skill.Fail = {};

Skill.Fail.NO_USER = 0;
Skill.Fail.COOLDOWN = 1;
Skill.Fail.COST = 2;

Skill.prototype.useSkill = function(factor){
	if (typeof(factor) === "undefined"){
		factor = 0;
	}

	if (this.user == null){
		this.onFailedUse.dispatch(this, Skill.Fail.NO_USER);
		
		return false;
	}
	
	if (!this.canBeUsed){
		this.onFailedUse.dispatch(this, Skill.Fail.COOLDOWN);
		
		return false;
	}
	
	if (this.costFunction(this, 1)){
		if (typeof(this.launchFunction) === "function"){
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
	if (this.canBeUsed){
		if (!this.chargeTime.get()){
			this.onCharge.dispatch(this);
		}

		if ((this.chargeTime._link != STAT_NO_MAXSTAT) &&
			 this.chargeTime.get(1) == 1){
			this.onChargeComplete.dispatch(this);

			this.chargeTime.set(0);

			this.chargeCompleted = false;
			
			this.useSkill();
		}
		
		this.chargeTime.add(1000 / 60);

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
	if (this.canBeUsed){
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
							 BasicGame.pool.fireExplosion,
							 function(){initExplosion.call(this, x, y)});

			return true;
		}

		function collideFunction(obstacle){
			if (obstacle.tag != "platform"){
				this.damageFunction(obstacle);
			}

			this.kill();
		}

		function collideProcess(obstacle){
			return ((this.targetTags.indexOf(obstacle.tag) != -1) ||
					(obstacle.tag == "platform"));
		}

		function damageFunction(obstacle){
			var damage = self.user.allStats.attack.get() * (1 + factor);
			var damageRange = [0.9, 1.1];
			var criticalRate = self.user.allStats.criticalRate.get();
			
			obstacle.suffer(damage, damageRange, criticalRate, this.element);
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

		this.user.player.controller.disable(["movement", "action"]);
		
		createProjectile(this.game, 0, 0, "fireball_0", BasicGame.pool.fire,
						 initProjectile, updateProjectile, killProjectile,
						 collideFunction, collideProcess, damageFunction);
		
		var animation = null;

		if (this.user.orientationH >= 0){
			animation = this.user.animations.play("spellCastRight");
		}
		else{
			animation = this.user.animations.play("spellCastLeft");
		}

		animation.onComplete.addOnce(function(){
			this.user.player.controller.enable(["movement", "action"]);
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

			this.game.physics.enable([this], Phaser.Physics.ARCADE);
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
							 BasicGame.pool.iceExplosion,
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
		    this.animations.add("explosionAnimation", [1, 2, 3, 4, 5, 6, 7, 8]);
		    this.animations.play("explosionAnimation", null, false, true);

		    BasicGame.sfx.EXPLOSION_0.play();
		}

		function damageFunction(obstacle){
			var damage = 0;
			var userAttack = self.user.allStats.attack.get();

			switch(self.level){
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

			var damageRange = [0.9, 1.1];
			var criticalRate = self.user.allStats.criticalRate.get();
			
			obstacle.suffer(damage * (1 + factor), damageRange, criticalRate,
							this.element);
		}

		this.user.player.controller.disable(["movement", "action"]);

		createProjectile(this.game, 0, 0, "iceball_0", BasicGame.pool.ice,
						 initProjectile1, updateProjectile, killProjectile,
						 collideFunction, undefined, damageFunction);
		
		if (factor >= 0.5){
			createProjectile(this.game, 0, 0, "iceball_0", BasicGame.pool.ice,
							 initProjectile2, updateProjectile, killProjectile,
							 collideFunction, undefined, damageFunction);
		}

		var animation = null;
		
		if (this.user.orientationH >= 0){
			animation = this.user.animations.play("spellCastRight");
		}
		else{
			animation = this.user.animations.play("spellCastLeft");
		}
		
		animation.onComplete.addOnce(function(){
			this.user.player.controller.enable(["movement", "action"]);
		}, this);
	};
	
	this.icon = "iceball_icon";
};

IceBallSkill.prototype = Object.create(Skill.prototype);
IceBallSkill.prototype.constructor = IceBallSkill;

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

            this.lifespan = 500;
			this.maxLifespan = this.lifespan;
            
            if (user.orientationH >= 0) {
                this.x += user.width / 2;
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
				.to({alpha : 1}, this.lifespan / 2, Phaser.Easing.Elastic.Out);

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
			this.scale.x = (this.maxLifespan - this.lifespan) / 300;
			
			this.x = user.x;

			if (user.orientationH >= 0) {
                this.x += user.width / 2;
            }

			this.y = user.y + user.height * 0.65;
        }

        function killProjectile() {
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
            return ((this.alpha >= 0.5) && (this.alpha <= 1)) &&
				((this.targetTags.indexOf(obstacle.tag) != -1) ||
				 (obstacle.tag == "platform"));
        }

        function damageFunction(obstacle) {
			var damage = 0;
            var userAttack = self.user.allStats.attack.get();
            var damageRange = [0.9, 1.1];
            var criticalRate = self.user.allStats.criticalRate.get();

			switch(self.level){
			case 1:
				damage = 2 * userAttack / 5;
				break;
				
			case 2:
				damage = 2 * userAttack / 5;
				break;

			case 3:
				damage = 2.5 * userAttack / 5;
				break;

			case 4:
				damage = 2.5 * userAttack / 5;
				break;
			
			case 5:
				damage = 3 * userAttack / 5;
				break;

			default:
				damage = 0;
				break;
			}
			
            obstacle.suffer(damage, damageRange, criticalRate, this.element);
        }

        this.user.player.controller.disable(["movement", "action"]);

        var animation = null;
		
		if (factor < 0.5){
			if (this.user.orientationH >= 0){
				createProjectile(this.game, 0, 0, "thunder_0", BasicGame.pool.thunder,
						 initProjectile1, updateProjectile, killProjectile,
						 collideFunction, collideProcess, damageFunction);

				animation = this.user.animations.play("spellCastRight");
			}
			else{
				createProjectile(this.game, 0, 0, "thunder_0", BasicGame.pool.thunder,
								 initProjectile2, updateProjectile, killProjectile,
								 collideFunction, collideProcess, damageFunction);

				animation = this.user.animations.play("spellCastLeft");
			}
		}
		else{
			createProjectile(this.game, 0, 0, "thunder_0", BasicGame.pool.thunder,
							 initProjectile1, updateProjectile, killProjectile,
							 collideFunction, collideProcess, damageFunction);
			
			createProjectile(this.game, 0, 0, "thunder_0", BasicGame.pool.thunder,
							 initProjectile2, updateProjectile, killProjectile,
							 collideFunction, collideProcess, damageFunction);
			
			animation = this.user.animations.play("spellCastBoth");
		}
			
		animation.onComplete.addOnce(function(){
			this.user.player.controller.enable(["movement", "action"]);
		}, this);
    };

    this.icon = "thunder_icon";
}

ThunderSkill.prototype = Object.create(Skill.prototype);
ThunderSkill.prototype.constructor = ThunderSkill;
/******************************************************************************/
/* Common Skills */
/*****************/
