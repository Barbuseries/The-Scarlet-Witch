var Mode = function(entity, allStatsBasic, allStatsGrowth, allSkills){
    if (typeof(entity) == "undefined") entity = null;
    if (typeof(level) === "undefined") level = 0;
    if (typeof(allStatsBasic) === "undefined") allStatsBasic = [];
    if (typeof(allStatsGrowth) === "undefined") allStatsGrowth = [];
    if (typeof(allSkills) === "undefined") allSkills = [];

    this.entity = entity;

    this.allStatsBasic = allStatsBasic;

    this.allStatsGrowth = allStatsGrowth;
    this.allSkills = allSkills;

    this.cureStatusOnSet = false;
    this.healOnSet = false;

    this.isInvincible = false;
    this.invincibilityCountdown = -1;
};

// allStatsBasic : [["health", 40], ["endurance", 30, 10]]
// => maxHealth = health =  40; maxEndurance = 30, endurance  = 10;
// In case of a defaultValue (endurance), stat will not be updated when maxStat is.

// allStatsGrowth : ["health", ["level", 0.5, 2], ["endurance",  2]]
// health = basicHealth + (level^2)*0.5 + endurance * 2;


Mode.prototype.engage = function(){
    this.computeBasicStats()
};

Mode.prototype.disengage = function(){

};

// Set the statName to defaultValue and maxStatName to basicValue.
// If no statName is passed, do it for every stat.
// Be sure to call that as soon as you can, otherwhise all stats will be "undefined".
Mode.prototype.computeBasicStats = function(statName){
	if (typeof(statName) != "undefined"){
		var index = getIndexStat(statName, this.allStatsBasic);

		if (index == -1){
			return;
		}

		var maxStatName = getMaxStatName(statName);

		this[maxStatName] = this.allStatsBasic[index][1];
		
		if (this.allStatsBasic[index].length == 2){
            this[statName] = this[statMaxName];
        }
        else{
            this[statName] = this.allStatsBasic[index][2];
        }

		return;
	}

    for(var i = 0; i < this.allStatsBasic.length; i++) {
        // Get the name of the i-th stat : health, endurance, ...
        var statName = this.allStatsBasic[i][0];

        // Get the name of the i-th maxStat : maxHealth, maxEndurance, ...
        var statMaxName = getMaxStatName(statName);

        // Assign the maxStat at the given basic value :
        // maxHealth = basicHealth.
        this[statMaxName] = this.allStatsBasic[i][1];

        if (this.allStatsBasic[i].length == 2){
            this[statName] = this[statMaxName];
        }
        else{
            this[statName] = this.allStatsBasic[i][2];
        }
    }
};

