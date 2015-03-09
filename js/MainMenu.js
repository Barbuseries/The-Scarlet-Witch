BasicGame.MainMenu = function(game){
    this.music = null;
};

BasicGame.MainMenu.prototype.create = function(){
	var centerX = this.game.camera.width / 2;
	var centerY = this.game.camera.height / 2;

	this.background = this.game.add.tileSprite(0, 0,
											   2 * centerX,
											   this.game.cache.getImage("sky").height,
											   "sky");
	this.background.scale.y = this.background.height / (2 * centerX - 10);

	this.ground = this.add.sprite(0, 2 * centerY - 10, "ground");
	this.ground.width = 2 * centerX;
	this.ground.height = 10;
	
	this.logo = this.game.add.sprite(centerX, 100, "logo");

	this.logo.scale.setTo(0.5);
	this.logo.anchor.setTo(0.5);

	

	this.newGameText = this.createOption(300, "Nouvelle Partie", this.startGame, this);
	this.loadGameText = this.createOption(400, "Charger Partie");
	this.optionText = this.createOption(500, "Options");
	this.exitText = this.createOption(600, "Quitter", this.exit, this);
}

BasicGame.MainMenu.prototype.update = function(){
	this.background.tilePosition.x -= 1;
}

BasicGame.MainMenu.prototype.startGame = function(pointer){
	this.disableOptions();

	this.cleanUp();

	this.state.start("Game");
}

BasicGame.MainMenu.prototype.disableOptions = function(){
	this.newGameText.inputEnabled = false;
	this.loadGameText.inputEnabled = false;
	this.optionText.inputEnabled = false;
	this.exitText.inputEnabled = false;
}

BasicGame.MainMenu.prototype.cleanUp = function(){
	this.newGameText.destroy();
	this.loadGameText.destroy();
	this.optionText.destroy();
	this.exitText.destroy();
}

BasicGame.MainMenu.prototype.exit = function(){
	this.disableOptions();

	this.cleanUp();

	window.location.replace("site.html");
}

BasicGame.MainMenu.prototype.createOption = function(y, string, onClickFunction,
													 context){
	var style = { font: "30px Arial", fill: "#ffffff"};

	var newOption = this.game.add.text(this.game.camera.width / 2, y,
									   string, style);
	
	newOption.fontWeight = "bold";

    newOption.strokeThickness = 6;

	newOption.anchor.setTo(0.5);
	
	newOption.inputEnabled = true;

	newOption.events.onInputOver.add(function(){
		this.scale.setTo(1.5);
		//this.fill = "#ffff33";
		this.stroke = '#ff0000';
	}, newOption);

	newOption.events.onInputOut.add(function(){
		this.scale.setTo(1)
		this.fill = "#ffffff";
		this.stroke = '#000000';
	}, newOption);

	if (typeof(onClickFunction) != "undefined"){
		newOption.events.onInputDown.add(onClickFunction, context);
	}

	return newOption;
}
