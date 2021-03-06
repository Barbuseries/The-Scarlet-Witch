/********/
/* Stat */
/******************************************************************************/

var STAT_NO_MAXSTAT = -1; // No maxStat is created.
var STAT_NO_LINK = 0; // No link between stat and maxStat (except for the fact
                      // that stat can not be greater than maxStat).
var STAT_BRUT_LINK = 1; // Brut link between stat and maxStat (if maxStat
                        // increases by 3, so do stat).
var STAT_PERCENT_LINK = 2; // Percentage link between stat and
                           // maxStat (if stat is equal to 30% of maxStat
                           // before maxStat increases, it will be 30% again after)
var STAT_EQUAL_LINK = 3; // Why not ?


// If upsideDown, you can go past maxValue (not max) but not below maxValue (nor min).
// Good for stats which are better if smaller (attackDelay, ...).
var Stat = function(entity, name, link, basicValue, basicMaxValue, min, max,
					upsideDown){
	if (typeof(entity) != "object") entity = null;
	if (typeof(basicValue) != "number") basicValue = 0;
	if (typeof(basicMaxValue) != "number") basicMaxValue = basicValue;
	if (typeof(min) != "number") min = 0;
	if (typeof(max) != "number") max = Infinity;
	if (!booleanable(upsideDown)) upsideDown = false;

	this.entity = entity;

    this.name = name;
    this._link = link;

    this._basicValue = basicValue;
    this._value = basicValue;

	this.onUpdateMax = new Phaser.Signal(); // (add/subtract/setMax)
    this.onUpdateMax.add(this._applyLink, this); // When this._maxValue changes,
	                                              // apply the changes to this._value.

    if (link != STAT_NO_MAXSTAT){
        this._maxValue = basicMaxValue;
		this._basicValue = basicMaxValue;
    }

    this._min = min;
    this._max = max;

    this._upsideDown = upsideDown;

    this.factor = 1;

	function basicGrowth(){
		return this._basicValue;
	}

	this.growth = [basicGrowth, null, [this]];
	this.growthResult = this._basicValue;

    this.onUpdate = new Phaser.Signal(); // (add/subtract/set)
	this.onUpdateLink = new Phaser.Signal();
    this.onUpdateBasic = new Phaser.Signal(); // (add/subtrac/setBasic)

	this.onUpdateBasic.add(this.grow,
						   this); // If this._basicValue changes,
	                              // recompute this.growth.
	                              // You need to do that for each terme of
	                              // this.growth.

	this.onGrowth = new Phaser.Signal();
	
	this.onGrowth.add(this._applyGrowth, this);

	this.onDestroy = new Phaser.Signal();
}

// Add value to this._value.
// If isPercentage : value = 0.5 <=> 50%.
//                   value = 0.5 <=> value = 0.5 * percentageFrom.
// By default, percentageFrom = this._maxValue, if there's any this._value otherwhise.
// Dispatch this.onUpdate. (Even if this._value is the same)
Stat.prototype.add = function (value, isPercentage, percentageFrom, updateType){
    this._addTo(1, value, isPercentage, percentageFrom, updateType);
};

// Add value to this._basicValue.
// Same as above.
// Dispatch this.onUpdateBasic. (Even if this._basicValue is the same)
Stat.prototype.addBasic = function(value, isPercentage, percentageFrom){
    this._addTo(0, value, isPercentage, percentageFrom, updateType);
}

// Add value to this._maxValue.
// Same as above.
// Dispatch this.onUpdateMax. (Even if this._maxValue is the same)
Stat.prototype.addMax = function(value, isPercentage, percentageFrom){
    if (this._link == STAT_NO_MAXSTAT){
        return;
    }

    this._addTo(2, value, isPercentage, percentageFrom);
}

Stat.prototype._addTo = function(type, value, isPercentage, percentageFrom,
								 updateType){
    if (typeof(value) != "number"){
        return;
    }

    if (booleanable(isPercentage) &&
        isPercentage){
        if (typeof(percentageFrom) === "undefined"){
            percentageFrom = (this._link != STAT_NO_MAXSTAT) ? this._maxValue : this._value;
        }
        value *=  percentageFrom;
    }

    function getFinalValue(variable, value, min, max){
        return ((variable + value) > max) ? max :
            ((variable + value) < min) ? min : variable + value;
    }

    if (type == 0){
        var oldValue = this._basicValue;

        this._basicValue = getFinalValue(this._basicValue, value,
                                         this._min, this._max);

        this.onUpdateBasic.dispatch(this, oldValue, this._basicValue);
    }
    else if (type == 1){
        var oldValue = this._value;

        if (this._upsideDown){
			if (this._link == STAT_NO_MAXSTAT){
				this._value = getFinalValue(this._value, value,
											this._min, this._max);
			}
			else{
				this._value = getFinalValue(this._value, value,
											this._maxValue, this._max);
			}
        }
        else{
			if (this._link == STAT_NO_MAXSTAT){
				this._value = getFinalValue(this._value, value,
											this._min, this._max);
			}
			else{
				this._value = getFinalValue(this._value, value,
											this._min, this._maxValue);
			}
        }

		if (!booleanable(updateType) || !updateType){
			this.onUpdate.dispatch(this, oldValue, this._value);
		}
		else{
			this.onUpdateLink.dispatch(this, oldValue, this._value);
		}
    }
    else if ((type == 2) &&
             (this._link != STAT_NO_MAXSTAT)){
        var oldValue = this._maxValue;

        this._maxValue = getFinalValue(this._maxValue, value,
                                       this._min, this._max);

        this.onUpdateMax.dispatch(this, oldValue, this._maxValue);
    }
}

