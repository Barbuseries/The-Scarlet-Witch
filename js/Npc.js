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
	this.animations.add("spellChargeLeft", [14, 15, 16], 8)
		.allowBreak = false;
	this.animations.add("spellChargeRight", [40, 41, 42], 8)
		.allowBreak = false;
	this.animations.add("spellChargeBoth", [26, 27, 28], 8)
		.allowBreak = false;
	this.animations.add("spellReleaseLeft", [17, 18, 19, 13], 15)
		.allowBreak = false;
	this.animations.add("spellReleaseRight", [43, 44, 45, 39], 15)
		.allowBreak = false;
	this.animations.add("spellReleaseBoth", [29, 30, 32, 26], 15)
		.allowBreak = false;
	this.animations.add("shieldBoth", [78, 79, 80, 81, 82, 83, 84, 85], 15);
	/**************/
	/* A tester ! */
	/******************************************************************************/
	this.animations.add("thrustLeft", [66, 67, 68, 69, 70, 71, 72, 65], 15);
	this.animations.add("thrustRight", [92, 93, 94, 95, 96, 97, 98, 91], 15);
	/******************************************************************************/
	this.animations.add("swordRight", [195, 196, 197, 198, 199, 200, 200, 195], 15)
		.allowBreak = false;
	this.animations.add("swordLeft", [169, 170, 171, 172, 173, 174, 174, 169], 15)
		.allowBreak = false;
	this.animations.add("bendBowLeft", [221, 222, 223, 224, 225, 226, 227, 228, 229],
						15)
		.allowBreak = false;
	this.animations.add("unbendBowLeft", [230, 231, 232, 233, 221], 15)
		.allowBreak = false;
	this.animations.add("bendBowRight", [247, 248, 249, 250, 251, 252, 253, 254, 255],
						15)
		.allowBreak = false;
	this.animations.add("unbendBowRight", [256, 257, 258, 259, 247], 15)
		.allowBreak = false;
	this.animations.add("fullBowRight", [247, 248, 249, 250, 251, 252, 253, 254, 255,
										 256, 257, 258, 259, 247], 15)
		.allowBreak = false;

	this.animations.add("death", [260, 261, 262, 264], 5)
		.allowBreak = false;

	this.animations.add("idle", [26])
		.allowBreak = true;
	
	this.name = name;

	this.orientationH = 0;
	this.orientationV = 0;

	this.game.physics.enable(this, Phaser.Physics.ARCADE);

	this._cached = {
		velocity: {
			x: 0,
			y: 0
		},
		
		acceleration: {
			x: 0,
			y: 0
		}
	};

	this.can = {
		move: true,
		orient: true,
		jump: true,
		action: true
	};

	this.current = {
		move: null,
		action: null
	};

	this.allTimers = {
		follow: null
	};

	this.path = null;
	this.target = null;

	this.onMovement = new Phaser.Signal();
	this.onDeath = new Phaser.Signal();
	this.onFollow = new Phaser.Signal();

	this._dying = false;

	this.animations.play("idle");
}

Npc.prototype = Object.create(Entity.prototype);
Npc.prototype.constructor = Entity;

Npc.prototype.goLeft = function(control, factor){
	if (this._dying){
		return;
	}

	if (!this.can.move){
		this.orientLeft();
		
		return;
	}

	if (typeof(factor) != "number"){
        factor = 1;
    }

	if (control instanceof Control){
		factor = 1;
	}
	
	this.body.maxVelocity.x = this.SPEED * Math.abs(factor);

	this.orientationH = -1;

	var currentAnim = this.animations.currentAnim;

	if (!currentAnim.isRunning ||
		!booleanable(currentAnim.allowBreak) ||
		currentAnim.allowBreak){
		this.animations.play("walkLeft", 15 * Math.abs(factor));
	}

    this.body.acceleration.x -= this.ACCELERATION * Math.abs(factor);

	this.onMovement.dispatch();
}

Npc.prototype.goRight = function(control, factor){
	if (this._dying){
		return;
	}

	if (!this.can.move){
		this.orientRight();
		
		return;
	}

    if (typeof(factor) != "number"){
        factor = 1;
    }

	if (control instanceof Control){
		factor = 1;
	}

	this.body.maxVelocity.x = this.SPEED * Math.abs(factor);

	this.orientationH = 1;

	var currentAnim = this.animations.currentAnim;

	if (!currentAnim.isRunning ||
		!booleanable(currentAnim.allowBreak) ||
		currentAnim.allowBreak){
		this.animations.play("walkRight", 15 * Math.abs(factor));
	}

    this.body.acceleration.x += this.ACCELERATION * Math.abs(factor);

	this.onMovement.dispatch();
}

Npc.prototype.orientLeft = function(){
	if (this._dying){
		return;
	}

	if (!this.can.orient){
		return;
	}

	if (this.orientationH >= 0){
		this.orientationH = -1;

		this.frame = 117;
	}
	/*var index = -1;
	var currentAnim = this.animations.currentAnim;
	
	if ((index = currentAnim.name.indexOf("Right")) > -1){
		var name = currentAnim.name.slice(0, index) + "Left";

		currentAnim.complete();

		this.animations.play(name, currentAnim.speed, currentAnim.loop,
							 currentAnim.killOnComplete);
	}*/
}

