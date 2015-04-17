/*******************/
/* Activation Zone */
/******************************************************************************/
var AZ_DEACTIVATED = 0;
var AZ_ACTIVATED = 1;

/* variable can either be a :
   -> Number => (useless but why not...)
   -> String => (entity[variable] is assigned to value)
   -> Formula => (variable.result is assigned to value, make sure to update the
   formula on you own)

   The same goes for min and max except that a number is not useless for them.
*/
var ActivationZone = function(entity, variable, min, max, repeat){
    this.entity = entity;

    this.variable = variable;

    this.min = min;
    this.max = max;

    this.repeat = repeat;

    this.onActivation = new Phaser.Signal();
    this.onActive = new Phaser.Signal();

    this.onDeactivation = new Phaser.Signal();
    this.onDeactive = new Phaser.Signal();

    this.state = AZ_DEACTIVATED;

	this.value = undefined;

	this.update();
}

Activation.prototype.update = function(){
    var min;
    var max;

    function getFinalValue(variable){
        if (typeof(variable) === "number"){
            return variable;
        }
        else if (typeof(variable) === "string"){
			if (this.entity == null){
				return undefined;
			}
			else{
				return this.entity[variable];
			}
        }
        else if (typeof(variable) === "object"){
            return variable.result;
        }

		return undefined;
    }

    this.value = getFinalValue(this.variable);

    min = getFinalValue(this.min);

    max = getFinalValue(this.max);

    if ((this.value >= min) &&
        (this.value <= max)){
        this.activate();
    }
    else{
        this.deactivate();
    }
}

ActivationZone.prototype.activate = function(){
    if (this.state == AZ_DEACTIVATED){
        if (this.repeat != 0){
            this.state = AZ_ACTIVATED;

            if (this.repeat > 0){
                this.repeat--;
            }

            this.onActivation.dispatch(this);
        }
        else{
            return;
        }
    }

    this.onActive.dispatch(this);
}

ActivationZone.prototype.deactivate = function(){
    if (this.state == AZ_ACTIVATED){
        this.state = AZ_DEACTIVATED;

        this.onDeactivation.dispatch(this);
    }

    this.onDeactive.dispatch(this);
}

ActivationZone.prototype.kill = function(){
	this.destroy();
}

ActivationZone.prototype.destroy = function(){
	this._del();
}

ActivationZone.prototype._del = function(){
	this.deactivate();
	
	this.entity = null;
	
	if (typeof(this.variable) === "object"){
		this.variable.kill();
	}

	this.variable = null;
	
	if (typeof(this.min) === "object"){
		this.min.kill();
	}

	this.min = null;
	
	if (typeof(this.max) === "object"){
		this.max.kill();
	}

	this.max = null;

	this.repeat = 0;

	this.onActivation.dispose();
	this.onActivation = null;

	this.onActive.dispose();
	this.onActive = null;
	
	this.onDeactivation.dipose();
	this.onDeactivation = null;

	this.onDeactive.dipose();
	this.onDeactive = null;

	this.value = null;
}
/******************************************************************************/
/* Activation Zone */
/*******************/
