BasicGame.Level1 = function(game){

}

BasicGame.Level1.prototype.preload = function(){
}

var map;
var sky;
var player1;
var hero;
var secondSkillBar;

BasicGame.Level1.prototype.create = function (){
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.arcade.gravity.y = 600;

    //Chargement des propriétés du tilemap
    map = this.game.add.tilemap('level1');

    this.game.world.setBounds(0, 0,
                              map.widthInPixels, map.heightInPixels);

    // Chargement du Tileset
    map.addTilesetImage('platforms', 'Level1_Tiles');
    map.setCollisionBetween(0, 63)

    this.game.platforms = map.createLayer('blockedLayer');
    this.game.platforms.resizeWorld();

	sky = this.game.add.tileSprite(0, 0,
								   map.widthInPixels,
								   map.heightInPixels,
								   'sky');

	this.game.world.bringToTop(this.game.platforms);

	this.bloodPool = this.game.add.group();
	this.slashPool = this.game.add.group();

    //this.game.platforms.debug = true;

    player1 = BasicGame.player1;
	hero = player1.hero;

    hero = this.game.add.sprite(0, 600 - 64, "lucy");
    hero.animations.add("walk", [144, 145, 146, 147, 148, 149, 150, 151], 15);
	hero.animations.add("spellCast", [39, 41, 42, 43, 44, 45, 45, 39], 15);
	hero.frame = 26;
	hero.SPEED = 250;
	hero.ACCELERATION = 250;
	hero.JUMP_POWER = 200;
	hero.DRAG = 500
	hero.jumpCount = 2
	hero.orientation = 0;
	hero.orientationH = 1;
	hero.orientationV = 0;
	hero.firstSkill = new Skill(this.game, hero, undefined, undefined, 5000, "ennemy");
	hero.firstSkill.onUse.add(function(){hero.animations.play("spellCast")});
	
	hero.special = new Stat(this.game, "special", STAT_PERCENT_LINK, 100);
	
	/*************/
	/* IMPORTANT */
	/**************************************************************************/
	hero.secondSkill = new Skill(this.game, hero, undefined, undefined, 1000,
								 "enemy");

	/* Les projectiles ont besoin d'une "piscine" de sprites.
	   Ca permet 2 choses :
	   => Pouvoir réutiliser un projectile déjà détruit (ne pas oublier de le
	   réinitialiser)
	
	   => Gérer automatiquement les collisions, et les destruction globales
	   (les projectiles créés sont dans la piscine, donc directement dans un groupe)
	*/

	// Je suis obligé de marquer cette ligne, car launchFunction est appelé par le
	// skill. Donc this correspond au skill (et non à BasicGame.Level1).
	var bloodPool = this.bloodPool;

	// launchFunction est appelé dès que le skill est utilisé (le joueur appuie
	// sur la touche et il a assez de special pour le lancer)
	hero.secondSkill.launchFunction = function(){

		/* Pour créer des projectiles, il faut 3 fonctions:
		   => initFunction : lancé quand le projectile est créé.
		                     Initialise le projectile.
							 
		   => updateFunction : lancé quand le projectile est mis à jour.
		                       (en même temps que la fonction update globale)
							   Attention : Dans le cas où un projectile n'est pas
							   détruit sur le coup (animation de destruction),
							   cette fonction sera toujours appelée (jusqu'à ce que
							   le sprite soit détruit).
							   Il faudra peut être vérifier que le sprite n'est pas
							   en train d'être détruit.
							   (Comme dans updateProjectile juste en dessous)

		   => killFunction : lancé quand le projectile est tué (REMPLACE le kill par
		                     défaut du projectile, donc ne pas oublier de le rajouter).
							 Comme pour updateFunction, killFunction est appelé tant que
							 le projectile n'est pas détruit. Donc ne pas oublier de
							 vérifier qu'il n'est pas en train de l'être.

		   Ces fonctions sont appelées par le projectile. this correspond donc au
		   projectile.
		 */

		function initProjectile(){
			this.x = hero.x + 24;
			this.y = hero.y + 36;
			
			// Je remet à zéro le tint, car si le projectile vient de la piscine,
			// il est noir.
			this.tint = H_WHITE;

			this.game.physics.enable([this], Phaser.Physics.ARCADE);
			
			this.body.velocity.x = 600 * hero.scale.x;
			this.body.velocity.y = -250;

			// Même principe que pour le tint.
			this.body.allowGravity = true;
			
			this.checkWorldBounds = true;
			this.outOfBoundsKill = true;
			
			// Temps en millisecondes d'existance du projectile.
			this.lifespan = 1000;
			
			this.width /= 3;
			this.height /= 3;
			
			this.anchor.setTo(0.5);

			this.animations.add("walk", [144, 145, 146, 147, 148, 149, 150, 151],
								15);
			this.animations.play("walk", 15, true);
		}

		function updateProjectile(){
			// Si this.timer est défini, ça veut dire que le projectile est en
			// train d'être tué.
			if (typeof(this.timer) === "undefined"){
				this.alpha = this.lifespan / 1000;
			}
		}

		function killProjectile(){
			// Si this.timer est défini, ça veut dire que le projectile est en
			// train d'être tué.
			if (typeof(this.timer) === "undefined"){
				this.alpha = 1;
			
				this.body.velocity.x = 0;
				this.body.velocity.y = 0;

				this.body.allowGravity = false;
				this.tint = H_BLACK;
				
				// Tue le sprite 250 millisecondes en retard, histoire de laisser
				// le joueur voir où il atterrit.
				this.timer = this.game.time.create(true);
				
				this.timer.add(250, function(){
					hero.x = this.x;
					hero.y = this.y - hero.height;
					console.log("TELEPORTATION !");
					
					Phaser.Sprite.prototype.kill.call(this);

					this.timer = undefined;
				}, this);
				
				// Ne pas oublier de démarrer le timer !
				this.timer.start();
			}	
		}

		// Le héros lance une animation.
		// N.B : Le skill a aussi un attribut owner qui correspond à hero.
		//       this.user.animations.play("spellCast") est donc équivalent.
		//       Par contre, un projectile n'en possède pas, il faut donc faire
		//       quelque chose du genre:
		//
		//       var hero = this.owner;
		//       Puis, dans les fonctions du projectile, utiliser hero.
		hero.animations.play("spellCast");

		timer = this.game.time.create(true);

		// Même raison que pour bloodPool.
		var game = this.game;

		// Crée le projectile 100 millisecondes après le lancement du skill.
		timer.add(100, function(){createProjectile(game, 0, 0, "lucy", bloodPool,
												  initProjectile, updateProjectile,
												  killProjectile);});		
		
		// Encore une fois, ne pas oublier de démarrer le timer !
		timer.start();
	}
	/******************************************************************************/

	hero.secondSkill.createCooldownBar(24, 0, 20, 5, H_YELLOW);
	hero.addChild(hero.secondSkill.cooldownBar);

	hero.thirdSkill = new Skill(this.game, hero, undefined, undefined, 100, "enemy");
	var slashPool = this.slashPool;

	hero.thirdSkill.launchFunction = function(){
		function initMainProjectile(){
			this.x = hero.x + hero.width * 3 / 4 * hero.scale.x;
			this.y = hero.y + hero.height * 0.6;

			this.anchor.setTo(0.5);

			this.frame = 0;
			
			this.lifespan = 1000;
			
			this.animations.add("slash");
			
			this.animations.play("slash", 20, false, true);

			this.scale.x = hero.scale.x / Math.abs(hero.scale.x);

			this.tint = H_GREY;

			this.angle = -90 * hero.orientationV;
		}

		function initProjectile(){
			this.x = hero.x + hero.width * 3 / 4 * hero.scale.x;
			this.y = hero.y + hero.height * 0.65;

			this.anchor.setTo(0.5);

			this.frame = 0;
			
			this.lifespan = 1000;
			
			this.animations.add("slash", [0, 1, 1, 2, 2, 3]);
			
			this.animations.play("slash", 1000 / this.lifespan * FPS / 7);

			this.game.physics.enable([this], Phaser.Physics.ARCADE);
			this.body.velocity.x = 500 * hero.scale.x;
			this.body.velocity.y = -100;
			this.body.allowGravity = false;

			this.scale.x = hero.scale.x / Math.abs(hero.scale.x);

			this.scale.y *= 0.5;

			this.tint = H_RED;

			this.angle = -90 * hero.orientationV;

			this.tween = this.game.add.tween(this.body.velocity)
				.to({y : 100}, this.lifespan / 2)
				.to({y : -100}, this.lifespan / 2);

			this.tween.loop();

			this.tween.loop();
			this.tween.start();
		}

		function updateProjectile(){
			this.alpha = this.lifespan / 1000;
		}

		function killProjectile(){
			this.tween.stop();
			this.tween = null;

			Phaser.Sprite.prototype.kill.call(this);
		}

		createProjectile(this.game, 0, 0, "slash", slashPool,
						 initProjectile, updateProjectile, killProjectile);
	}

	hero.fourthSkill = new Skill(this.game, hero, undefined, undefined, 5000, "ennemy");

	hero.fourthSkill.launchFunction = function(){
		function initProjectile(angle){
			this.anchor.setTo(0.5);
			this.x = hero.x + hero.width / 2;
			this.y = hero.y + hero.height / 2;

			this.angle = angle;
			this.distanceFactor = 1;

			this.frame = 2;

			this.lifespan = 4500;

			this.tint = H_GREY;

			this.x += Math.cos(this.angle) * hero.width / 2 + this.width / 2 + hero.width / 2;
			this.y += Math.sin(this.angle) * hero.height / 2 + this.height / 2 + hero.height / 2;
		}

		function updateProjectile(){
			this.angle += 5;

			this.alpha = this.lifespan / 4500;

			if (this.alpha < 0.3){
				this.distanceFactor *= 1.02;
			}
			
			this.x = hero.x + hero.width / 2 + Math.cos(this.angle / 180 * Math.PI) * hero.width / 2 * this.distanceFactor;
			this.y = hero.y + hero.height / 2 + Math.sin(this.angle / 180 * Math.PI) * hero.height / 2 * this.distanceFactor;
		}

		var angle = 45;

		for(var i = 0; i < 360 / angle; i++) {
			createProjectile(this.game, 0, 0, "slash", slashPool,
							 function(){initProjectile.call(this, i * angle)},
							 updateProjectile);
		}
	}

    this.game.physics.enable( [hero], Phaser.Physics.ARCADE);

    hero.body.collideWorldBounds = true;
	hero.body.setSize(32, 48, 16, 16);
	hero.body.maxVelocity.setTo(hero.SPEED, hero.SPEED * 3);
	hero.body.drag.setTo(hero.DRAG, 0);


    this.game.camera.follow(hero);

    hero.goLeft = function(control, factor){
        if (typeof(factor) === "undefined"){
            factor = 1;
        }
		
		hero.orientation = 1;
		hero.scale.x = -1;
		hero.anchor.setTo(1,0);
		hero.body.setSize(32, 48, 16+32, 16);

        hero.animations.play("walk", 15 * Math.abs(factor));
        hero.body.acceleration.x = -hero.ACCELERATION * Math.abs(factor);
    }

    hero.goRight = function(control, factor){
        if (typeof(factor) === "undefined"){
            factor = 1;
        }

		hero.orientation = 2;
		hero.orientationH = 1;
		hero.scale.x = 1;
		hero.anchor.setTo(0,0);
		hero.body.setSize(32, 48, 16, 16);

        hero.animations.play("walk", 15 * Math.abs(factor));
        hero.body.acceleration.x = hero.ACCELERATION * Math.abs(factor);
    }

    hero.goUp = function(control, factor){
        if (typeof(factor) === "undefined"){
            factor = 1;
        }

		hero.orientationV = 1;
		
		if (hero.jumpCount > 0){
			if ((control.manager.type == CONTROL_GAMEPAD && control.input.justPressed(250)) ||
				(control.manager.type == CONTROL_KEYBOARD && control.input.downDuration(250))){
				hero.body.velocity.y = -hero.JUMP_POWER;
			}
		}
	}
	
	hero.fly = function(){
		if (hero.body.velocity.y > 0){
			hero.body.velocity.y /= 1.5;
			hero.body.drag.setTo(0, 0);
		}
	}
	
	hero.reduceJump = function(){
		hero.jumpCount--;
	}
	
	hero.goDown = function(control, factor){
        if (typeof(factor) === "undefined"){
            factor = 1;
        }

		hero.orientationV = -1;
		
        hero.body.velocity.y = hero.JUMP_POWER * Math.abs(factor);
    }

	hero.stopMov = function(){
		if (hero.orientation != 0){
			hero.animations.stop("walk");
			hero.frame = 143;
		}
			
		hero.orientation = 0;
		
		hero.orientationV = 0;
	}
	
	hero.cast = function(){
		hero.firstSkill.useSkill();
	}

	hero.castSecond = function(){
		hero.secondSkill.useSkill();
	}
	
	hero.castThird = function(){
		hero.thirdSkill.useSkill();
	}

	hero.castFourth = function(){
		hero.fourthSkill.useSkill();
	}

    player1.controlManager = new ControlManager(this.game, CONTROL_KEYBOARD, hero);
    player1.controlManager2 = new ControlManager(this.game, CONTROL_GAMEPAD, hero,
												 "pad1");

	player1.controlManager2.bindControl("up", Phaser.Gamepad.XBOX360_A,
                                        "goUp",
                                        "down", "movement");
	player1.controlManager2.bindControl("up2", Phaser.Gamepad.XBOX360_A,
                                        "reduceJump",
                                        "onDown", "movement");

	player1.controlManager2.bindControl("fly", Phaser.Gamepad.XBOX360_Y,
                                        "fly",
                                        "down", "movement");
	
    player1.controlManager2.bindPadControl("rightPad",
										   Phaser.Gamepad.XBOX360_STICK_LEFT_X,
                                           0.1, 1, "goRight", "update", "movement");
	/*player1.controlManager2.bindPadControl("stopMovPad", Phaser.Gamepad.XBOX360_STICK_LEFT_X,
                                           0, 0, "stopMov", "update", "movement");*/
	
    player1.controlManager2.bindPadControl("leftPad",
										   Phaser.Gamepad.XBOX360_STICK_LEFT_X,
                                           -1, -0.1, "goLeft", "update", "movement");



    player1.controlManager.bindControl("leftControl", Phaser.Keyboard.Q, "goLeft",
                                            "down", "movement");
    player1.controlManager.bindControl("rightControl", Phaser.Keyboard.D, "goRight",
                                            "down", "movement");
    player1.controlManager.bindControl("upControl", Phaser.Keyboard.Z, "goUp",
                                       "down", "movement");
	player1.controlManager.bindControl("upControl2", Phaser.Keyboard.Z,
                                        "reduceJump",
                                        "onDown", "movement");
    player1.controlManager.bindControl("downControl", Phaser.Keyboard.S, "goDown",
                                       "down", "movement");

	player1.controlManager2.bindControl("cast", Phaser.Gamepad.XBOX360_X,
                                        "cast",
                                        "onDown", "action");

	player1.controlManager.bindControl("cast", Phaser.Keyboard.ENTER,
                                       "cast",
                                       "onDown", "action");
	player1.controlManager.bindControl("cast2", Phaser.Keyboard.TWO,
                                       "castSecond",
                                       "down", "action");
	player1.controlManager.bindControl("cast3", Phaser.Keyboard.THREE,
                                       "castThird",
                                       "down", "action");
	player1.controlManager.bindControl("cast4", Phaser.Keyboard.FOUR,
                                       "castFourth",
                                       "down", "action");

	player1.controlManager.bindControl("fly", Phaser.Keyboard.SPACEBAR,
                                       "fly",
                                       "down", "movement");
}

BasicGame.Level1.prototype.update = function (){
    //Collision
    this.game.physics.arcade.collide(hero, this.game.platforms);
	this.game.physics.arcade.collide(this.bloodPool, this.game.platforms, function(projectile, platform){
		projectile.kill();
	});

	if (hero.body.onFloor()){
		hero.jumpCount = 2;
		hero.body.drag.setTo(hero.DRAG, 0);
	}

	hero.body.acceleration.x = 0;
	player1.controlManager.update();
	player1.controlManager2.update();

	//this.game.debug.body(hero);
}