Npc.prototype.orientRight = function(){
	if (this._dying){
		return;
	}

	if (!this.can.orient){
		return;
	}

	if (this.orientationH < 0){
		this.orientationH = 1;

		this.frame = 143;
	}
	/*var index = -1;
	var currentAnim = this.animations.currentAnim;

	if ((index = currentAnim.name.indexOf("Left")) > -1){
		var name = currentAnim.name.slice(0, index) + "Right";

		this.animations.play(name, currentAnim.speed, currentAnim.loop,
							 currentAnim.killOnComplete);
	}*/
}

Npc.prototype.findPath = function(startX, startY, endX, endY, callback){
	var self = this;

	this.pathFinder.findPath(startX, startY, endX, endY, function(path){
		self.path = (path != null) ? path : self.path;
		
		if (typeof(callback) == "function"){
			callback.call(this, path);
		}
	});
} 

Npc.prototype.followPath = function(){
	if (this.path == null ||
		this.path.length == 0){
		return;
	}

	var nextTile = this.path[0];


	if (this.y > nextTile.y * 32){
		this.jump(1.5);
	}

	if (Math.abs(this.x - (nextTile.x  * 32)) < 32){
		this.path.shift();
	}
	else{
		if (this.x < nextTile.x * 32){
			this.goRight();
		}
		else{
			this.goLeft();
		}
	}

	if (this.path.length == 0){
		this.path = null;
	}

	this.onFollow.dispatch(this);
}

Npc.prototype.follow = function(target, tickRecompute){
	this.unFollow();

	if (!(target instanceof Npc)){
		return;
	}

	if (typeof(tickRecompute) === "undefined"){
		tickRecompute = 1000;
	}

	this.target = target;
	
	function followTarget(iter, myTile, targetTile){
		if (this.target == null){
			this.unFollow();

			return;
		}

		if (typeof(iter) === "undefined"){
			iter = 0;
		}

		//console.log(iter);

		if (iter > 2){
			return;
		}

		if ((typeof(myTile) === "undefined") ||
			(myTile == null) ||
			(BasicGame.level._grid[myTile.y][myTile.x] < 0)){
			myTile = getTileWorldXY(0, this.x, this.y + iter * 32);
		}

		if ((typeof(targetTile) === "undefined") ||
			(targetTile == null) ||
			(BasicGame.level._grid[targetTile.y][targetTile.x] < 0)){
			targetTile = getTileWorldXY(0, this.target.x, this.target.y + iter * 32);
		}

		if (((myTile == null) || (targetTile == null)) ||
			((BasicGame.level._grid[myTile.y][myTile.x] < 0) ||
			 (BasicGame.level._grid[targetTile.y][targetTile.x] < 0))){
			iter++;

			followTarget.call(this, iter, myTile, targetTile);
			return;
		}

		this.findPath(myTile.x, myTile.y, targetTile.x, targetTile.y, function(path){
			//console.log(iter, path);
		});

		this.pathFinder.calculate();
	}

	this.allTimers.follow = this.game.time.create(false);
	this.allTimers.follow.loop(tickRecompute, followTarget, this);

	followTarget.call(this);

	this.onUpdate.add(this.followPath, this);

	this.allTimers.follow.start();
}

Npc.prototype.getNearestTarget = function(tag, distanceSquared){
	if (typeof(tag) === "undefined"){
		tag = (this.tag == "enemy") ? "hero" : "enemy";
	}

	if (typeof(distanceSquared) === "undefined"){
		distanceSquared = 1000 * 1000;
	}


	var target = null;

	if (tag == "hero"){
		var min = distanceSquared;

		BasicGame.level.allHeroes.forEachAlive(function(item){
			if (item != this){
				var distanceSquared = (item.x - this.x) * (item.x - this.x) +
					(item.y - this.y) * (item.y - this.y);

				if (distanceSquared < min){
					target = item;

					min = distanceSquared;
				}
			}
		}, this);
	}
	else if (tag == "enemy"){
		var min = distanceSquared;

		BasicGame.level.allEnemies.forEachAlive(function(item){
			if (item != this){
				var distanceSquared = (item.x - this.x) * (item.x - this.x) +
					(item.y - this.y) * (item.y - this.y);

				if (distanceSquared < min){
					target = item;

					min = distanceSquared;
				}
			}
		}, this);
	}

	return target;
}