// Subtract value from this._value.
// Do the same as add but negate the value beforehand.
Stat.prototype.subtract = function(value, isPercentage, percentageFrom, updateType){
    this.add(-1 * value, isPercentage, percentageFrom, updateType);
}

// Subtract value to this._maxValue.
// Same as above.
Stat.prototype.subtractMax = function(value, isPercentage, percentageFrom){
    if (this._link == STAT_NO_MAXSTAT){
        return;
    }

    this.addMax(-1 * value, isPercentage, percentageFrom);
}

// Subtract value to this._basicValue.
// Same as above.
Stat.prototype.subtractBasic = function(value, isPercentage, percentageFrom){
    this.addBasic(-1 * value, isPercentage, percentageFrom);
}

// Return true if you can add value to this._value "as is", false otherwhise.
Stat.prototype.canAdd = function(value, isPercentage, percentageFrom){
    return this._canAddTo(1, value, isPercentage, percentageFrom);
}

// Return true if you can add value to this._basicValue "as is", false otherwhise. 
Stat.prototype.canAddBasic = function(value, isPercentage, percentageFrom){
    return this._canAddTo(0, value, isPercentage, percentageFrom);
}

// Return true if you can add value to this._maxValue "as is", false otherwhise.
Stat.prototype.canAddMax = function(value, isPercentage, percentageFrom){
    if (this._link == STAT_NO_MAXSTAT){
        return false;
    }

    return this._canAddTo(2, value, isPercentage, percentageFrom);
}

Stat.prototype._canAddTo = function(type, value, isPercentage, percentageFrom){
    if (typeof(value) != "number"){
        return false;
    }

    if (booleanable(isPercentage) &&
        isPercentage){
        if (typeof(percentageFrom) === "undefined"){
            percentageFrom = (this._link != STAT_NO_MAXSTAT) ? this._maxValue : this._value;
        }
        value *=  percentageFrom;
    }

    function getFinalValue(variable, value, min, max){
        return ((variable + value) > max) ? false :
            ((variable + value) < min) ? false : true;
    }

    if (type == 0){
        return getFinalValue(this._basicValue, value,
                             this._min, this._max);
    }
    else if (type == 1){
        if (this._upsideDown){
			if (this._link == STAT_NO_MAXSTAT){
				return getFinalValue(this._value, value,
									 this._min, this._max);
			}
			else{
				return getFinalValue(this._value, value,
									 this._maxValue, this._max);
			}
        }
        else{
			if (this._link == STAT_NO_MAXSTAT){
				return getFinalValue(this._value, value,
									 this._min, this._max);
			}
			else{
				return getFinalValue(this._value, value,
									 this._min, this._maxValue);
			}
        }
    }
    else if ((type == 2) &&
             (this._link != STAT_NO_MAXSTAT)){
        return getFinalValue(this._maxValue, value,
                             this._min, this._max);
    }
}

// Return true if you can subtract value from this._value "as is", false otherwhise.
Stat.prototype.canSubtract = function(value, isPercentage, percentageFrom){
    return this.canAdd(-1 * value, isPercentage, percentageFrom);
}

// Return true if you can subtract value from this._maxValue "as is", false otherwhise.
Stat.prototype.canSubtractMax = function(value, isPercentage, percentageFrom){
    if (this._link == STAT_NO_MAXSTAT){
        return false;
    }

    return this.canAddMax(-1 * value, isPercentage, percentageFrom);
}

// Return true if you can subtract value from this._basicValue "as is",
// false otherwhise.
Stat.prototype.canSubtractBasic = function(value, isPercentage, percentageFrom){
    return this.canAddBasic(-1 * value, isPercentage, percentageFrom);
}

