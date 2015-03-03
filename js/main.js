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
	/*ground = game.add.sprite(0, 525, "ground");
	ground.scale.setTo(2, 1);

	sky = game.add.tileSprite(0, 0, 2000, game.cache.getImage('sky').height, 'sky');
	sky.scale.setTo(1, 0.5);

	textBox = new TextBox(game, 100, 100, 500, 100, "ground2", "ground", true);
	textBox.outerBox.alpha = 0.4;
	textBox.innerBox.alpha = 1;

	textBox.setMarginV(10, 10);
	textBox.setMarginH(10, 10);

	textBox.y = 200;
	textBox.x = 150;
	
	toto = {};
	toto.name = "Toto";
	toto.dialogueAlign = "left";

	tata = {};
	tata.name = "Tata";
	tata.dialogueAlign = "right";

	sentence = new Sentence(game, "Il était une fois, dans un pays très, très, très, très, très, très, très, très, très, très, très, très, très, vide... Un jeu qui peut maintenant avoir des boîtes de dialogue.\nMagnifique, n'est-ce pas ?\nQui c'est qui se charge de faire tous les dialogues ?\nC'est pas moi !", MOOD_NORMAL, toto, 100);
	
	sentence2 = new Sentence(game, "Ca marche !", MOOD_JOYFUL, null, 10);
	sentence3 = new Sentence(game, "Moi aussi !", MOOD_ANGRY);
	sentence4 = new Sentence(game, "Je me meurs... Arg.... Je... vais... mourir....\nEcoute... b...ien ce que... je... vais te d...ire...\nJe suis mort...\nAdieu...",
							 MOOD_DYING);
	sentence5 = new Sentence(game, "Hey ! C'est pas la classe ?!", MOOD_ANGRY, tata,
							 20);

	//sentence.phaserText.align = "center";

	
	textBox.addSentence(sentence, -1, 1);

	textBox.addSentence(sentence5);
	textBox.fitHeightToSentence(0, -1, 1);
	//textBox.addSentence(sentence3, 1000, 1);
	//textBox.addSentence(sentence4);
	
	textBox.createAnimation("toggle", "both", "both", 2000, 1, Phaser.Easing.Cubic.InOut);
	textBox.createAnimation("close", "both", "both", 2000, 1, Phaser.Easing.Cubic.InOut);

//	textBox.fitDurationToSentence(0, 1000);
	//textBox.createVerticalClose(1000, 0, Phaser.Easing.Bounce.Out);

//	textBox.createToggleTimer(1);
	//textBox.onEndClose.add(textBox.clear, textBox);

	//textBox.toggle();
	
	sentence6 = new Sentence(game, "La boîte de dialogue est fonctionnelle !",
							 MOOD_NORMAL, toto);

	sentence7 = new Sentence(game, "Maintenant, je peux me parler à moi même !",
							 MOOD_JOYFUL, toto);

	sentence8 = new Sentence(game, "Ou avec d'autres personnes !", MOOD_JOYFUL, tata);

	sentence9 = new Sentence(game, "C'est cool d'être schizo !", MOOD_SAD, toto);

	dialogueBox = new DialogueBox(game, "ground2", "ground", true);

	dialogueBox.textBox.setMarginV(10, 10);
	dialogueBox.textBox.setMarginH(10, 10);
	dialogueBox.textBox.outerBox.alpha = 0.4;
	
	dialogueBox.speakerBox.setMarginV(5, 5);
	dialogueBox.speakerBox.setMarginH(5, 5);
	dialogueBox.speakerBox.outerBox.alpha = 0.4;

	dialogueBox.textBox.addSentence(sentence, 500);
	dialogueBox.textBox.addSentence(sentence7, 500);
	dialogueBox.textBox.addSentence(sentence8, 500);
	dialogueBox.textBox.addSentence(sentence9);

	dialogueBox.textBox.createAnimation("toggle", "both", "both", 2000, 1,
										Phaser.Easing.Cubic.InOut);*/
	/*dialogueBox.speakerBox.createAnimation("toggle", "both", "both", 2000, 1,
										   Phaser.Easing.Cubic.InOut);*/

/*	dialogueBox.textBox.createAnimation("close", "both", "both", 2000, 1,
										Phaser.Easing.Cubic.InOut);
	dialogueBox.toggle();*/
	
	toto = {};

	totoMode = new Mode(toto);
	// There should be a toto.addMode(totoMode) when it's done.

	// The stat belongs to totoMode NOT toto !
	// To get toto's stat, you need to add each activated modes' stat.
	// (When Mode is completely implemented...)
	totoMode.addStat("health", "Health", STAT_PERCENT_LINK, 40);

	totoMode.addStat("level", "Level", STAT_NO_MAXSTAT, 1, -1, 1, 99);
	
	totoMode.addStat("endurance", "Endurance", STAT_PERCENT_LINK, 0);

	totoMode.addStat("special", "TOTO !", STAT_NO_LINK, 0, 100);


	// The same as :
	// totoMode.health.growth.addTerme([[totoMode.getStat, totoMode, ["level"]], 10]);

	totoMode.health.growth.addTerme([["_value", totoMode.level], 10]);
	/*totoMode.health.growth.addTerme([["_value", totoMode.level], 10], -1, -1,
									[["_value", totoMode.level], 2]);*/

	totoMode.health.growth.addTerme([[totoMode.getStatMax, totoMode,
									  ["endurance"]], 3]);

	totoMode.level.onUpdate.add(totoMode.health.growth.reCompute,
								totoMode.health.growth);

	totoMode.endurance.onUpdateMax.add(totoMode.health.growth.reCompute,
									   totoMode.health.growth);



	totoMode.engage();
	totoMode.level.add(10);
	totoMode.endurance.addMax(50);
	

	// WIZARDRY ! totoMode.health.maxValue has changed too !
	//totoMode.health.growth.compute();

	console.log(totoMode.health);

	console.log(totoMode);

}

function update(){
}