Npc.prototype.followNearest = function(tag, tickRecompute, distanceSquared){
	if (typeof(tickRecompute) === "undefined"){
		tickRecompute = 1000;
	}

	function changeTarget(){
		var target = this.target;

		this.target = this.getNearestTarget(tag, distanceSquared);
	}
	
	function followNearestTarget(iter, myTile, targetTile){
		if (this.target == null){
			return;
		}

		if (typeof(iter) === "undefined"){
			iter = 0;
		}

		//console.log(iter);

		if (iter > 5){
			return;
		}

		if ((typeof(myTile) === "undefined") ||
			(myTile == null) ||
			(BasicGame.level._grid[myTile.y][myTile.x] < 0)){
			myTile = getTileWorldXY(0, this.x, this.y + iter * 32);
		}

		if ((typeof(targetTile) === "undefined") ||
			(targetTile == null) ||
			(BasicGame.level._grid[targetTile.y][targetTile.x] < 0)){
			targetTile = getTileWorldXY(0, this.target.x, this.target.y + iter * 32);
		}

		if (((myTile == null) || (targetTile == null)) ||
			((BasicGame.level._grid[myTile.y][myTile.x] < 0) ||
			 (BasicGame.level._grid[targetTile.y][targetTile.x] < 0))){
			iter++;

			followNearestTarget.call(this, iter, myTile, targetTile);
			return;
		}

		this.findPath(myTile.x, myTile.y, targetTile.x, targetTile.y, function(path){
			//console.log(iter, path);
		});

		this.pathFinder.calculate();
	}

	this.unFollow();

	this.allTimers.follow = this.game.time.create(false);
	this.allTimers.follow.loop(tickRecompute, changeTarget, this);
	this.allTimers.follow.loop(tickRecompute, followNearestTarget, this);
	
	changeTarget.call(this);
	followNearestTarget.call(this);

	this.onUpdate.add(this.followPath, this);

	this.allTimers.follow.start();
}

Npc.prototype.startIA = function(tag){
	this.followNearest(tag);

	this.IAActive = true;
}

Npc.prototype.stopIA = function(){
	this.unFollow();

	this.IAActive = false;
}

Npc.prototype.unFollow = function(){
	if (this.allTimers.follow == null){
		return;
	}

	this.allTimers.follow.stop();
	this.allTimers.follow.destroy();
	this.allTimers.follow = null;

	this.onFollow.removeAll();
	
	this.onUpdate.remove(this.followPath);
	this.path = null;
	//this.target.onMovement.remove(followTarget);
}

Npc.prototype.kill = function(){
	this._dying = false;
	
	this.unFollow();
	
	Entity.prototype.kill.call(this);
}

Npc.prototype.die = function(){
	this.onDeath.dispatch(this);

	this.unFollow();

	this.animations.play("death", null, false, true);
	this._dying = true;

	if (this.textBox != null){
		this.textBox.destroy();
		this.textBox = null;
		
		this.UNBIASED_OPION.destroy();
		this.UNBIASED_OPION = null;
	}

	// To make sure the Npc is really killed (there may be some
    // conflicts with some animations).
	var deathTimer = this.game.time.create(true);

	deathTimer.add(4 / 5 * 1000, function(){
		if (this.alive){
			this.kill();
		}
	}, this);

	deathTimer.start();
}

Npc.prototype.KONAMICODE = function(){
	var textBox = new TextBox(this.game, this.x + this.width, this.y - 90,
							  100, 90, "ground2", "ground2");

	var UNBIASED_OPION = new Sentence(this.game, "IS3N 4 EVA !!", MOOD_FRIGHTENED,
									  this.name, 10, -1, 90);
	UNBIASED_OPION.phaserText.align = "doublecenter";
	UNBIASED_OPION._RAINBOW_INDEX = 0;

	textBox.addSentence(UNBIASED_OPION);
	textBox.innerBox.tint = H_GREY;
	textBox.setMarginH(5, 5, 1);
	textBox.setMarginV(5, 5, 1);

	textBox.createAnimation("toggle", "right", "up", 1000, 1,
							Phaser.Easing.Quadratic.Out);
	textBox.createAnimation("close", "left", "down", 1000, 1,
							Phaser.Easing.Quadratic.Out);

	textBox.fitWidthToSentence(0, -1, 2, 100);
	textBox.fitDurationToSentence(0, 2000);

	textBox.toggle();

	var PERFECT_TWEEN = this.game.add.tween(UNBIASED_OPION.phaserText)
		.to({_RAINBOW_INDEX: 10}, 500)
		.to({_RAINBOW_INDEX: 0}, 500)
		.to({_RAINBOW_INDEX: 10}, 1000, Phaser.Easing.Linear.None)
		.to({_RAINBOW_INDEX: 0}, 1000, Phaser.Easing.Linear.None);

	PERFECT_TWEEN.onUpdateCallback(function(){
		switch(Math.floor(this._RAINBOW_INDEX)){
		case 0:
			this.fill = WHITE;
			break;

		case 1:
			this.fill = BLACK;
			break;
		
		case 3:
			this.fill = RED;
			break;
		
		case 4:
			this.fill = GREEN;
			break;
		
		case 5:
			this.fill = BLUE;
			break;
		
		case 6:
			this.fill = YELLOW;
			break;

		case 7:
			this.fill = PINK;
			break;
			
		case 8:
			this.fill = ORANGE;
			break;

		case 9:
			this.fill = GREY;
			break;

		case 10:
			this.fill = PURPLE;
			break;
		}
	}, UNBIASED_OPION.phaserText);

	PERFECT_TWEEN.start();
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
