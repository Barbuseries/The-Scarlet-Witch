/********/
/* Stat */
/******************************************************************************/

var STAT_NO_MAXSTAT = -1; // No maxStat is created.
var STAT_NO_LINK = 0; // No link between stat and maxStat (except for the fact
// that stat can not be greater than maxStat).
var STAT_BRUT_LINK = 1; // Brut link between stat and maxStat (if maxStat
// increases by 3, so do stat).
var STAT_PERCENT_LINK = 2; // Percentage equality link between stat and
// maxStat (if stat is equal to 30% of maxStat
// before maxStat increases, it will be 30% again after)
var STAT_EQUAL_LINK = 3; // Why not ?


// If upsideDown, you can go past maxValue (not max) but not below maxValue (nor min).
// Good for stats which are better if smaller (attackDelay, ...).
var Stat = function(name, link, basicValue, basicMaxValue, min, max, upsideDown){
	if (typeof(basicValue) != "number") basicValue = 0;
	if (typeof(basicMaxValue) != "number") basicMaxValue = basicValue;
	if (typeof(min) != "number") min = 0;
	if (typeof(max) != "number") max = Infinity;
	if (!booleanable(upsideDown)) upsideDown = false;

    this.name = name;
    this._link = link;

    this._basicValue = basicValue;
    this._value = basicValue;

    if (link != STAT_NO_MAXSTAT){
        this._maxValue = basicMaxValue;

        this.onUpdateMax = new Phaser.Signal();
        this.onUpdateMax.add(this.applyLink, this);
    }

    this._min = min;
    this._max = max;

    this._upsideDown = upsideDown;

    this.factor = 1;

    this.onUpdate = new Phaser.Signal();
    this.onUpdateBasic = new Phaser.Signal();
}

Stat.prototype.add = function (value, isPercentage, percentageFrom){
    this._addTo(1, value, isPercentage, percentageFrom);
};

Stat.prototype.addBasic = function(value, isPercentage, percentageFrom){
    this._addTo(0, value, isPercentage, percentageFrom);
}

Stat.prototype.addMax = function(value, isPercentage, percentageFrom){
    if (this._link == STAT_NO_MAXSTAT){
        return;
    }

    this._addTo(2, value, isPercentage, percentageFrom);
}

Stat.prototype._addTo = function(type, value, isPercentage, percentageFrom){
    if (typeof(value) != "number"){
        return;
    }

    if (booleanable(isPercentage) &&
        isPercentage){
        if (typeof(percentageFrom) === "undefined"){
            precentageFrom = (this._link != STAT_NO_MAXSTAT) ? this._maxValue : this._value;
        }
        value *=  percentageFrom / 100;
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
            this._value = getFinalValue(this._value, value,
                                        this._maxValue, this._max);
        }
        else{
            this._value = getFinalValue(this._value, value,
                                        this._min, this._maxValue);
        }

        this.onUpdate.dispatch(this, oldValue, this._value);
    }
    else if ((type == 2) &&
             (this._link != STAT_NO_MAXSTAT)){
        var oldValue = this._maxValue;

        this._maxValue = getFinalValue(this._maxValue, value,
                                       this._min, this._max);

        this.onUpdateMax.dispatch(this, oldValue, this._maxValue);
    }
}

Stat.prototype.subtract = function(value, isPercentage, percentageFrom){
    this.add(-1 * value, isPercentage, percentageFrom);
}

Stat.prototype.subtractMax = function(value, isPercentage, percentageFrom){
    if (this._link == STAT_NO_MAXSTAT){
        return;
    }

    this.addMax(-1 * value, isPercentage, percentageFrom);
}

Stat.prototype.subtractBasic = function(value, isPercentage, percentageFrom){
    this.addBasic(-1 * value, isPercentage, percentageFrom);
}

Stat.prototype.canAdd = function(value, isPercentage, percentageFrom){
    return this._canAddTo(1, value, isPercentage, percentageFrom);
}

Stat.prototype.canAddBasic = function(value, isPercentage, percentageFrom){
    return this._canAddTo(0, value, isPercentage, percentageFrom);
}

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
            precentageFrom = (this._link != STAT_NO_MAXSTAT) ? this._maxValue : this._value;
        }
        value *=  percentageFrom / 100;
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
            return getFinalValue(this._value, value,
                                 this._maxValue, this._max);
        }
        else{
            return getFinalValue(this._value, value,
                                 this._min, this._maxValue);
        }
    }
    else if ((type == 2) &&
             (this._link != STAT_NO_MAXSTAT)){
        return getFinalValue(this._maxValue, value,
                             this._min, this._max);
    }
}

