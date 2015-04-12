/********/
/* Hero */
/******************************************************************************/
var Hero = function(game, x, y, name, level, player){
	Mob.apply(this, [game, x, y, name.toLowerCase(), name, level, "hero"]);

	this.body.setSize(32, 48, 16, 16);

	this.currentMode = 0;
	
	this.player = player;

	this.player.controller.target = this;

	this.allStats.experience = new Stat(this, "Experience", STAT_NO_LINK, 0, 10);
	this.allStats.experience.onUpdate.add(function(stat, oldValue, newValue){
		if (this.get(1) == 1){
			this.entity.allStats.level.add(1);
		}
	}, this.allStats.experience);

	this.allStats.level.onUpdate.add(this.allStats.experience.grow,
									 this.allStats.experience);

	this.allStats.experience.setGrowth(function(){
		this.set(0);
		
		var level = this.entity.allStats.level.get();

		return (level == 99 ) ? 0 : this.entity.allStats.level.get() * 10;
	}, -1, [], true);

	this.onSwapMode = new Phaser.Signal();
}

Hero.prototype = Object.create(Mob.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.goLeft = function(control, factor){
	if (this._dying != false){
		return;
	}

	if (typeof(factor) === "undefined"){
        factor = 1;
    }

	this.orientationH = -1;

	var currentAnim = this.animations.currentAnim;

	if (!currentAnim.isRunning ||
		!booleanable(currentAnim.allowBreak) ||
		currentAnim.allowBreak){
		this.animations.play("walkLeft", 15 * Math.abs(factor));
	}

    this.body.acceleration.x -= this.ACCELERATION * Math.abs(factor);
}

Hero.prototype.goRight = function(control, factor){
	if (this._dying != false){
		return;
	}

    if (typeof(factor) === "undefined"){
        factor = 1;
    }

	this.orientationH = 1;

	var currentAnim = this.animations.currentAnim;

	if (!currentAnim.isRunning ||
		!booleanable(currentAnim.allowBreak) ||
		currentAnim.allowBreak){
		this.animations.play("walkRight", 15 * Math.abs(factor));
	}

    this.body.acceleration.x += this.ACCELERATION * Math.abs(factor);
}

Hero.prototype.jump = function(control, factor){
	if (this._dying != false){
		return;
	}
	
    if (typeof(factor) === "undefined"){
        factor = 1;
    }
	
	if (this.jumpCount > 0){
		if ((control.manager.type == CONTROL_GAMEPAD &&
			 control.inputGamepad.justPressed(250)) ||
			(control.manager.type == CONTROL_KEYBOARD &&
			 control.inputKeyboard.downDuration(250))){
			this.body.velocity.y = -this.JUMP_POWER;
		}
	}
}

Hero.prototype.reduceJump = function(control, factor){
	this.jumpCount--;
}

Hero.prototype.stopMovement = function(){
	if (this._dying != false){
		return;
	}

	if (this.orientationH == 1){
		this.animations.stop("walkRight");
		this.frame = 143;
	}
	else if (hero.orientationH == -1){
		this.animations.stop("walkLeft");
		this.frame = 117;
	}
	
	this.orientationV = 0;
}

Hero.prototype.swapMode = function(){
	if (this._dying != false){
		return;
	}

	this.currentMode = 1 * !this.currentMode;

	this.onSwapMode.dispatch(this);
}

var Lucy = function(game, x, y, level, player){
	Hero.apply(this, [game, x, y, "Lucy", level, player]);

	this.MAXJUMP = 2;
	
	this.currentMode = 1;

	this.allStats.mainStat.name = "Intelligence";

	this.allStats.health.setMax(30);
	this.allStats.health.setBasic(30);
	this.allStats.health.set(1, 1);
	this.allStats.health.setGrowth(function(){
		return this._basicValue + 5 * this.entity.allStats.level.get() +
			2 * this.entity.allStats.endurance.get();
	}, -1, [], true);

	this.allStats.special.name = "Mana";
	this.allStats.special.setMax(50);
	this.allStats.special.setBasic(50);
	this.allStats.special.set(1, 1);
	this.allStats.special.setGrowth(function(){
		return this._basicValue + 5 * this.entity.allStats.level.get() +
			5 * this.entity.allStats.mainStat.get();
	}, -1, [], true);
	this.allStats.mainStat.onUpdate.add(this.allStats.special.grow,
										this.allStats.special);


	this.allStats.attack.setBasic(2);
	this.allStats.attack.set(1, 1);
	this.allStats.attack.setGrowth(function(){
		return this._basicValue + this.entity.allStats.level.get() +
			0.3 * this.entity.allStats.mainStat.get();
	}, -1, [], true);


	this.allStats.defense.setGrowth(function(){
		return this._basicValue + 0.125 * this.entity.allStats.level.get() +
			0.1 * this.entity.allStats.endurance.get();
	}, -1, [], true);


	this.allStats.dodge.setBasic(5);
	this.allStats.dodge.set(1, 1);
	this.allStats.dodge.setGrowth(function(){
		return this._basicValue + 0.1 * this.entity.allStats.level.get() +
			0.5 * this.entity.allStats.agility.get();
	}, -1, [], true);


	this.allStats.criticalRate.setBasic(5);
	this.allStats.criticalRate.set(1, 1);
	this.allStats.criticalRate.setGrowth(function(){
		return this._basicValue + 0.125 * this.entity.allStats.level.get() +
			0.3 * this.entity.allStats.agility.get();
	}, -1, [], true);


	this.allStats.attackSpeed.setGrowth(function(){
		return this._basicValue - 4 * this.entity.allStats.level.get() -
			2 * this.entity.allStats.agility.get();
	}, -1, [], true);

	this.statusUi = new Status_UI(this.game, this, 0, 0);
	this.statusUi.profilSprite.frame = 26;
}

Lucy.prototype = Object.create(Hero.prototype);
Lucy.prototype.constructor = Lucy;

var Barton = function(game, x, y, level, player){
	Hero.apply(this, [game, x, y, "Barton", level, player]);

	this.JUMP_POWER = 250;

	this.allStats.mainStat.name = "Intelligence";
	this.allStats.special.destroy();

	this.allStats.health.setMax(40);
	this.allStats.health.setBasic(40);
	this.allStats.health.set(1, 1);
	this.allStats.health.setGrowth(function(){
		return this._basicValue + 10 * this.entity.allStats.level.get() +
			3 * this.entity.allStats.endurance.get();
	}, -1, [], true);

	this.allStats.fury = new Stat(this, "Fury", STAT_NO_LINK, 0, 100, 0, 100);
	
	this.allStats.quiver = new Stat(this, "Quiver", STAT_NO_LINK, 10);
	
	this.allStats.attack.setBasic(5);
	this.allStats.attack.set(1, 1);
	this.allStats.attack.setGrowth(function(){
		return this._basicValue + this.entity.allStats.level.get() +
			0.5 * this.entity.allStats.mainStat.get();
	}, -1, [], true);


	this.allStats.defense.setGrowth(function(){
		return this._basicValue + 0.5 * this.entity.allStats.level.get() +
			0.1 * this.entity.allStats.endurance.get();
	}, -1, [], true);

	this.allStats.dodge.setBasic(2);
	this.allStats.dodge.set(1, 1);
	this.allStats.dodge.setGrowth(function(){
		return this._basicValue + 0.1 * this.entity.allStats.level.get() +
			0.2 * this.entity.allStats.agility.get();
	}, -1, [], true);

	this.allStats.criticalRate.setBasic(5);
	this.allStats.criticalRate.set(1, 1);
	this.allStats.criticalRate.setGrowth(function(){
		return this._basicValue + 0.125 * this.entity.allStats.level.get() +
			0.3 * this.entity.allStats.agility.get();
	}, -1, [], true);

	this.allStats.attackSpeed.setGrowth(function(){
		return this._basicValue - 4 * this.entity.allStats.level.get() -
			2 * this.entity.allStats.agility.get();
	}, -1, [], true);

	this.statusUi = new Status_UI(this.game, this, 0, 0, true);
	this.statusUi.profilSprite.frame = 26;

	this.onSwapMode.add(function(){
		this.specialBar.visible = false;
		
		if (this.specialBar == this._specialBar1){
			this.specialBar = this._specialBar2;
		}
		else{
			this.specialBar = this._specialBar1;
		}

		this.specialBar.visible = true;
	}, this.statusUi);
}

Barton.prototype =  Object.create(Hero.prototype);
Barton.prototype.constructor = Barton;

Barton.prototype.castFirst = function(){
	if (this.currentMode == 0){
		this.player.controller.disable(["movement", "action"]);

		if (this.orientationH >= 0){
			this.animations.play("swordRight").onComplete.addOnce(function(){
				this.enable(["movement", "action"]);
			}, this.player.controller);	
		}
		else{
			this.animations.play("swordLeft").onComplete.addOnce(function(){
				this.enable(["movement", "action"]);
			}, this.player.controller);
		}
	}
	else if (this.currentMode == 1){
		this.player.controller.disable(["movement", "action"]);

		if (this.orientationH >= 0){
			this.animations.play("bowRight").onComplete.addOnce(function(){
				this.enable(["movement", "action"]);
			}, this.player.controller);		
		}
		else{
			this.animations.play("bowLeft").onComplete.addOnce(function(){
				this.enable(["movement", "action"]);
			}, this.player.controller);	
		}
	}
}

Barton.prototype.castSecond = function(){
	
}
/******************************************************************************/
/* Hero */
/********/
