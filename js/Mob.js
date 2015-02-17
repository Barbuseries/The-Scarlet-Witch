var Mob = function(x, y, spritesheet, name){
	NPC.apply(this, [x, y, spritesheet, name]);

	this.defaultMode = new Mode(this);

	this.allAdditionalModes = [];
	this.allModesActivationsAt = [];
	
	this.allIndexesActivatedModes = [];
	
	this.level = 1;
}

Mob.prototype = Object.create(NPC.prototype);
Mob.prototype.constructor = Mob;

Mob.prototype.getStat = function (statName, inPercentage){
	if (typeof(statName) != "string") return undefined;
	if (typeof(inPercentage) === "undefined") inPercentage = false;

	var stat = undefined;
	var maxStat = undefined;
	var maxStatName = getMaxStatName(statName);
	
	if (this.defaultMode.isActivated){
		if (typeof(this.defaultMode[statName]) != "undefined"){
			stat = this.defaultMode[statName];
		}
		if (typeof(this.defaultMode[maxStatName]) != "undefined"){
			maxStat = this.defaultMode[maxStatName];
		}
	}

	for(var i = 0; i < this.allIndexesActivatedModes.length; i++) {
		var mode = this.allAdditionalModes[this.allIndexesActivatedModes[i]];

		if (typeof(mode[statName]) != "undefined"){
			if (typeof(stat) === "undefined"){
				stat = 0;
			}
			stat += mode[statName];
		}
		if (typeof(mode[maxStatName]) != "undefined"){
			if (typeof(maxStat) === "undefined"){
				maxStat = 0;
			}
			maxStat += mode[maxStat];
		}
	}

	if (inPercentage &&
		(typeof(statName) != "undefined")){
		if ((typeof(maxStat) != "undefined") &&
			(maxStat != 0)){
			return stat / maxStat * 100;
		}

		return 100;
	}
	
	return stat;
};

Mob.prototype.addAdditionalMode = function(mode, activateAt){
	if (typeof(mode) === "undefined") return;

	this.allAdditionalModes.push(mode);
	
	if (typeof(activateAt) != "undefined"){
		this.allModesActivationsAt.push(activateAt);
	}
	
	if (mode.isActivated){
		this.allIndexesActivatedModes.push(this.allAdditionalModes.length - 1);
	}
};

