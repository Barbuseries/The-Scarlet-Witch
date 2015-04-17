var TextDamage = function (game, x, y){
	if (typeof(color) != "string") color = WHITE;

	if (typeof(direction) != "undefined") direction = 1;

	Phaser.Sprite.call(this, game, x, y, null);

	this.game.physics.enable(this, Phaser.Physics.ARCADE);
	
	this.anchor.setTo(0.5, 0.5);

	this.body.bounce.y = 0.5;
	this.body.velocity.y = -300;
	this.body.velocity.x = 50;

	if (Math.random()){
		this.body.velocity.x *= -1;
	}

	this.game.add.existing(this);
	
	BasicGame.pool.textDamage.add(this);
}

TextDamage.prototype = Object.create(Phaser.Sprite.prototype);
TextDamage.prototype.constructor = TextDamage;

TextDamage.prototype.update = function(){
	this.alpha = this.lifespan / 2500;
	
	if (this.body.onFloor()){
		this.body.velocity.x /= 2;
	}
}

TextDamage.prototype.kill = function(){
	this.text.destroy();
	this.text = null;

	Phaser.Sprite.prototype.kill.call(this);
}


function createTextDamage(game, x, y, value, color){
	var newTextDamage = null;

	if (BasicGame.pool.textDamage != null){
		var reusableSprite = BasicGame.pool.textDamage.getFirstDead();
	} 

	if (reusableSprite == null){
		newTextDamage = new TextDamage(game, x, y);
	}
	else{
		newTextDamage = reusableSprite;
		newTextDamage.revive();

		newTextDamage.x = x;
		newTextDamage.y = y;
	}

	newTextDamage.body.velocity.y = -300;
	newTextDamage.body.velocity.x = 50;

	newTextDamage.body.velocity.x *= (1 + Math.random() * 0.5);
	
	if (Math.random() > 0.5){
		newTextDamage.body.velocity.x *= -1;
	}
	
	newTextDamage.text = game.add.text(0, 0, Math.abs(value).toFixed(0).toString());

	newTextDamage.lifespan = 2500;

	newTextDamage.alpha = 1;

	var gradient = newTextDamage.text.context.createLinearGradient(0, 0, 0,
																   newTextDamage.text.height);

    gradient.addColorStop(0, color);   
    gradient.addColorStop(1, GREY);
	
	newTextDamage.text.font = "Arial";
	newTextDamage.text.fontWeight = "bold";
	newTextDamage.text.fontSize = 20;
	newTextDamage.text.stroke = BLACK;
	newTextDamage.text.strokeThickness = 3;
    newTextDamage.text.fill = gradient;
	
	newTextDamage.addChild(newTextDamage.text);

	return newTextDamage;
}