Stat.prototype.canSubtract = function(value, isPercentage, percentageFrom){
    return this.canAdd(-1 * value, isPercentage, percentageFrom);
}

Stat.prototype.canSubtractMax = function(value, isPercentage, percentageFrom){
    if (this._link == STAT_NO_MAXSTAT){
        return false;
    }

    return this.canAddMax(-1 * value, isPercentage, percentageFrom);
}

Stat.prototype.canSubtractBasic = function(value, isPercentage, percentageFrom){
    return this.canAddBasic(-1 * value, isPercentage, percentageFrom);
}

Stat.prototype.applyLink = function(self, oldMaxValue, newMaxValue){
    switch(this._link){
    case STAT_NO_MAXSTAT:
        return;
        break;

    case STAT_NO_LINK:
        if (this._upsideDown){
            if (this._value < newMaxValue){
                this.set(newMaxValue);
            }
        }
        else{
            if (this._value > newMaxValue){
                this.set(newMaxValue);
            }
        }
        break;

    case STAT_BRUT_LINK:
        this.add(newMaxValue - oldMaxValue);
        break;

    case STAT_PERCENT_LINK:
        this.set(this._value / oldMaxValue * newMaxValue);
        break;

    case STAT_EQUAL_LINK:
        this.set(newMaxValue);
        break;

    default:
        return;
    }
}

Stat.prototype.set = function(value, isPercentage){
    this._setTo(1, value, isPercentage);
}

Stat.prototype.setMax = function(value, isPercentage){
    this._setTo(2, value, isPercentage);
}

Stat.prototype.setBasic = function(value, isPercentage){
    this._setTo(0, value, isPercentage);
}

Stat.prototype._setTo = function(type, value, isPercentage){
    if (type >= 3){
        return;
    }
    if (typeof(value) != "number"){
        return;
    }

    if (booleanable(isPercentage) &&
        isPercentage){
        switch (type){
        case 0:
            value *= this._basicValue;
            break;

        case 1:
            value *= this._value;
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
        if (getFinalValue(value, this._min, this._max)){
            var oldValue = this._basicValue;

            this._basicValue = value;

            this.onUpdateBasic.dispatch(this, oldValue, this._basicValue);
        }
    }
    else if (type == 1){
        if (this._upsideDown){
            if (getFinalValue(value, this._maxValue, this._max)){
                var oldValue = this._value;

                this._value = value;

                this.onUpdate.dispatch(this, oldValue, this._value);
            }
        }
        else{
            if (getFinalValue(value, this._min, this._maxValue)){
                var oldValue = this._value;

                this._value = value;

                this.onUpdate.dispatch(this, oldValue, this._value);
            }
        }
    }
    else if (type == 3){
        if (this._link != STAT_NO_MAXSTAT){
            if (getFinalValue(value, this._min, this._maxValue)){
                var oldValue = this._maxValue;

                this._maxValue = value;

                this.onUpdateMax.dispatch(this, oldValue, this._maxValue);
            }
        }
    }

}

Stat.prototype.get = function(inPercentage, relativeTo){
    if (typeof(relativeTo) != "number"){
        relativeTo = this._maxValue;
    }

    if (booleanable(inPercentage) &&
        inPercentage){
        return this.factor * this._value / relativeTo;
    }
    else{
        return this.factor * this._value;
    }
}

Stat.prototype.getMax = function(inPercentage, relativeTo){
    if (typeof(relativeTo) != "number"){
        relativeTo = this._value;
    }

    if (booleanable(inPercentage) &&
        inPercentage){
        return this._maxValue / relativeTo;
    }
    else{
        return this._maxValue;
    }
}

Stat.prototype.getBasic = function(inPercentage, relativeTo){
    if (typeof(relativeTo) != "number"){
        relativeTo = this._maxValue;
    }

    if (booleanable(inPercentage) &&
        inPercentage){
        return this._basicValue / relativeTo;
    }
    else{
        return this._basicValue;
    }
}
/******************************************************************************/
/* Stat */
/********/