// Modify this._value relatively to this._maxValue.
// By default, called each time this.onUpdateMax is dispatched.
// If this._maxValue hasn't change, do nothing.
Stat.prototype._applyLink = function(self, oldMaxValue, newMaxValue){
	if (oldMaxValue == newMaxValue){
		return;
	}

    switch(this._link){
    case STAT_NO_MAXSTAT:
        return;
        break;

    case STAT_NO_LINK:
        if (this._upsideDown){
            if (this._value < newMaxValue){
                this.set(newMaxValue, 0, undefined, 1);
            }
        }
        else{
            if (this._value > newMaxValue){
                this.set(newMaxValue, 0, undefined, 1);
            }
        }
        break;

    case STAT_BRUT_LINK:
        this.add(newMaxValue - oldMaxValue, 0, undefined, 1);
        break;

    case STAT_PERCENT_LINK:
		(oldMaxValue == 0) ? this.set(1, 1, undefined, 1) : this.set(this._value / oldMaxValue * newMaxValue, 0, undefined, 1);
        break;

    case STAT_EQUAL_LINK:
        this.set(newMaxValue, 0, undefined, 1);
        break;

    default:
        return;
    }
}

// Set this._value to value.
// Dispatch this.onUpdate. (Even if this._value is the same)
Stat.prototype.set = function(value, isPercentage, percentageFrom, updateType){
    this._setTo(1, value, isPercentage, percentageFrom, updateType);
}

// Set this._maxValue to value.
// Dispatch this.onUpdateMax. (Even if this._maxValue is the same)
Stat.prototype.setMax = function(value, isPercentage, percentageFrom){
    this._setTo(2, value, isPercentage, percentageFrom);
}

// Set this._basicValue to value.
// Dispatch this.onUpdateBasic. (Even if this._basicValue is the same)
Stat.prototype.setBasic = function(value, isPercentage, percentageFrom){
    this._setTo(0, value, isPercentage, percentageFrom);
}


Stat.prototype._setTo = function(type, value, isPercentage, percentageFrom, updateType){
    if (type >= 3){
        return;
    }
    if (typeof(value) != "number"){
        return;
    }

    if (booleanable(isPercentage) &&
        isPercentage &&
	   (typeof(percentageFrom) === "undefined")){
        switch (type){
        case 0:
            value *= this._basicValue;
            break;

        case 1:
            value *= this._maxValue;
            break;

        case 2:
            value *= this._maxValue;
            break;

        default:
            break;
        }
    }

    function getFinalValue(value, min, max){
        return ((value > max) ? max :
                (value < min) ? min : value);
    }

    if (type == 0){
		value = getFinalValue(value, this._min, this._max);

        var oldValue = this._basicValue;
		
        this._basicValue = value;
		
        this.onUpdateBasic.dispatch(this, oldValue, this._basicValue);
    }
    else if (type == 1){
        if (this._upsideDown){
			value = getFinalValue(value, this._maxValue, this._max);
            
            var oldValue = this._value;
			
            this._value = value;
			
			if (!booleanable(updateType) || !updateType){
				this.onUpdate.dispatch(this, oldValue, this._value);
			}
			else{
				this.onUpdateLink.dispatch(this, oldValue, this._value);
			}
        }
        else{
			value = getFinalValue(value, this._min, this._maxValue);

            var oldValue = this._value;
			
            this._value = value;
			
			if (!booleanable(updateType) || !updateType){
				this.onUpdate.dispatch(this, oldValue, this._value);
			}
			else{
				this.onUpdateLink.dispatch(this, oldValue, this._value);
			}
        }
    }
    else if (type == 2){
        if (this._link != STAT_NO_MAXSTAT){
			value = getFinalValue(value, this._min, this._max);
         
            var oldValue = this._maxValue;
			
            this._maxValue = value;
			
            this.onUpdateMax.dispatch(this, oldValue, this._maxValue);
        }
    }

}

// Return true if this._value can be set to value "as is", false otherwhise.
Stat.prototype.canSet = function(value, isPercentage, percentageFrom){
	this._canSetTo(1, value, isPercentage, percentageFrom);
}

// Return true if this._maxValue can be set to value "as is", false otherwhise.
Stat.prototype.canSetMax = function(value, isPercentage, percentageFrom){
	this._canSetTo(2, value, isPercentage, percentageFrom);
}

// Return true if this._basicValue can be set to value "as is", false otherwhise.
Stat.prototype.canSetBasic = function(value, isPercentage, percentageFrom){
	this._canSetTo(0, value, isPercentage, percentageFrom);
}

