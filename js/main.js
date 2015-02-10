var WHITE = "#ffffff";
var BLACK = "#000000";
var RED = "#ff0000";
var GREEN = "#00ff00";
var BLUE = "#0000ff";
var YELLOW = "#ffff00";
var PINK = "#ff00ff";
var ORANGE = "#ff9900";

var H_WHITE = 0xffffff;
var H_BLACK = 0x000000;
var H_RED = 0xff0000;
var H_GREEN = 0x00ff00;
var H_BLUE = 0x0000ff;
var H_YELLOW = 0xffff00;
var H_PINK = 0xff00ff;
var H_ORANGE = 0xff9900;

var FPS = 60.0;

var G_SQUARED = 96.2361;


var game = new Phaser.Game(800, 600, Phaser.AUTO, '',
                           {preload: preload, create: create, update: update});

function preload(){
	game.load.image("ground", "assets/platform.png");
	game.load.image("sky", "assets/background0_2.png");
	game.load.spritesheet("lucy", "assets/Lucy/SaraFullSheet.png", 64, 64);
	game.load.spritesheet("azra", "assets/dude.png", 32, 48);
}

function create(){
	ground = game.add.sprite(0, 525, "ground");

	sky = game.add.tileSprite(0, 0, 2000, game.cache.getImage('sky').height, 'sky');
	sky.scale.setTo(1, 0.5);

	lucy = new Lucy(99, 50, 100);
	lucy.scale.setTo(1);
	lucy.maxIntelligence = 200;
	lucy.intelligence = 200;
	lucy.levelUp(0);

	azra = new Azra(99, 100, 50);
	azra.maxStrength = 200;
	azra.strength = 200;
	azra.levelUp(0);
	azra.special = 0;

	console.log(lucy);
	console.log(azra);

	game.add.existing(lucy);
	game.add.existing(azra);
}

function update(){
	
}
