BasicGame.Game = function(game){
	
}

BasicGame.Game.prototype.preload = function(){
	
}

var ground;
var sky;
var toto;
var totoMode;
var tata;
var sentence;
var sentence2;
var sentence3;
var sentence4;
var sentence5;
var sentence6;
var sentence7;
var sentence8;
var sentence9;
var textBox;
var dialogueBox;
var healthBar;

BasicGame.Game.prototype.create = function(){
	ground = this.game.add.sprite(0, this.game.camera.height - 150, "ground");
	ground.width = this.game.camera.width;
	ground.height = 10;

	sky = this.game.add.tileSprite(0, 0,
								   ground.width,
								   this.game.cache.getImage('sky').height,
								   'sky');
	sky.scale.y = (this.game.camera.height - 150) / sky.height;

	textBox = new TextBox(this.game, 100, 100, 500, 100, "ground2", "ground",
						  true, true);
	textBox.outerBox.alpha = 0.4;
	textBox.innerBox.alpha = 1;

	textBox.setMarginV(10, 10);
	textBox.setMarginH(10, 10);

	textBox.y = 200;
	textBox.x = 150;

	
	toto = {};
	toto.name = "Barton";
	toto.dialogueAlign = "left";

	tata = {};
	tata.name = "Lucy";
	tata.dialogueAlign = "right";

	sentence = new Sentence(this.game, "Il était une fois, dans un pays très, très, très, très, très, très, très, très, très, très, très, très, très, vide... Un jeu qui peut maintenant avoir des boîtes de dialogue.\nMagnifique, n'est-ce pas ?\nQui c'est qui se charge de faire tous les dialogues ?\nC'est pas moi !", MOOD_ANGRY, toto);

	textBox.addSentence(sentence);
	textBox.fitHeightToSentence(0);
	textBox.fitDurationToSentence(0, 2000);

	
	
/*	sentence2 = new Sentence(this.game, "Ca marche !", MOOD_JOYFUL, null, 10);
	sentence3 = new Sentence(this.game, "Moi aussi !", MOOD_ANGRY);
	sentence4 = new Sentence(this.game, "Je me meurs... Arg.... Je... vais... mourir....\nEcoute... b...ien ce que... je... vais te d...ire...\nJe suis mort...\nAdieu...",
							 MOOD_DYING);
	sentence5 = new Sentence(this.game, "Hey ! C'est pas la classe ?!", MOOD_ANGRY, tata,
							 20);
*/
	//sentence.phaserText.align = "center";

	
//	textBox.addSentence(sentence, -1, 1);

//	textBox.addSentence(sentence5);
//	textBox.fitHeightToSentence(0, -1, 1);
	//textBox.addSentence(sentence3, 1000, 1);
	//textBox.addSentence(sentence4);
	
	textBox.createAnimation("toggle", "both", "both", 2000, 1, Phaser.Easing.Cubic.InOut);
	textBox.createAnimation("close", "both", "both", 2000, 1, Phaser.Easing.Cubic.InOut);

//	textBox.fitDurationToSentence(0, 1000);
	//textBox.createVerticalClose(1000, 0, Phaser.Easing.Bounce.Out);

//	textBox.createToggleTimer(1);
	//textBox.onEndClose.add(textBox.clear, textBox);

	//textBox.toggle();
	
	sentence6 = new Sentence(this.game, "La boîte de dialogue est fonctionnelle !",
							 MOOD_NORMAL, toto);
	textBox.toggle();

	sentence7 = new Sentence(this.game, "Maintenant, je peux me parler à moi même !",
							 MOOD_JOYFUL, toto);

	sentence8 = new Sentence(this.game, "Ou avec d'autres personnes !", MOOD_JOYFUL, tata);

	sentence9 = new Sentence(this.game, "Hey, salut sœurette !", MOOD_SAD, toto);

	dialogueBox = new DialogueBox(this.game, "ground2", "ground", true, true);

	dialogueBox.textBox.setMarginV(5, 5);
	dialogueBox.textBox.setMarginH(10, 10);

	dialogueBox.textBox.outerBox.alpha = 0.4;
	
	dialogueBox.speakerBox.setMarginV(5, 5);
	dialogueBox.speakerBox.setMarginH(5, 5);
	dialogueBox.speakerBox.outerBox.alpha = 0.4;

	dialogueBox.textBox.addSentence(sentence6, 500);
	dialogueBox.textBox.addSentence(sentence7, 500);
	dialogueBox.textBox.addSentence(sentence8, 500);
	dialogueBox.textBox.addSentence(sentence9);

	dialogueBox.textBox.createAnimation("toggle", "both", "both", 2000, 1,
										Phaser.Easing.Cubic.InOut);
	/*dialogueBox.speakerBox.createAnimation("toggle", "both", "both", 2000, 1,
										   Phaser.Easing.Cubic.InOut);*/

	dialogueBox.textBox.createAnimation("close", "both", "both", 2000, 1,
										Phaser.Easing.Cubic.InOut);
	dialogueBox.toggle();
	
	toto = {};

	totoMode = new Mode(toto);
	// There should be a toto.addMode(totoMode) when it's done.

	// The stat belongs to totoMode NOT toto !
	// To get toto's stat, you need to add each activated modes' stat.
	// (When Mode is completely implemented...)
	totoMode.addStat("health", "Health", STAT_NO_LINK,  100000, 100000);

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
	console.log(totoMode.health);

	console.log(totoMode);
	
	healthBar = new MonoGauge(this.game, 50, 100, 100, 10, totoMode.health,
							  H_RED, H_BLACK,
							  "", "");
	healthBar.upperSprite.alpha = 0.5;
	healthBar.increaseSpeed = 0.25;
	healthBar.increaseAlpha = 0.2;

	healthBar.decreaseSpeed = 0.5;
	healthBar.decreaseAlpha = 0.4;
	healthBar.decreaseColor = H_RED;

	totoMode.health.addMax(1000);
	//totoMode.health.add(1000000);
	//totoMode.health.subtract(10000);
}
var i = 0;
BasicGame.Game.prototype.update = function(){
	i++;
	

	if (!(i%45)){
		totoMode.health.subtract(15000);
	}

	if (!(i%60)){
		if(totoMode.health.get() != 0){
			totoMode.health.add(15000);
		}
	}

	//dialogueBox.update();
}
