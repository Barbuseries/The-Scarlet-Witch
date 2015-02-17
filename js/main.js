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
	game.load.image("ground2", "assets/platform2.png");
	game.load.image("sky", "assets/background0_2.png");
	game.load.spritesheet("lucy", "assets/Lucy/SaraFullSheet.png", 64, 64);
	game.load.spritesheet("azra", "assets/dude.png", 32, 48);
}

function create(){
	ground = game.add.sprite(0, 525, "ground");
	ground.scale.setTo(2, 1);

	sky = game.add.tileSprite(0, 0, 2000, game.cache.getImage('sky').height, 'sky');
	sky.scale.setTo(1, 0.5);

	textBox = new TextBox(0, 0, 800, 100, "ground2", "ground");
	textBox.outerBox.alpha = 0.4;
//	textBox.innerBox.alpha = 0;

	textBox.setMarginV(10);
	textBox.setMarginH(20);


	textBox.setY(500);
	textBox.setX(0);

	sentence = new Sentence("Il était une fois, dans un pays très, très, très, très, très, très, très, très, très, très, très, très, très, vide... Un jeu qui peut maintenant avoir des boîtes de dialogue.\nMagnifique, n'est-ce pas ?\nQui c'est qui se charge de faire tous les dialogues ?\nC'est pas moi !", -1, MOOD_NORMAL, -1, 24);

	sentence.textSpeedFactor = 20;
//	sentence.phaserText.align = "center";
	
	textBox.toggle(5000);
	textBox.addSentence(sentence);
//	textBox.nextLine();
}

function update(){
	textBox.update();
	
/*	if (textBox.displayState == TEXTBOX_TOGGLED){
		textBox.close(1500);
	}*/
}
