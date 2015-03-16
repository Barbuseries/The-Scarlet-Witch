BasicGame.Level1 = function(game){

}

BasicGame.Level1.prototype.preload = function(){
}

var map;
var sky;
var player1;
var hero;

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
	hero.firstSkill = new Skill(this.game, hero, undefined, undefined, 5000, "ennemy");
	hero.firstSkill.onUse.add(function(){hero.animations.play("spellCast")});
	
	hero.special = new Stat(this.game, "special", STAT_PERCENT_LINK, 100);
	
	hero.secondSkill = new ProjectileSkill(this.game, hero, undefined, undefined, 1000, "blood",
										   this.bloodPool, "enemy");
	hero.secondSkill.onUse.add(function(){hero.animations.play("spellCast")});
	hero.secondSkill.trajectory = [function(){	
		this.x = hero.x + 16;
		this.y = hero.y + 32;

		this.game.physics.enable([this], Phaser.Physics.ARCADE);

		this.body.velocity.x = 500 * hero.scale.x;
		this.body.gravity.y = -500;

		this.checkWorldBounds = true;
		this.outOfBoundsKill = true;
	}, []];

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
		
        hero.body.velocity.y = hero.JUMP_POWER * Math.abs(factor);
    }

	hero.stopMov = function(){
		if (hero.orientation != 0){
			hero.animations.stop("walk");
			hero.frame = 143;
		}
			
		hero.orientation = 0;
	}
	
	hero.cast = function(){
		hero.firstSkill.useSkill();
	}

	hero.castSecond = function(){
		hero.secondSkill.useSkill();
	}

    player1.controlManager = new ControlManager(this.game, CONTROL_KEYBOARD, hero);
    player1.controlManager2 = new ControlManager(this.game, CONTROL_GAMEPAD, hero, "pad1");

	player1.controlManager2.bindControl("up", Phaser.Gamepad.XBOX360_A,
                                        "goUp",
                                        "down", "movement");
	player1.controlManager2.bindControl("up2", Phaser.Gamepad.XBOX360_A,
                                        "reduceJump",
                                        "onDown", "movement");

	player1.controlManager2.bindControl("fly", Phaser.Gamepad.XBOX360_Y,
                                        "fly",
                                        "down", "movement");
	
    player1.controlManager2.bindPadControl("rightPad", Phaser.Gamepad.XBOX360_STICK_LEFT_X,
                                           0.1, 1, "goRight", "update", "movement");
	/*player1.controlManager2.bindPadControl("stopMovPad", Phaser.Gamepad.XBOX360_STICK_LEFT_X,
                                           0, 0, "stopMov", "update", "movement");*/
	
    player1.controlManager2.bindPadControl("leftPad", Phaser.Gamepad.XBOX360_STICK_LEFT_X,
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