// Compute all maxStats from their basicValue and their growthFromula, then update all stats
// according to type.
// type : 0 => do nothing
//        1 => restore completely
//        2 => conserve brute difference before computing
//        3 => conserve ratio before computing
Mode.prototype.computeStats = function(type){
    if (typeof(type) === "undefined") type = 0;

    var allOffsetsStats = [];
    var allFactorsStats = [];

    // Reset the basic value of maxStat.
    for(var i = 0; i < this.allStatsBasic.length; i++) {
        // Get the name of the i-th stat : health, endurance, ...
        var statName = this.allStatsBasic[i][0];

        // Get the name of the i-th maxStat : maxHealth, maxEndurance, ...
        var statMaxName = getMaxStatName(statName);


        // In both cases below (and in the case of a complete restore too),
        // If the stat has a defaultValue, the stat will not be changed.

        // Get the brute difference between stat and maxStat before computing.
        if ((type == 2) &&
            (this.allStatsBasic[i].length == 2)){
            allOffsetsStats.push([statName,
                                  this[statName] - this[statMaxName]]);
        }
        // Or get the ratio between stat and maxStat before computing.
        else if ((type == 3) &&
                 (this.allStatsBasic[i].length == 2)){
            allFactorsStats.push([statName, (this[statMaxName] == 0) ? 0 :
                                  this[statName] / this[statMaxName]]);
        }

        // Assign the maxStat at the given basic value :
        // maxHealth = basicHealth.
        this[statMaxName] = this.allStatsBasic[i][1];
    }

    // Update maxStat from it's growthFormula.
    for(var i = 0; i < this.allStatsGrowth.length; i++) {
        // Get the name of the maxStat to be updated.
        var maxStatName = "max" + this.allStatsGrowth[i][0].charAt(0).toUpperCase() +
            this.allStatsGrowth[i][0].slice(1);

        // Read through it's growthFormula.
        for(var j = 1; j < this.allStatsGrowth[i].length; j++) {
            // Inside, everything depends on a stat. But, as a stat can (and will) have
            // a different value from it's maxStat, once we get the statName, we change
            // it to maxStatName.
            var statName = this.allStatsGrowth[i][j][0];

			// If statName does not exists, go the next terme of the growthFormula.
			if (typeof(this[statName]) === "undefined"){
				continue;
			}
			// If it does exist and maxStat does, set statName to maxStatName.
			else if (typeof(this[getMaxStatName(statName)]) != "undefined"){
				statName = getMaxStatName(statName);
			}


            // The third value (if there's one) of the j-th terme of the formula
            // is understood as a power.
            if (this.allStatsGrowth[i][j].length == 3){
                this[maxStatName] += Math.pow(this[statName],
                                              this.allStatsGrowth[i][j][2]) *
                    this.allStatsGrowth[i][j][1];
            }
            else{
                this[maxStatName] += this[statName] * this.allStatsGrowth[i][j][1];
            }
        }
    }

    // Once maxStat has been taken care of, it's time to update stat.
    for(var i = 0; i < this.allStatsBasic.length; i++) {
        // As said above, if the stat has a defaultValue, it will not be updated.
        if (this.allStatsBasic[i].length == 2){
            var statName = this.allStatsBasic[i][0];
            var maxStatName = getMaxStatName(statName)

            // In case of a complete restore, stat = maxStat.
            if (type == 1){
                this[statName] = this[maxStatName];
            }
            // Otherwhise,
            else{
                var index = -1;

                // Get the difference before the update and apply it.
                if (type == 2){
                    index = getIndexStat(statName, allOffsetsStats);

                    if (index != -1){
                        this[statName] = this[maxStatName] + allOffsetsStats[index][1];
                    }
                }
                // Or get the ratio.
                else if (type == 3){
                    index = getIndexStat(statName, allFactorsStats);

                    if (index != -1){
                        this[statName] = this[maxStatName] * allFactorsStats[index][1];
                    }
                }
            }
        }
    }
};

// Create a statName and a maxStatName variable.
// If statName already exists, the new values will replace the old ones.
// If defaultValue is not defined, statName = maxStatName.
// Otherwhise, statName = defaultValue and maxStatName = basicValue.
// I don't check if defaultValue <= basicValue, it's for you to decide !
// (Don't you dare do anything stupid !)
Mode.prototype.addBasicStat = function(statName, basicValue, defaultValue){
    var index = getIndexStat(statName, this.allStatsBasic);

    // If the stat already has a basicValue, it's replaced.
    if (index != -1){
        this.allStatsBasic[index][1] = basicValue;

        if (typeof(defaultValue) != "undefined"){
            this.allStatsBasic[index][2] = defaultValue;
        }
    }
    // Otherwhise, it's added.
    else{
        if (typeof(defaultValue) === "undefined"){
            this.allStatsBasic.push([statName, basicValue]);
        }
        else{
            this.allStatsBasic.push([statName, basicValue, defaultValue]);
        }
    }
}

