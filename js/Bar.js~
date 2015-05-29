/*******/
/* Bar */
/******************************************************************************/
var Bar = function(game, manager, x, y, width, height, sprite, cursorSprite,
				   stat, horizontal){
	Phaser.Group.call(this, game);

	this.x = x;
	this.y = y;

	this.sprite = this.game.add.sprite(0, 0, sprite);
	this.sprite.height = height;
	this.sprite.width = width;
	this.add(this.sprite);

	this.sprite.inputEnabled = true;
	this.sprite.events.onInputDown.add(function(self, pointer){
		if (this.horizontal){
			this.stat.set((pointer.x - self.world.x) /
						  self.width, 1);
			this.stat.set(Math.ceil(this.stat.get()));
		}
		else{
			this.stat.set((pointer.y - self.world.y) /
						  self.height, 1);
			this.stat.set(Math.ceil(this.stat.get()));
		}
	}, this);
	
	this.manager = manager;
	this.width = width;
	this.height = height;

	this.cursorSprite = this.game.add.sprite(0, 0, cursorSprite);
	this.cursorSprite.anchor.setTo(0.5);
	
	this.add(this.cursorSprite);

	this.stat = stat;

	this.valueText = this.game.add.text(this.sprite.width * 1.1,
										this.sprite.height / 2,
										this.stat.get().toString());
	this.valueText.anchor.setTo(0.5);
	this.valueText.fill = WHITE;

	this.add(this.valueText);

	this.horizontal = horizontal;

	if (this.horizontal){
		this.hFactor = 1;

		this.vFactor = 0;

		this.cursorSprite.height = this.sprite.height * 2;
		this.cursorSprite.width = this.sprite.width /
			(this.stat.getMax() - this.stat._min);
	}
	else{
		this.hFactor = 0;

		this.vFactor = 1;

		this.cursorSprite.width = this.sprite.width * 2;
		this.cursorSprite.height = this.sprite.height /
			(this.stat.getMax() - this.stat._min);
	}

	this.fps = 30;

	this.stat.onUpdate.add(this.updateCursor, this);
	this.stat.onUpdate.add(this.updateValueText, this);

	this.updateCursor();

	this.active = false;

	this.stat.onDestroy.addOnce(this.destroy, this);
}

Bar.prototype = Object.create(Phaser.Group.prototype);
Bar.prototype.constructor = Bar;

Bar.prototype.updateCursor = function(){
	if (this.horizontal){
		this.cursorSprite.y = this.sprite.height / 2;

		this.cursorSprite.x = this.stat.get() / (this.stat.getMax() - this.stat._min) *
			this.sprite.width;
	}
	else{
		this.cursorSprite.x = this.sprite.width / 2;

		this.cursorSprite.y = this.stat.get() / (this.stat.getMax() - this.stat._min) *
			this.sprite.height;
	}
}

Bar.prototype.updateValueText = function(){
	this.valueText.text = this.stat.get().toString();
}

Bar.prototype.goRight = function(){
	this.stat.add(this.hFactor);
}

Bar.prototype.goLeft = function(){
	this.stat.subtract(this.hFactor);
}

Bar.prototype.goUp = function(){
	this.stat.add(this.vFactor);
}

Bar.prototype.goDown = function(){
	this.stat.subtract(this.vFactor);
}

Bar.prototype.start = function(){
	if (this.active){
		return;
	}

	this.manager.setTargetByTag(this, "movement", false, true);
	this.manager.enable("movement", false, true);
	this.manager.setSignalByTag("down", "movement", false, true);
	this.manager.setFpsByTag(this.fps, "movement", false, true);

	this.active = true;
}

Bar.prototype.stop = function(){
	if (!this.active){
		return;
	}

	this.manager.rollback(["target", "enabled", "signal", "fps"], "movement");

	this.active = false;
}

Bar.prototype.destroy = function(){
	this.stat.onUpdate.remove(this.updateCursor);
	this.stat.onUpdate.remove(this.updateValueText);

	Phaser.Group.prototype.destroy.call(this);
}
/******************************************************************************/
/* Bar */
/*******/
