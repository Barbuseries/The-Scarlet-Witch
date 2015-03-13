BasicGame.Level1 = function(game){

}

BasicGame.Level1.prototype.preload = function(){
}

var map;

BasicGame.Level1.prototype.create = function (){
	//Chargement des propriétés du tilemap
	map = this.game.add.tilemap('level1');

	// Chargement du Tileset
	map.addTilesetImage('platforms', 'Level1_Tiles');

	this.game.platforms = map.createLayer('blockedLayer');

	BasicGame.player1.hero = this.game.add.sprite(0, 700 - 64, "lucy");
	BasicGame.player1.hero.animations.add("walkLeft", [118, 119, 120, 121, 122, 123, 124, 125], 15);
	BasicGame.player1.hero.animations.add("walkRight", [144, 145, 146, 147, 148, 149, 150, 151], 15);
	this.game.camera.follow(BasicGame.player1.hero);

}

BasicGame.Level1.prototype.update = function (){
	//Collision
	this.game.physics.arcade.collide(BasicGame.player1.hero, this.game.platforms);
}