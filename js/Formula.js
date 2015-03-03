var Formula = function(entity){
    if (typeof(entity) === "undefined") entity = null;

    this.entity = entity;

    this.allTermes = [];

    this.result = (entity == null) ? undefined : 0;

	this.onCompute = new Phaser.Signal();
}

Formula.prototype.compute = function(){
    if (this.entity == null){
		this.result = undefined;

        return undefined;
    }

    var result = 0;

    for(var i = 0; i < this.allTermes.length; i++) {
        value = this.evalTerme(this.allTermes[i]);

        result += value;
    }

	this.result = result;

	this.onCompute.dispatch(this);

    return result;
}

Formula.prototype.reCompute = function(stat, oldValue, newValue){
	if (oldValue != newValue){
		this.compute();
	}
}

Formula.prototype.addTerme = function(terme, args, power){
    if (typeof(args) != "undefined"){
		if (typeof(power) != "undefined"){
			this.allTermes.push([[terme, args, power]]);
		}
        else{
			this.allTermes.push([[terme, args]]);
		}
    }
    else{
		if (typeof(power) != "undefined"){
			this.allTermes.push([[terme, power]]);
		}
		else{
			this.allTermes.push(terme);
		}
    }
}

Formula.prototype.evalTerme = function(terme){
	if (this.entity == null){
		return undefined;
	}

    if (typeof(terme) === "number"){
        return terme;
    }
    else if (typeof(terme) === "function"){
        return terme.apply(this.entity);
    }
    else if (typeof(terme) === "object"){
        var result = 1;

        for(var i = 0; i < terme.length; i++) {
            if (typeof(terme[i]) === "number"){
                result *= terme[i];
            }
            else if (typeof(terme[i]) === "function"){
                result *= terme[i].apply(this.entity);
            }
            else if (typeof(terme[i]) === "object"){
                if (typeof(terme[i][0]) === "function"){
					if (typeof(terme[i][2]) === "number"){
						result *= Math.pow(terme[i][0].apply(this.entity, terme[i][1]),
										   terme[i][2]);
					}
					else{
						result *= terme[i][0].apply(this.entity, terme[i][1]);
					}
                }
				else if (typeof(terme[i][0]) === "number"){
					if (typeof(terme[i][1]) === "number"){
						result *= Math.pow(terme[i][0], terme[i][1]);
					}
					else{
						result *= terme[i][0];
					}
				}
            }
        }

        return result;
    }
}
