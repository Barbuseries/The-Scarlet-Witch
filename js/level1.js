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
				map.layer.data[i][j]._dying = false;
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

	for(var i in BasicGame.pool) {
		BasicGame.pool[i] = this.game.add.group();
	}
	
	BasicGame.allHeroes = this.game.add.group();
	BasicGame.allEnnemies = this.game.add.group();

	this.testPlayer = {};
	this.testPlayer.controller = new ControlManager(this.game, CONTROL_KEYBOARD,
													null, "pad1");
	this.testPlayer2 = {};
	this.testPlayer2.controller = new ControlManager(this.game, CONTROL_KEYBOARD,
													 null, "pad2");

	this.barton = new Barton(this.game, 1000, 200, 99, this.testPlayer);
	this.barton.scale.setTo(1.3);
	this.barton.tag = "enemy";
	this.barton.allResistances[Elements.FIRE] = 2;
	this.barton.allStats.endurance.add(100);
	this.barton.allStats.health.set(1, 1);

	this.createBaddies();

	this.lucy = new Lucy(this.game, 600, 500, 1, this.testPlayer2);
	this.lucy.allStats.mainStat.add(100);
	this.lucy.allStats.agility.add(99);
	this.lucy.allStats.special.set(1, 1);
	this.lucy.allResistances[Elements.WIND] = 0.5;
	this.lucy.allResistances[Elements.PHYSIC] = -0.5;

	BasicGame.allHeroes.add(this.barton);
	BasicGame.allHeroes.add(this.lucy);

	BasicGame.allPlayers.p1.setHero(this.barton);
	BasicGame.allPlayers.p2.setHero(this.lucy);

	BasicGame.sfx = {};

	BasicGame.sfx.EXPLOSION_0 = this.game.add.audio("explosion_0");
	BasicGame.sfx.EXPLOSION_0.allowMultiple = true;

    //this.game.platforms.debug = true;

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
	function costSkill1(applyCost){
		if (this.user.allStats.special.canSubtract(10)){
			if (applyCost){
				this.user.allStats.special.subtract(10);
			}

			return true;
		}
		else{
			return false;
		}
	}

	this.lucy.allSkills[1].firstSkill = new Skill(this.lucy, 1, costSkill1,
												  10000, Elements.ALMIGHTY,
												  ["platform"]);
	this.lucy.allSkills[1].firstSkill.icon = "teleport_icon";

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


	// launchFunction est appelé dès que le skill est utilisé (le joueur appuie
	// sur la touche et il a assez de special pour le lancer)
	this.lucy.allSkills[1].firstSkill.launchFunction = function(){
		var self = this;
		var hero = this.user;

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
			
			this.body.velocity.x = 600;
			
			if (hero.orientationH < 0){
				this.body.velocity.x *= -1;
			}

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
			
			return false;
		}

		hero.animations.stop("spellCastRight");
		hero.animations.stop("spellCastLeft");

		// Le héros lance une animation.
		// N.B : Le skill a aussi un attribut user qui correspond à hero.
		//       this.user.animations.play("spellCast") est donc équivalent.
		//       Par contre, un projectile n'en possède pas, il faut donc faire
		//       quelque chose du genre:
		//
		//       var hero = this.user;
		//       Puis, dans les fonctions du projectile, utiliser hero.
		if (hero.orientationH >= 0){
			hero.animations.play("spellCastRight");	
		}
		else{
			hero.animations.play("spellCastLeft");
		}

		timer = this.game.time.create(true);

		// Même raison que pour bloodPool.
		var game = this.game;

		// Crée le projectile 100 millisecondes après le lancement du skill.
		timer.add(100, function(){createProjectile(game, 0, 0,
												   hero.name.toLowerCase(),
												   initProjectile, updateProjectile,
												   killProjectile);});	
		
		// Encore une fois, ne pas oublier de démarrer le timer !
		timer.start();
	}
	/******************************************************************************/

	this.lucy.allStats.attackSpeed.onUpdate.add(function(stat, oldValue, newValue){
		this.allSkills[0].firstSkill.setCooldown(newValue);
	}, this.lucy);
	this.lucy.allSkills[1].secondSkill = new Skill(this.lucy, 1, undefined,
												   5000, Elements.WIND);
	this.lucy.allSkills[1].secondSkill.icon = "barrier_icon";

	this.lucy.allSkills[1].secondSkill.launchFunction = function(){
		var hero = this.user;

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

			this.element = Elements.WIND;

			this.lifespan = 4500;

			this.tint = H_ORANGE;

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
			createProjectile(this.game, 0, 0, "slash",
							 function(){initProjectile.call(this, i * angle)},
							 updateProjectile);
		}

		hero.animations.stop("spellCastRight");
		hero.animations.stop("spellCastLeft");

		if (hero.orientationH >= 0){
			hero.animations.play("spellCastRight");	
		}
		else{
			hero.animations.play("spellCastLeft");
		}
	}
	
	this.lucy.fly = function(){
		if (this.lucy.body.velocity.y > 0){
			this.lucy.body.velocity.y /= 1.5;
			this.lucy.body.drag.setTo(0, 0);
		}
	}

	/*this.testPlayer.controller.bindControl("leftControl", Phaser.Keyboard.Q,
										   Phaser.Gamepad.XBOX360_DPAD_LEFT,
										   "goLeft", "down", "movement");
	this.testPlayer.controller.bindControl("rightControl", Phaser.Keyboard.D,
										   Phaser.Gamepad.XBOX360_DPAD_RIGHT,
										   "goRight", "down", "movement");
	this.testPlayer.controller.bindControl("jumpControl", Phaser.Keyboard.Z,
										   Phaser.Gamepad.XBOX360_A,
										   "jump", "down", "movement");
	this.testPlayer.controller.bindControl("reduceJumpControl", Phaser.Keyboard.Z,
										   Phaser.Gamepad.XBOX360_A,
										   "reduceJump", "onDown", "movement");
	this.testPlayer.controller.bindControl("swapControls", Phaser.Keyboard.ENTER,
										   Phaser.Gamepad.XBOX360_BACK,
										   "swapControls", "onDown", "action",
										   this.testPlayer.controller);
	this.testPlayer.controller.bindControl("swapMode", Phaser.Keyboard.U, -1,
										   "swapMode", "onDown", "action");
	this.testPlayer.controller.bindControl("castFirst", Phaser.Keyboard.Y, -1,
										   "castFirst", "down", "action");
	this.testPlayer.controller.bindControl("castThird", Phaser.Keyboard.I, -1,
										   "castThird", "down", "action");
	this.testPlayer.controller.bindControl("castFourth", Phaser.Keyboard.O, -1,
										   "castFourth", "down", "action");
	this.testPlayer.controller.bindControl("castFifth", Phaser.Keyboard.P, -1,
										   "castFifth", "down", "action");
	this.testPlayer.controller.bindControl("releaseFirst", Phaser.Keyboard.Y, -1,
										   "releaseFirst", "onUp", "action");
	this.testPlayer.controller.bindControl("releaseThird", Phaser.Keyboard.I, -1,
										   "releaseThird", "onUp", "action");
	this.testPlayer.controller.bindControl("releaseFourth", Phaser.Keyboard.O, -1,
										   "releaseFourth", "onUp", "action");
	this.testPlayer.controller.bindControl("releaseFifth", Phaser.Keyboard.P, -1,
										   "releaseFifth", "onUp", "action");
	
	this.testPlayer2.controller.bindControl("leftControl", Phaser.Keyboard.LEFT, -1,
											"goLeft", "down", "movement");
	this.testPlayer2.controller.bindControl("rightControl", Phaser.Keyboard.RIGHT, -1,
											"goRight", "down", "movement");
	this.testPlayer2.controller.bindControl("jumpControl", Phaser.Keyboard.UP, -1,
											"jump", "down", "movement");
	this.testPlayer2.controller.bindControl("reduceJumpControl", Phaser.Keyboard.UP,
											-1,
											"reduceJump", "onDown", "movement");
	this.testPlayer2.controller.bindControl("castFirst", Phaser.Keyboard.ONE, -1,
											"castFirst", "down", "action");
	this.testPlayer2.controller.bindControl("castSecond", Phaser.Keyboard.TWO, -1,
											"castSecond", "down", "action");
	this.testPlayer2.controller.bindControl("castThird", Phaser.Keyboard.THREE, -1,
											"castThird", "down", "action");
	this.testPlayer2.controller.bindControl("castFourth", Phaser.Keyboard.FOUR, -1,
											"castFourth", "down", "action");
	this.testPlayer2.controller.bindControl("castFifth", Phaser.Keyboard.FIVE, -1,
											"castFifth", "down", "action");
	this.testPlayer2.controller.bindControl("swapMode", Phaser.Keyboard.TAB, -1,
											"swapMode", "onDown", "action");
	this.testPlayer2.controller.bindControl("releaseFirst", Phaser.Keyboard.ONE, -1,
											"releaseFirst", "onUp", "action");
	this.testPlayer2.controller.bindControl("releaseSecond", Phaser.Keyboard.TWO, -1,
											"releaseSecond", "onUp", "action");
	this.testPlayer2.controller.bindControl("releaseThird", Phaser.Keyboard.THREE, -1,
											"releaseThird", "onUp", "action");
	this.testPlayer2.controller.bindControl("releaseFourth", Phaser.Keyboard.FOUR, -1,
											"releaseFourth", "onUp", "action");
	this.testPlayer2.controller.bindControl("releaseFifth", Phaser.Keyboard.FIVE, -1,
											"releaseFifth", "onUp", "action");*/

	//this.testPlayer.controller.type = CONTROL_GAMEPAD;

	this.barton.allSkills[1].firstSkill = new Skill(this.barton, 1,	undefined,
													this.barton.allStats.attackSpeed.get(),
													Elements.PHYSIC, ["platform",
																	  "hero"]);
	this.barton.allSkills[1].firstSkill.costFunction = function(applyCost){
		if (this.user.allStats.quiver.canSubtract(1)){
			if (applyCost){
				this.user.allStats.quiver.subtract(1);
			}
			
			return true;
		}
		else{
			return false;
		}
	}

	this.barton.allSkills[1].firstSkill.launchFunction = function(factor){
		if (!this.user.animations.currentAnim.isFinished){
			this.user.animations.currentAnim.onComplete.addOnce(
				function(){
					this.launchFunction.call(this, factor);
				}, this);
			return;
		}
		
		var self = this;
		var hero = this.user;

		function initProjectile(){
			var speed = -600 * (1 + factor);

			this.anchor.set(0, 0.5);
			
			this.x = hero.x;
			this.y = hero.y + 2 * hero.width / 4;

			this.frame = 0;

			if (hero.orientationH >= 0){
				this.x += hero.width / 2;
				speed *= -1;

				this.frame = 1;
			}

			this.game.physics.enable(this, Phaser.Physics.ARCADE);
			this.body.allowGravity = true;
			this.body.velocity.y = -35 * (1 + factor);

			this.body.velocity.x = speed;

			this.lifespan = 2000;

			this.alpha = 1;

			this.tint = H_WHITE;

			this.element = self.element;
		}

		function damageFunction(obstacle){
			// Les dégâts sont aussi en fonction de la distance parcourue.
			var damage = self.user.allStats.attack.get() * (1 + factor +
															(1 - (this.lifespan - 1200) / 800));
			var damageRange = [0.9, 1.1];
			var criticalRate = self.user.allStats.criticalRate.get();
			
			obstacle.suffer(damage, damageRange, criticalRate, this.element);
		}

		function updateFunction(){
			if (this.lifespan < 1000){
				this.alpha = this.lifespan / 1000;
			}

			this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);
		}

		function collideFunction(obstacle){
			if (obstacle.tag != "platform"){
				this.damageFunction(obstacle);
				this.kill();
			}
			else{
				// Remplace la flêche par un sprite, parce que ça fait classe !

				var selfSprite = this.game.add.sprite(this.x, this.y, this.key);

				selfSprite.anchor.x = this.anchor.x;
				selfSprite.anchor.y = this.anchor.y;
				selfSprite.frame = this.frame;
				selfSprite.rotation = this.rotation;
				selfSprite.tint = this.tint;
				selfSprite.scale.x = this.scale.x;
				selfSprite.scale.y = this.scale.y;

				selfSprite.tween = this.game.add.tween(selfSprite)
					.to({alpha: 0}, 3000, Phaser.Easing.Quadratic.Out);

				selfSprite.tween.start();

				this.kill();
			}
		}

		function collideProcess(obstacle){
			// La flêche change d'élément en fonction de ce qu'elle rencontre.
			if (obstacle.tag == "projectile"){
				this.tint = H_WHITE;

				switch(obstacle.element){
				case Elements.ALMIGHTY:
					this.tint = H_GREY;
					break;
				case Elements.FIRE:
					this.tint = H_RED;
					break;
				case Elements.ICE:
					this.tint = H_BLUE;
					break;
				case Elements.WIND:
					this.tint = H_GREEN;
					break;
				case Elements.ROCK:
					this.tint = H_ORANGE;
					break;
				case Elements.THUNDER:
					this.tint = H_YELLOW;
					break;
				default:
					break;
				}

				this.element = obstacle.element;
			}
			return (this.targetTags.indexOf(obstacle.tag) != -1) &&
				this.body.allowGravity;
		}

		createProjectile(this.game, 0, 0, "arrow",
						 initProjectile, updateFunction, 
						 undefined, collideFunction,
						 collideProcess, damageFunction).targetTags = this.targetTags;

		var animation = null;

		if (this.user.orientationH >= 0){
			animation = this.user.animations.play("unbendBowRight", 15);
		}
		else{
			animation = this.user.animations.play("unbendBowLeft", 15);
		}
		
		animation.onComplete.addOnce(
			function(){
				if (typeof(this.user.player)!= "undefined"){
					this.user.player.controller.enable(["movement", "action"]);
				}
			}, this);
	}
	
	this.barton.allSkills[1].firstSkill.setChargeTime(2 * this.barton.allStats.attackSpeed.get());
	this.barton.allSkills[1].firstSkill.icon = "arrow_icon";
	this.barton.allSkills[1].firstSkill.onCharge.add(function(){
		if (this.user.orientationH >= 0){
			this.user.animations.play("bendBowRight", 20);
		}
		else{
			this.user.animations.play("bendBowLeft", 20);
		}

		if (typeof(this.user.player)!= "undefined"){
			this.user.player.controller.disable(["movement", "action"]);
			this.user.player.controller.get("releaseFirst").enabled = true;
			this.user.player.controller.get("castFirst").enabled = true;
			this.user.player.controller.get("jump").enabled = true;
			this.user.player.controller.get("reduceJump").enabled = true;
		}
	}, this.barton.allSkills[1].firstSkill);

	this.barton.quiverRegen = this.game.time.create(false);
	this.barton.quiverRegen.loop(this.barton.allStats.attackSpeed.get() * 6, function(){
		this.quiver.add(1);
	}, this.barton.allStats);

	this.barton.quiverRegen.start();

	this.game.world.bringToTop(BasicGame.pool.textDamage);
}

