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
	
	hero.secondSkill = new Skill(this.game, hero, undefined, undefined, 1000, "enemy");

	var bloodPool = this.bloodPool;

	hero.secondSkill.launchFunction = function(){
		function initProjectile(){
			this.x = hero.x + 24;
			this.y = hero.y + 36;
			
			this.game.physics.enable([this], Phaser.Physics.ARCADE);
			
			this.body.velocity.x = 500 * hero.scale.x;
			this.body.gravity.y = -500;
			
			this.checkWorldBounds = true;
			this.outOfBoundsKill = true;
			
			//this.lifespan = 1000;
			
			this.width /= 2;
			this.height /= 2;
			
			this.anchor.setTo(0.5);

			this.animations.add("walk", [144, 145, 146, 147, 148, 149, 150, 151], 15);
			this.animations.play("walk", 15, true);
		}

		function updateProjectile(){
			//this.alpha = this.lifespan / 1000;
		}

		function killProjectile(){
			console.log("I'was KILLED !");

			Phaser.Sprite.prototype.kill.call(this);
		}

		var newProjectile = createProjectile(this.game, 0, 0, "lucy", bloodPool,
											 initProjectile, updateProjectile,
											 killProjectile);
	}

	hero.secondSkill.onUse.add(function(){hero.animations.play("spellCast")});
	hero.secondSkill.createCooldownBar(24, 0, 20, 5, H_YELLOW);
	hero.addChild(hero.secondSkill.cooldownBar);

	hero.thirdSkill = new Skill(this.game, hero, undefined, undefined, 500, "enemy");
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

			//this.tint = H_RED;

			this.angle = -90 * hero.orientationV;
		}

		function initProjectile(){
			this.x = hero.x + hero.width * 3 / 4 * hero.scale.x;
			this.y = hero.y + hero.height * 0.65;

			this.anchor.setTo(0.5);

			this.frame = 0;
			
			this.lifespan = 1000;
			
			this.animations.add("slash", [0, 0, 1, 1, 2, 2, 3]);
			
			this.animations.play("slash", 60 / 7);

			this.game.physics.enable([this], Phaser.Physics.ARCADE);
			this.body.velocity.x = 200 * hero.scale.x;
			this.body.allowGravity = false;

			this.scale.x = hero.scale.x / Math.abs(hero.scale.x);

			//this.scale.x *= 0.5;
			this.scale.y *= 0.5;

			//this.tint = H_RED;

			this.angle = -90 * hero.orientationV;
		}

		function updateProjectile(){
			//this.scale.x = this.lifespan / 200;
			//this.scale.y = this.lifespan / 200;
		}

		var newMainProjectile = createProjectile(this.game, 0, 0, "slash",
												 slashPool, initMainProjectile);

		var timer = this.game.time.create(true);
		
		timer.add(250, function(){
			createProjectile(this.game, 0, 0, "slash", slashPool,
							 initProjectile, updateProjectile);
		}, this);

		timer.start();
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