// Add a growthFormula for statName when the mode updates it's variables.
// If statName already exists, the new growthFormula will be ADDED to the one already
// present.
// If you want to change it completely, try using getIndexStat on the allStatsGrowth array
// and change it from there.
// The stats is growthFormula don't have to be stats in allStatsBasic.
// They could the Mode's stats.
Mode.prototype.addStatGrowth = function(statName, growthFormula){
	if (typeof(growthFormula) === "undefined") return;

	// If the stat doesn't have a basicValue, it's set to 0.
    // (No point trying to change a value which does not exist !)
    var index = getIndexStat(statName, this.allStatsBasic);

    if (index == -1){
        this.allStatsBasic.push([statName, 0]);
        this[statName] = 0;
        this[getMaxStatName(statName)] = 0;
    }

    // If the stat already has a growthFormula, add it to the rest.
    // Too much of a hassle to try to replace the common parts.
    // I don't look at the stats in the formula either, they might not
    // exist, and that's YOUR problem. Not mine. Humpf.
    index = getIndexStat(statName, this.allStatsGrowth);

    if (index != -1){
        for(var i = 0; i < growthFormula.length; i++) {
            this.allStatsGrowth[index].push(growthFormula[i]);
        }
    }
    else{
        var standardizeFormula = [statName];

        for(var i = 0; i < growthFormula.length; i++) {
            standardizeFormula.push(growthFormula[i]);
        }

        this.allStatsGrowth.push(standardizeFormula);
    }
}

// Add the value to the given stat.
// The value can be positive or negative, as far as I'm concerned.
// If isPercentage is set to true, value will be understood as a percentage of maxStatName.
// If statName + value is below minValue, it will be set to minValue.
// If statName + value is over maxValue, it will be set to maxValue.
// By default, minValue = 0, maxValue = maxStat.
Mode.prototype.addToStat = function (statName, value, isPercentage, minValue, maxValue){
	var index = getIndexStat(statName, this.allStatsBasic);

	if (index == -1){
		return -1;
	}

	var maxStatName = getMaxStatName(statName);

	if (typeof(minValue) === "undefined"){
		minValue = 0;
	}

	if (typeof(maxValue) === "undefined"){
		maxValue = this[maxStatName];
	}
	
	if ((typeof(isPercentage) != "undefined") &&
		(isPercentage)){
		value *= this[maxStatName] / 100;
		
	}

	this[statName] =
			((this[statName] + value) > maxValue) ? maxValue :
			((this[statName] + value) < minValue) ? minValue : this[statName] + value;

	return this[statName];
};


// Do the same job as addToStat but negate the value beforehand.
Mode.prototype.subtractFromStat = function(statName, value, isPercentage, minValue, maxValue){
	return this.addToStat(statName, -value, isPercentage, minValue, maxValue);
};


// Return true if the value can be added to statName.
// It means : minValue <= statName + value <= maxValue.
// By default, minValue = 0, maxValue = maxStatName.
Mode.prototype.canAddToStat = function(statName, value, isPercentage, minValue, maxValue){
	var index = getIndexStat(statName, this.allStatsBasic);

	if (index == -1){
		return false;
	}

	var maxStatName = getMaxStatName(statName);

	if (typeof(minValue) === "undefined"){
		minValue = 0;
	}

	if (typeof(maxValue) === "undefined"){
		maxValue = this[maxStatName];
	}

	if ((typeof(isPercentage) != "undefined") &&
		(isPercentage)){
		value *= this[maxStatName] / 100;
		
	}

	return	((this[statName] + value) > maxValue) ? false :
			((this[statName] + value) < minValue) ? false : true;
}


// Do the same job as canAddToStat but negate the value beforehand.
Mode.prototype.canSubtractFromStat = function(statName, value, isPercentage, minValue,
											  maxValue){
	return this.canAddToStat(statName, -value, isPercentage, minValue, maxValue);
}

// Return the index of statName in the array.
// If not found, return -1.
// Be aware that, even though "health" can be found, "maxHealth" won't.
// (But if "health" exists, then "maxHealth" does too).
function getIndexStat(statName, array){
    for(var j = 0; j < array.length; j++) {
        if (array[j][0] == statName){
            return j;
        }
    }

    return -1;
}


// Return maxStatName.
// For example, getMaxStatName("health") will return "maxHealth".
function getMaxStatName(statName){
	return "max" + statName.charAt(0).toUpperCase() + statName.slice(1);
}