BasicGame.Level1.prototype.update = function (){
    // Collisions
	for(var i in BasicGame.pool) {
		this.game.physics.arcade.overlap(BasicGame.pool[i], this.game.platforms,
										 collideProjectile, collideProcessProjectile);

		if (i != "textDamage"){
			this.game.physics.arcade.overlap(BasicGame.pool[i], BasicGame.allHeroes,
											 collideProjectile,
											 collideProcessProjectile);
			this.game.physics.arcade.overlap(BasicGame.pool[i], this.game.baddies,
											 collideProjectile,
											 collideProcessProjectile);

			for(var j in BasicGame.pool){
				if (i == j){
					continue;
				}

				this.game.physics.arcade.overlap(BasicGame.pool[i], BasicGame.pool[j],
												 collideProjectile,
												 collideProcessProjectile);
			}
		}
	}
	
	this.game.physics.arcade.overlap(BasicGame.allHeroes, this.game.platforms);
	this.game.physics.arcade.overlap(this.game.baddies, this.game.platforms);
	this.game.physics.arcade.collide(this.game.baddies, BasicGame.allHeroes);

	this.lucy.allStats.special.add(0.01 / 60, 1);
	this.lucy.allStats.health.add(0.01, 1);

	this.barton.body.acceleration.x = 0;
	this.lucy.body.acceleration.x = 0;

	/*this.testPlayer.controller.update();
	this.testPlayer2.controller.update();*/
	for(var i in BasicGame.allPlayers){
		BasicGame.allPlayers[i].controller.update();
	}
	
	this.lucy.allStats.experience.add(100);
}

