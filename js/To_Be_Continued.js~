BasicGame.ToBeContinued = function(game){
	
}

BasicGame.ToBeContinued.prototype.preload = function(){
	this.game.world.alpha = 1;

	GAME_COMPLETED = true;
}

BasicGame.ToBeContinued.prototype.create = function(){
	var centerX = this.game.camera.width / 2;
	var centerY = this.game.camera.height / 2;

	this.TOBECONTINUED = {
		text: null,
		tween: null
	};

	this.THANKYOUFORPLAYING = {
		text: null,
		tween: null
	};

	this.TOBECONTINUED.text = this.game.add.text(centerX, centerY, "TO BE CONTINUED...");
	this.TOBECONTINUED.text.fill = WHITE;
	this.TOBECONTINUED.text.alpha = 0;
	this.TOBECONTINUED.text.anchor.setTo(0.5);

	this.TOBECONTINUED.tween = this.game.add.tween(this.TOBECONTINUED.text)
		.to({alpha: 1}, 1000, Phaser.Easing.Exponential.Out)
		.to({alpha: 0}, 3000, Phaser.Easing.Quadratic.Out);

	this.THANKYOUFORPLAYING.text = this.game.add.text(centerX, centerY,
													  "Thank you for playing !");
	this.THANKYOUFORPLAYING.text.fill = WHITE;
	this.THANKYOUFORPLAYING.text.alpha = 0;
	this.THANKYOUFORPLAYING.text.anchor.setTo(0.5);

	this.THANKYOUFORPLAYING.tween = this.game.add.tween(this.THANKYOUFORPLAYING.text)
		.to({alpha: 0}, 8000)
		.to({alpha: 1}, 1000, Phaser.Easing.Exponential.Out)
		.to({alpha: 0}, 3000, Phaser.Easing.Exponential.In)
		.to({alpha: 0}, 2000);
	
	this.TOBECONTINUED.tween.start();
	this.THANKYOUFORPLAYING.tween.start();

	this.THANKYOUFORPLAYING.tween.onComplete.addOnce(function(){
		this.game.state.start("Boot");
	}, this);
}

