var NPC = function(x, y, spritetesheet, name){
	if (typeof(x) != "number") x = 0;
	if (typeof(y) != "number") y = 0;
	if (typeof(spritesheet) != "string") spritesheet = null;
	if (typeof(name) != "string") name = "";

	Phaser.Sprite.call(this, game, x, y, spritesheet);
	
	this.name = name;
}

NPC.prototype = Object.create(Phaser.Sprite.prototype);
NPC.prototype.constructor = NPC;
