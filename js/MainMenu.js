BasicGame.MainMenu = function(game){
	this.music = null;
};

BasicGame.MainMenu.prototype.create = function(){
	BasicGame.sfx = {};

	this.game.world.alpha = 1;

	this.music = this.game.add.audio("mainTheme");
	BasicGame.sfx.cursorSelect = this.game.add.audio("cursor_select");
	
	BasicGame.allPlayers.p1.controller.setTargetByTag(BasicGame, "system");

	BasicGame.allPlayers.p1.setHero(null);
	BasicGame.allPlayers.p2.setHero(null);
	
	BasicGame.allPlayers.p1.controller.disable("action");
	BasicGame.allPlayers.p2.controller.disable("action");
	
	var centerX = this.game.camera.width / 2;
	var centerY = this.game.camera.height / 2;

	this.background = this.game.add.tileSprite(0, 0,
											   2 * centerX,
											   this.game.cache.getImage("sky").height,
											   "sky");
	this.background.scale.y = (2 * centerY - 10) / this.background.height;

	this.ground = this.add.sprite(0, 2 * centerY - 10, "ground");
	this.ground.width = 2 * centerX;
	this.ground.height = 10;
	
	this.heroes = this.game.add.group();

	this.lucy = this.game.add.sprite(2 * centerX, 2 * centerY, "lucy");
	this.lucy.animations.add("spellCastLeft", [14, 15, 16, 17, 18], 15);
	this.lucy.anchor.setTo(0.5);

	this.lucy.frame = 18;
	this.lucy.angle = -20;

	this.barton = this.game.add.sprite(0,  2 * centerY, "barton");
	this.barton.animations.add("swordRight", [195, 196, 197, 198, 199, 200],
							   15);
	this.barton.anchor.setTo(0.5);

	this.barton.frame = 200;
	this.barton.angle = -20;

	this.heroes.add(this.lucy);
	this.heroes.add(this.barton);

	this.heroes.forEach(function(item){
		item.scale.setTo(5);
		item.alpha = 0;
	});
	
	this.lucy.y += this.lucy.height / 2;
	this.barton.x -= this.barton.width / 2;

	this.allTweens = {
		opening: {
			lucy: this.game.add.tween(this.lucy)
				.to({x: centerX - this.lucy.width / 1.5,
					 y: centerY + this.lucy.height / 4,
					 alpha: 1}, 1000, Phaser.Easing.Cubic.Out),

			barton: this.game.add.tween(this.barton)
				.to({x: centerX + this.barton.width / 2,
					 y: centerY - this.barton.height / 4,
					 alpha: 1}, 1000, Phaser.Easing.Cubic.Out)
			
		},

		closing: {
			lucy: this.game.add.tween(this.lucy)
				.to({x: 2 * centerX,
					 y: 2 * centerY + this.lucy.height / 2,
					 alpha: 1}, 1000, Phaser.Easing.Cubic.In),

			barton: this.game.add.tween(this.barton)
				.to({x: -this.barton.height,
					 y: 2 * centerY,
					 alpha: 0}, 1000, Phaser.Easing.Cubic.In)
		}
	}

	this.allTimers = {
		lucy: this.game.time.create(false),

		barton: this.game.time.create(false)
	}

	this.allTimers.lucy.loop(5000, function(){
		this.lucy.animations.play("spellCastLeft", 10);
	}, this);

	this.allTimers.barton.loop(7000, function(){
		this.barton.animations.play("swordRight", 10);
	}, this);

	this.allTweens.opening.lucy.onComplete.addOnce(function(){
		this.allTweens.opening.barton.start();
	}, this);
	
	this.allTweens.closing.barton.onComplete.addOnce(function(){
		this.allTweens.closing.lucy.start();
	}, this);
	
	this.logo = this.game.add.sprite(250, 100, "logo");

	this.logo.scale.setTo(0.5);
	this.logo.anchor.setTo(0.5);

	this.menu = new Menu(this.game, BasicGame.allPlayers.p1.controller, "MainMenu",
						 centerX - 250, 0,
						 500,
						 500,
						 "", "icons");
	this.menu.horizontal = false;

	this.menu.addChild(this.logo);

	this.newGameOption = createBasicMenuOption(this.menu, 300, "Nouvelle Partie",
											   function(){
												   console.log("New !");
												   this.startGame();
											   }, this);
	this.loadGameOption = createBasicMenuOption(this.menu,  400, "Charger une Partie",
												function(){
												   console.log("Load !");
											   }, null);
	this.optionGameOption = createBasicMenuOption(this.menu, 500, "Options",
												  function(){
												   console.log("Options !");
											   }, null);
	this.exitGameOption = createBasicMenuOption(this.menu, 600, "Quitter",
												function(){
												   console.log("Exit !");
											   }, null);

	this.menu.cursor.frame = 5;

	BasicGame.confirmMenu = new ConfirmationMenu(BasicGame.allPlayers.p1.controller,
												 this.exit, this);

	this.exitGameOption.onSelect.add(function(){
		BasicGame.confirmMenu.toggle();
	}, this);

	this.menu.enableMouse();

	this.menu.createAnimation("toggle", "0", "-200", 1500, 1,
							  Phaser.Easing.Quadratic.Out, true);
	this.menu.createAnimation("close", "0", "-200", 500, 0,
							  Phaser.Easing.Quadratic.Out);

	this.menu.onEndToggle.addOnce(function(){
		this.allTimers.lucy.start();
		this.allTimers.barton.start();
	}, this);

	this.menu.onEndClose.addOnce(function(){
		this.allTweens.closing.barton.start();
	}, this);

	this.menu.onStartClose.addOnce(function(){
		this.allTimers.lucy.stop();
		this.allTimers.barton.stop();
	}, this);
	
	BasicGame.allPlayers.p1.controller.setTargetByTag(this.menu, "menu");

	this.allTweens.opening.barton.onComplete.addOnce(function(){
		this.menu.toggle();
	}, this);

	this.allTweens.opening.lucy.start();
	
	this.music.play("", 0, BasicGame.volume.music, true);
}