BasicGame.Level1.prototype.createBaddies = function() {
	// create baddies
	this.game.baddies = this.game.add.group();
	this.game.baddies.enableBody = true;
	this.game.physics.enable(this.game.baddies, Phaser.Physics.ARCADE);

	var baddie;

	result = this.findObjectsByType('enemy', this.game.platforms.map, 'baddies');
	result.forEach(function(element){
		this.createFromTiledObject(element, this.game.baddies);
	}, this);

	this.game.baddies.forEach(function(element){
		element.tag = "enemy";
	});
	
	return this.game.baddies;
}

BasicGame.Level1.prototype.findObjectsByType = function(type, map, layer){
	var result = new Array();
	map.objects[layer].forEach(function(element) {
		if (element.properties.type === type) {
			// Phaser uses top left, Tiled bottom left so we have to adjust the y position
			// also keep in mind that the cup images are a bit smaller than the tile which is 16x16
			// so they might not be placed in the exact pixel position as in Tiled
			element.y -= map.tileHeight;
			result.push(element); 
		}
	});
	return result;
}

BasicGame.Level1.prototype.createFromTiledObject = function(element, group) {
	var sprite = new Mob(group.game, element.x, element.y, element.properties.sprite);

	group.add(sprite);
	// copy all properties to the sprite
	Object.keys(element.properties).forEach(function(key){
		sprite[key] = element.properties[key];
	});

	//sprite.x = 0;
	sprite.y -= sprite.height;
}

var collideProjectile = function(projectile, obstacle){
	if (projectile.tag == "projectile"){
		if (projectile.collideFunction == null){
			return;
		}
		
		projectile.collideFunction.call(projectile,
										obstacle);
		if (typeof(obstacle.body) != "undefined"){
			obstacle.body.velocity.x += projectile.body.velocity.x;
			obstacle.body.velocity.y += projectile.body.velocity.y;
		}
	}
}

var collideProcessProjectile = function(projectile, obstacle){
	if (projectile.tag == "projectile"){
		if (projectile.collideProcess == null){
			return false;
		}
		else{
			return (!obstacle._dying && projectile.collideProcess.call(projectile,
																	   obstacle));
		}
	}
	else{
		if (obstacle.tag == "projectile"){
			if (obstacle.collideProcess == null){
				return false;
			}
			else{
				return (!projectile._dying && obstacle.collideProcess.call(obstacle,
													projectile));
			}
		}
		else{
			return true;
		}
	}
}
