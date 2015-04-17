/*************/
/* Interface */
/******************************************************************************/
var Interface = function(game, x, y, width, height, sprite){
	Phaser.Group.call(this, game);

	this.x = x;
	this.y = y;

	this.background = game.add.sprite(0, 0, sprite);
	this.background.width = width;
	this.background.height = height;

	this.add(this.background);

	this.width = width;
	this.height = height;

	this.onStartToggle = new Phaser.Signal();
	this.onEndToggle = new Phaser.Signal();
	
	this.onUpdate = new Phaser.Signal();

	this.onStartClose = new Phaser.Signal();
	this.onEndClose = new Phaser.Signal();

	this.toggleTimer = null;
	this.closeTimer = null;
	
	this.toggleAnimation = null;
	this.closeAnimation = null;

	this.state = Interface.State.CLOSED;

	this.visible = false;

	this.game.add.existing(this);
}

Interface.prototype = Object.create(Phaser.Group.prototype);
Interface.prototype.constructor = Interface;

Interface.State = {};

Interface.State.TOGGLED = 0;
Interface.State.TOGGLING = 1;
Interface.State.PAUSED = 2;
Interface.State.CLOSING = 3;
Interface.State.CLOSED = 4;

Interface.prototype.toggle = function(){
	this.visible = true;

	this.state = Interface.State.TOGGLED;

	this.onStartToggle.dispatch(this);

	this.onEndToggle.dispatch(this);
}

Interface.prototype.close = function(){
	this.visible = false;

	this.state = Interface.State.CLOSED;
	this.onStartClose.dispatch(this);
	this.onEndClose.dispatch(this);
}

Interface.prototype.kill = function(){
	this.destroy();
}

Interface.prototype.destroy = function(){
	this._del();

	Phaser.Group.prototype.destroy.call(this);
}

Interface.prototype._del = function(){
	this.onStartToggle.dispose();
	this.onStartToggle = null;

	this.onEndToggle.dispose();
	this.onEndToggle = null;

	this.onUpdate.dispose();
	this.onUpdate = null;

	this.onStartClose.dispose();
	this.onStartClose = null;

	this.onEndClose.dispose();
	this.onEndClose = null;

	this.toggleTimer.stop();
	this.toggleTimer = null;

	this.closeTimer.stop();
	this.closeTimer = null;

	this.toggleAnimation.stop();
	this.toggleAnimation = null;

	this.closeAnimation.stop();
	this.closeAnimation = null;
}
/******************************************************************************/
/* Interface */
/*************/
