var Hero = function(x, y, name, level){
	Mob.apply(this, [x, y, null, name]);

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
