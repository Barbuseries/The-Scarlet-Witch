/**********/
/* Entity */
/******************************************************************************/
var Entity = function(game, x, y, spriteName, initFunction, updateFunction,
					  killFunction, tag){
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

	if (typeof(tag) != "string"){
		tag = "";
	}

	
	Phaser.Sprite.apply(this, [game, x, y, spriteName]);

	this.setInitFunction(initFunction);
	this.setUpdateFunction(updateFunction);
	this.setKillFunction(killFunction);

	this.onInit = new Phaser.Signal();
	this.onUpdate = new Phaser.Signal();
	this.onKill = new Phaser.Signal();

	this.onDestroy = new Phaser.Signal();

	this.tag = tag;
};

Entity.prototype = Object.create(Phaser.Sprite.prototype);
Entity.prototype.constructor = Entity;


Entity.prototype.init = function(){
	this.onInit.dispatch(this);

	if (this.initFunction != null){
		this.initFunction();
	}
}

Entity.prototype.update = function(){
	this.onUpdate.dispatch(this);

	if ((this.updateFunction != null) &&
	   (this.alive)){
		this.updateFunction();
	}

	Phaser.Sprite.prototype.update.apply(this);
}

// If killFunction returns true, kill the Entity.
Entity.prototype.kill = function(code){
	this.onKill.dispatch(this);

	if (this.killFunction != null){
		if (this.killFunction()){
			Phaser.Sprite.prototype.kill.call(this);
		}
	}
}


Entity.prototype.setInitFunction = function(initFunction){
	if (typeof(initFunction) != "function"){
		initFunction = null;
	}

	this.initFunction = initFunction;
}

Entity.prototype.setUpdateFunction = function(updateFunction){
	if (typeof(updateFunction) != "function"){
		updateFunction = null;
	}

	this.updateFunction = updateFunction;
}

Entity.prototype.setKillFunction = function(killFunction){
	if (typeof(killFunction) != "function"){
		killFunction = function(){
			return true;
		};
	}

	this.killFunction = killFunction;
}

Entity.prototype.destroy = function(){
	this.onDestroy.dispatch();

	this.onDestroy.dispose();
	this.onDestroy = null;
}
/******************************************************************************/
/* Entity */
/**********/
