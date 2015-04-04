BasicGame.Level1 = function(game){
}

BasicGame.Level1.prototype.preload = function(){
}

var map;
var sky;
var player1;
var hero;
var secondSkillBar;
var toto;
var statusUi;

BasicGame.Level1.prototype.create = function (){
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.arcade.gravity.y = 600;

    //Chargement des propriétés du tilemap
    map = this.game.add.tilemap('level1');

    this.game.world.setBounds(0, 0,
                              map.widthInPixels, map.heightInPixels);

    // Chargement du Tileset
    map.addTilesetImage('platforms', 'Level1_Tiles');
    map.setCollisionBetween(0, 63);

	for(var i = 0; i < map.layer.data.length; i++) {
		for(var j = 0; j < map.layer.data[i].length; j++) {
			if (map.layer.data[i][j].canCollide){
				map.layer.data[i][j].tag = "platform";
			}
		}
	}

    this.game.platforms = map.createLayer('blockedLayer');
    this.game.platforms.resizeWorld();

	sky = this.game.add.tileSprite(0, 0,
								   map.widthInPixels,
								   map.heightInPixels,
								   'sky');

	this.game.world.bringToTop(this.game.platforms);

	BasicGame.bloodPool =  this.game.add.group();
	BasicGame.slashPool =  this.game.add.group();
	BasicGame.firePool =  this.game.add.group();
	BasicGame.icePool = this.game.add.group();
	BasicGame.explosionPool = this.game.add.group();
	BasicGame.iceExplosionPool = this.game.add.group();

	BasicGame.sfx = {};

	BasicGame.sfx.EXPLOSION_0 = this.game.add.audio("explosion_0");
	BasicGame.sfx.EXPLOSION_0.allowMultiple = true;

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
	hero.tag = "Hero";
	hero.firstSkill = new Skill(hero, 1, undefined, 5000);
	hero.firstSkill.onUse.add(function(){hero.animations.play("spellCast")});
	hero.allStats = {};
	hero.allSkills = {};

	hero.allStats.level = new Stat(this.game, "level", STAT_NO_MAXSTAT, 1);
	hero.allStats.special = new Stat(this.game, "special", STAT_PERCENT_LINK, 100);
	hero.allStats.health = new Stat(this.game, "health", STAT_PERCENT_LINK, 100);
	
	/*************/
	/* IMPORTANT */
	/**************************************************************************/
	
	// Quand le joueur veut lancer un sort, il faut vérifier si il peut le lancer.
	// C'est cette fonction qui le vérifie.
	// Elle doit renvoyer true si le joueur peut payer, false sinon.
	// Si aucune fonction de coût n'est passé au Skill, il en crée une qui renvoie
	// toujours vrai.
	// (On peut aussi directement assigner la fonction au Skill :
	//  Skill.costFunction = function(){...};)
	function costSkill1(){
		if (this.user.allStats.special.canSubtract(10)){
			this.user.allStats.special.subtract(10);

			return true;
		}
		else{
			return false;
		}
	}

	hero.allSkills.secondSkill = new Skill(hero, 1, costSkill1, 10000,
										   Elements.ALMIGHTY,
										   ["platform"]);
	hero.allSkills.secondSkill.icon = "teleport_icon";

	/* Les projectiles ont besoin d'une "piscine" de sprites.
	   Ca permet 2 choses :
	   => Pouvoir réutiliser un projectile déjà détruit (ne pas oublier de le
	   réinitialiser)
	
	   => Gérer automatiquement les collisions, et les destruction globales
	   (les projectiles créés sont dans la piscine, donc directement dans un groupe)

	   Si aucune piscine n'est donnée (null), le projectile n'étant pas affecté à un
	   groupe, il sera détruit des la sortie du bloc.
	   Il faudra donc, soit le garder globalement (mauvaise idée), soit le garder dans
	   le Skill lui même.
	*/

	// Je suis obligé de marquer cette ligne, car launchFunction est appelé par le
	// skill. Donc this correspond au skill (et non à BasicGame.Level1).
	var bloodPool = BasicGame.bloodPool;

	// launchFunction est appelé dès que le skill est utilisé (le joueur appuie
	// sur la touche et il a assez de special pour le lancer)
	hero.allSkills.secondSkill.launchFunction = function(){
		var self = this;

		/* Pour créer des projectiles, il faut 3 + 2 fonctions:
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

		

		   => collideFunction : lancé quand le projectile entre en collision avec un
		                        élément du niveau (collideProcess retourne true).
								Prend l'obstacle en question en paramètre.
								Par défaut, détruit le projectile.

		   => collideProcess : lancé quand le projectile entre en collision avec un
		                       élément du niveau (avant collideFunction).
							   Retourne true si la collision est acceptée, false sinon.
							   Prend l'obstacle en question en paramètre.
							   Par défaut, retourne vrai uniquement si le projectile
							   touche sa cible.

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

			this.element = self.element;

			this.targetTags = self.targetTags;
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
					var cachedScale = {};
					cachedScale.x = hero.scale.x;
					cachedScale.y = hero.scale.y;

					this.tweenScaleHero = this.game.add.tween(hero.scale);
					this.tweenScaleHero.to({x : this.scale.x, y : this.scale.y}, 500,
										   Phaser.Easing.Cubic.InOut);

					this.tweenPosHero = this.game.add.tween(hero);
					this.tweenPosHero.to({x : this.x,
										  y : this.y - this.height}, 500,
										 Phaser.Easing.Cubic.InOut);

					this.tweenShadow = this.game.add.tween(hero.scale);
					this.tweenShadow.to({x : cachedScale.x, y : cachedScale.y}, 500,
										Phaser.Easing.Cubic.InOut);

					this.tweenShadow.onComplete.add(function(){
						hero.tint = H_WHITE;
						hero.body.allowGravity = true;

						this.timer = undefined;
						this.tweenScaleHero.stop();
						this.tweenPosHero.stop();
						this.tweenShadow.stop();

						this.tweenScaleHero = null;
						this.tweenPosHero = null;
						this.tweenShadow = null;

						Phaser.Sprite.prototype.kill.call(this);
					}, this);

					this.tweenScaleHero.onComplete.add(function(){
						this.tweenPosHero.start()
					}, this);

					this.tweenPosHero.onComplete.add(function(){
						this.visible = false;
						this.tweenShadow.start();
					}, this);

					hero.tint = H_BLACK;
					hero.body.allowGravity = false;
					
					console.log("TELEPORTATION !");

					hero.animations.stop();
					hero.animations.play("walk");

					this.tweenScaleHero.start();
				}, this);
				
				// Ne pas oublier de démarrer le timer !
				this.timer.start();
			}	
		}

		// Le héros lance une animation.
		// N.B : Le skill a aussi un attribut user qui correspond à hero.
		//       this.user.animations.play("spellCast") est donc équivalent.
		//       Par contre, un projectile n'en possède pas, il faut donc faire
		//       quelque chose du genre:
		//
		//       var hero = this.user;
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

	var slashPool = BasicGame.slashPool;
	var firePool = BasicGame.firePool;
	var icePool = BasicGame.icePool;
	var explosionPool = BasicGame.explosionPool;
	var iceExplosionPool = BasicGame.iceExplosionPool;


	hero.allSkills.thirdSkill = new FireBallSkill(hero, 5, ["platform", "enemy"]);

	hero.allSkills.fourthSkill = new Skill(hero, 1, undefined, 5000);
	hero.allSkills.fourthSkill.icon = "barrier_icon";

	hero.allSkills.fourthSkill.launchFunction = function(){
		function initProjectile(angle){
			this.anchor.setTo(0.5);
			this.x = hero.x + hero.width / 2;
			this.y = hero.y + hero.height / 2;

			this.angle = angle;
			this.distanceFactor = 1;

			
			this.targetTags.push("enemy");

			this.game.physics.enable([this], Phaser.Physics.ARCADE);
			this.body.allowGravity = false;

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
			this.x = hero.x + Math.abs(hero.width) / 2 + Math.cos(this.angle / 180 * Math.PI) * Math.abs(hero.width) / 2 * this.distanceFactor;
			this.y = hero.y + hero.height / 2 + Math.sin(this.angle / 180 * Math.PI) * hero.height / 2 * this.distanceFactor;
		}

		var angle = 45;

		for(var i = 0; i < 360 / angle; i++) {
			createProjectile(this.game, 0, 0, "slash", slashPool,
							 function(){initProjectile.call(this, i * angle)},
							 updateProjectile);
		}
	}

	hero.allSkills.fifthSkill = new IceBallSkill(hero, 5, ["enemy"]);
	
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
		hero.orientationH = -1;
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
		
        if (hero.body.velocity.y < 0){
			hero.body.velocity.y = hero.JUMP_POWER;
		}
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
		hero.allSkills.firstSkill.useSkill();
	}

	hero.castSecond = function(){
		hero.allSkills.secondSkill.useSkill();
	}
	
	hero.castThird = function(){
		hero.allSkills.thirdSkill.useSkill();
	}

	hero.castFourth = function(){
		hero.allSkills.fourthSkill.useSkill();
	}

	hero.castfifth = function(){
		hero.allSkills.fifthSkill.useSkill();
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



    player1.controlManager.bindControl("leftControl", Phaser.Keyboard.LEFT, "goLeft",
                                            "down", "movement");
    player1.controlManager.bindControl("rightControl", Phaser.Keyboard.RIGHT, "goRight",
                                            "down", "movement");
    player1.controlManager.bindControl("upControl", Phaser.Keyboard.UP, "goUp",
                                       "down", "movement");
	player1.controlManager.bindControl("upControl2", Phaser.Keyboard.UP,
                                        "reduceJump",
                                        "onDown", "movement");
    player1.controlManager.bindControl("downControl", Phaser.Keyboard.DOWN, "goDown",
                                       "down", "movement");

	player1.controlManager2.bindControl("cast", Phaser.Gamepad.XBOX360_X,
                                        "cast",
                                        "onDown", "action");

	player1.controlManager.bindControl("cast", Phaser.Keyboard.ENTER,
                                       "cast",
                                       "onDown", "action");
	player1.controlManager.bindControl("cast5", Phaser.Keyboard.FOUR,
									   "castfifth",
									   "down","action");
	player1.controlManager.bindControl("cast2", Phaser.Keyboard.ONE,
                                       "castSecond",
                                       "down", "action");
	player1.controlManager.bindControl("cast3", Phaser.Keyboard.TWO,
                                       "castThird",
                                       "down", "action");
	player1.controlManager.bindControl("cast4", Phaser.Keyboard.THREE,
                                       "castFourth",
                                       "down", "action");

	player1.controlManager.bindControl("fly", Phaser.Keyboard.SPACEBAR,
                                       "fly",
                                       "down", "movement");

	statusUi = new Status_UI(this.game, hero, 50, 575);
	statusUi.profilSprite.frame = 26;
	statusUi.scale.setTo(0.9);
}

BasicGame.Level1.prototype.update = function (){
    //Collision
    this.game.physics.arcade.collide(hero, this.game.platforms);
	this.game.physics.arcade.collide(BasicGame.slashPool, hero,
									 collideProjectile, collideProcessProjectile);
	this.game.physics.arcade.collide(BasicGame.slashPool, this.game.platforms,
									 collideProjectile, collideProcessProjectile);

	this.game.physics.arcade.collide(BasicGame.bloodPool, this.game.platforms,
									 collideProjectile, collideProcessProjectile);
	this.game.physics.arcade.collide(BasicGame.firePool, this.game.platforms,
									 collideProjectile, collideProcessProjectile);
	this.game.physics.arcade.collide(BasicGame.icePool, this.game.platforms,
									collideProjectile, collideProcessProjectile);
	
	if (hero.body.onFloor()){
		hero.jumpCount = 2;
		hero.body.drag.setTo(hero.DRAG, 0);
	}

	hero.body.acceleration.x = 0;
	
	hero.allStats.special.add(1 / 60);

	player1.controlManager.update();
	player1.controlManager2.update();

	//this.game.debug.body(hero);
}

var collideProjectile = function(projectile, obstacle){
	if (projectile instanceof Projectile){
		if (projectile.collideFunction == null){
			return;
		}
		
		projectile.collideFunction.call(projectile,
										obstacle);
	}
}

var collideProcessProjectile = function(projectile, obstacle){
	if (projectile instanceof Projectile){
		if (projectile.collideProcess == null){
			return false;
		}
		else{
			return projectile.collideProcess.call(projectile,
												  obstacle);
		}
	}
	else{
		if (obstacle instanceof Projectile){
			if (obstacle.collideProcess == null){
				return false;
			}
			else{
				return obstacle.collideProcess.call(obstacle,
													projectile);
			}
		}
		else{
			return true;
		}
	}
}
