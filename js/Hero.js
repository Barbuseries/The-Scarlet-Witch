var DOWN_ARROW = 40;
var RIGHT_ARROW = 39;
var LEFT_ARROW = 37;
var UP_ARROW = 38;


var Hero = function(x, y, name, level, mass){
	Mob.apply(this, [x, y, null, name]);
	this.weight = G*mass;
	this.enableBody = true;
	this.runSpeed = 200;
	this.walkSpeed = 0.5 * this.runSpeed;
	this.jumpHeight = 500;
	this.downKey = DOWN_ARROW;
	this.upKey = UP_ARROW;
	this.leftKey = LEFT_ARROW;
	this.rightKey = RIGHT_ARROW;
	
	
	this.level = level;
}

Hero.prototype = Object.create(Mob.prototype);
Hero.prototype.constructor = Hero;

var Lucy = function(level){
	Hero.apply(this, [0, 0, "Lucy", level]);

	this.defaultMode.isActivated = true;
	this.defaultMode.addBasicStat("health", 30);

	var mode = new Mode(this);
	
	mode.addBasicStat("health", 42);
	mode.isActivated = true;

	this.addAdditionalMode(mode, [0, 0.5]);
}

Lucy.prototype = Object.create(Hero.prototype);
Lucy.prototype.constructor = Lucy;

Hero.prototype.move = function(){
	if (this.body.touching.down){
		this.gravityFactor = 0.5;
	}

	if(isDown(this.rightKey)){
		this.body.velocity.x =  this.runspeed;
	}
	if(isDown(this.leftKey)){
		this.body.velocity.x = -1*this.runSpeed;
	}
	if(isDown(this.upKey) && this.body.touching.down){
		this.body.velocity.y = -1*jumpHeight;
	}
	if(isDown(this.downKey) && !this.body.touching.down){
		this.gravityFactor *= 1.01;
	}
	this.body.gravity.y = (0.5 + this.gravityFactor)*this.weight;
}