BasicGame.MainMenu.prototype.update = function(){
	this.background.tilePosition.x -= 1;
	
	for(var i in BasicGame.allPlayers) {
		BasicGame.allPlayers[i].controller.update();
	}
}

BasicGame.MainMenu.prototype.startGame = function(pointer){
	this.allTweens.closing.lucy.onComplete.addOnce(function(){
		this.state.start("Level_1");
	}, this);

	this.cleanUp();

	this.music.fadeOut(2500);
}

BasicGame.MainMenu.prototype.cleanUp = function(){
	BasicGame.confirmMenu.close();

	this.menu.close();

	BasicGame.allPlayers.p1.controller.setTargetByTag(null, "menu");
	BasicGame.allPlayers.p2.controller.setTargetByTag(null, "menu");
}

BasicGame.MainMenu.prototype.exit = function(){
	this.allTweens.closing.lucy.onComplete.addOnce(function(){
		window.location.replace("site.html");
	});

	this.cleanUp();

	this.music.fadeOut(2500);
}


BasicGame.MainMenu.prototype.shutdown = function(){
	this.menu.destroy();
	this.menu = null;
	
	BasicGame.confirmMenu.destroy();
	BasicGame.confirmMenu = null;

	for(var i in this.allTweens){
		for(var j in this.allTweens[j]){
			if (this.allTweens[i][j] != null){
				this.allTweens[i][j].stop();
				this.allTweens[i][j].destroy();
				this.allTweens[i][j] = null;
			}
		}
	}

	for(var i in this.allTimers){
		if (this.allTimers[i] != null){
			this.allTimers[i].stop();
			this.allTimers[i].destroy();
			this.allTimers[i] = null;
		}
	}
}