Stat.prototype._canSetTo = function(type, value, isPercentage, percentageFrom){
	if (type >= 3){
        return;
    }
    if (typeof(value) != "number"){
        return;
    }

    if (booleanable(isPercentage) &&
        isPercentage &&
	   (typeof(percentageFrom) === "undefined")){
        switch (type){
        case 0:
            value *= this._basicValue;
            break;

        case 1:
            value *= this._maxValue;
            break;

        case 2:
            value *= this._maxValue;
            break;

        default:
            break;
        }
    }

    function getFinalValue(value, min, max){
        return ((value > max) ? false :
                (value < min) ? false : true);
    }

    if (type == 0){
		return getFinalValue(value, this._min, this._max);
    }
    else if (type == 1){
        if (this._upsideDown){
			return getFinalValue(value, this._maxValue, this._max);
        }
        else{
			return getFinalValue(value, this._min, this._maxValue);
        }
    }
    else if (type == 2){
        if (this._link != STAT_NO_MAXSTAT){
			return getFinalValue(value, this._min, this._max);
        }
    }
}

// Return this._value multiplied by this.factor.
// By default, if inPercentage, relativeTo is equal to this._maxValue if link
// is not STAT_NO_MAXSTAT.
// relativeTo is equal to _max otherwhise.
Stat.prototype.get = function(inPercentage, relativeTo){
    if (typeof(relativeTo) != "number"){
        relativeTo = (this._link != STAT_NO_MAXSTAT) ? this._maxValue : this._max;
    }

    if (booleanable(inPercentage) &&
        inPercentage){
        return (!relativeTo) ? 1 : this.factor * this._value / relativeTo;
    }
    else{
        return this.factor * this._value;
    }
}

// Return this._maxValue.
// By default, if inPercentage, relativeTo is equal to this._basicValue.
Stat.prototype.getMax = function(inPercentage, relativeTo){
    if (typeof(relativeTo) != "number"){
        relativeTo = this._basicValue;
    }

    if (booleanable(inPercentage) &&
        inPercentage){
		if (this._link == STAT_NO_MAXSTAT){
			return (!relativeTo) ? 1 : this._max / relativeTo;
		}
		else{
			return (!relativeTo) ? 1 : this._maxValue / relativeTo;
		}
    }
    else{
		if (this._link == STAT_NO_MAXSTAT){
			return this._max;
		}
		else{
			return this._maxValue;
		}
    }
}

// Return this._basicValue.
// By default, if inPercentage, relativeTo is equal to this._maxValue if link
// is not STAT_NO_MAXSTAT.
// relativeTo is equal to _max otherwhise.
Stat.prototype.getBasic = function(inPercentage, relativeTo){
    if (typeof(relativeTo) != "number"){
        relativeTo = (this._link == STAT_NO_MAXSTAT) ? this._maxValue : this._max;
    }

    if (booleanable(inPercentage) &&
        inPercentage){
        return (!relativeTo) ? 1 : this._basicValue / relativeTo;
    }
    else{
        return this._basicValue;
    }
}

// Called when this.growth.compute() is called.
// Set this._maxValue to this.growth.result.
Stat.prototype._applyGrowth = function(){
	if (this._link != STAT_NO_MAXSTAT){
		this.setMax(this.growthResult);
	}
	else{
		this.set(this.growthResult);
	}
}

Stat.prototype.grow = function(self, oldValue, newValue){
	if (typeof(oldValue) != "undefined" &&
		(oldValue == newValue)){
		return;
	}

	if (this.growth == null){
		return;
	}

	var growthFunction = this.growth[0];
	var growthContext = this.growth[1];
	var growthArgs = this.growth[2];
	
	this.growthResult = growthFunction.apply(growthContext, growthArgs);

	this.onGrowth.dispatch(this, this.growth, this.growthResult);
}

Stat.prototype.setGrowth = function(growthFunction, context, args, toGrow){
	if (!booleanable(toGrow)){
		toGrow = false;
	}

	var allArgs = args.unshift(this);

	context = (context == -1) ? this : context;

	this.growth = [growthFunction, context, args];

	if (toGrow){
		this.grow();
	}
}

Stat.prototype.kill = function(){
	this.destroy();
}

Stat.prototype.destroy = function(){
	this._del();

	this.growth = null;
}

Stat.prototype._del = function(){
	if (this.onUpdate == null){
		return;
	}

	this.onDestroy.dispatch(this);

	this.entity = null;

	this.onUpdate.dispose();
	this.onUpdate = null;

	this.onUpdateBasic.dispose();
	this.onUpdateBasic = null;
	
	this.onUpdateMax.dispose();
	this.onUpdateMax = null;

	this.onUpdateLink.dispose();
	this.onUpdateLink = null;

	this.onGrowth.dispose();
	this.onGrowth = null;

	this.onDestroy.dispose();
	this.onDestroy = null;
}
/******************************************************************************/
/* Stat */
/********/
