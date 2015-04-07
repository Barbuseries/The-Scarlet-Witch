// TODO:  kill() and destroy() !

/********/
/* Mode */
/******************************************************************************/
var MODE_DISENGAGED = 0;
var MODE_ENGAGED = 1;

var Mode = function(entity, activationZone, name){
    if (typeof(entity) == "undefined") entity = null;

    this.entity = entity;

    this.onEngage = new Phaser.Signal();
    //  this.onUpdate = new Phaser.Signal();
    this.onDisengage = new Phaser.Signal();

	this.state = MODE_DISENGAGED;
};

Mode.prototype.engage = function(){
	if (this.state == MODE_DISENGAGED){
		this.onEngage.dispatch(this);
		
		this.state = MODE_ENGAGED;
	}
};

Mode.prototype.disengage = function(){
	if (this.state == MODE_ENGAGED){
		this.onDisengage.dispatch(this);

		this.state = MODE_DISENGAGED;
	}
};

Mode.prototype.addStat = function(statName, name, link, basicValue, basicMaxValue,
                                  min, max, upsideDown){
    if ((typeof(statName) === "string") &&
        (typeof(this[statName]) === "undefined")){
        this[statName] = new Stat(this, name, link, basicValue, basicMaxValue, min, max,
                                  upsideDown);
		
		this.onEngage.add(this[statName].grow,
						  this[statName]);
    }

}

Mode.prototype.getStat = function(statName, isPercentage, percentageFrom){
    return this._getStat(1, statName, isPercentage, percentageFrom);
}

Mode.prototype.getStatMax = function(statName, isPercentage, percentageFrom){
    return this._getStat(2, statName, isPercentage, percentageFrom);
}

Mode.prototype.getStatBasic = function(statName, isPercentage, percentageFrom){
    return this._getStat(0, statName, isPercentage, percentageFrom);
}

Mode.prototype._getStat = function(type, statName, isPercentage, percentageFrom){
    if (type >= 3){
        return undefined;
    }

    if ((typeof(statName) === "undefined") ||
        (typeof(this[statName]) === "undefined")){
        return undefined;
    }

    switch (type){
    case 0:
        return this[statName].getBasic(isPercentage, percentageFrom);
        break;

    case 1:
        return this[statName].get(isPercentage, percentageFrom);
        break;

    case 2:
        return this[statName].getMax(isPercentage, percentageFrom);

    default:
		return undefined;
		break;
    }
}
/******************************************************************************/
/* Mode */
/********/
