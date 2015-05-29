/**************/
/* Checkpoint */
/******************************************************************************/
var CheckPoint = function(game, x, y, barton, lucy, spriteName, index)
{
	if (typeof(game) === "undefined"){
		return;
	}

	if (typeof(barton) != "object"){
		barton = {
			x: 0,
			y: 0
		};
	}

	if (typeof(y) != "number"){
		lucy = {
			x: 0,
			y: 0
		};
	}

	if (typeof(spriteName) != "string"){
		spriteName = "checkpoint_0";
	}

	if (typeof(index)){
		index = 0;
	}

	Phaser.Sprite.prototype.call(this, x, y, spriteName);

	this.barton = barton;
	this.lucy = lucy;

	this.index = index;

	this.tint = H_WHITE;
}

Checkpoint.prototype = Object.create(Phaser.Sprite.prototype);
Checkpoint.prototype.constructor = Checkpoint;
/******************************************************************************/
/* Checkpoint */
/**************/

