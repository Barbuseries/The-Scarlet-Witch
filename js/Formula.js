/***********/
/* Formula */
/******************************************************************************/
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

/* There are 4 ways to add a terme :
   => Number : context and args are ignored.
   => String : args is ignored.
   => Function : Nothing is ignored. args must be an ARRAY!
   => Object (a.k.a an array containing multiple termes seen above) : context and args
             are ignored.

Each terme in the same array will be multiplied.
Each array in allTermes will be added.

Which means, if you want to multiply terme, you have to add an "Object".

By the way, power can also be one of the above!

Example (with allTermes = [] before addTerme) :
        => Number : addTerme(4) => [4]
		            (<=> 4)

					+

		            addTerme(4, NO_ONE_CARES, NO_ONE_CARES, 2) => [[4, 2]]
					(<=> 4 ^ 2)

					+

		=> String : addTerme("toto", classRoom, NO_ONE_CARES, 2)
		            => [["toto", classRoom, 2]]
					(<=> classRoom["toto"] ^ 2)

					+

		=> Function : addTerme(foo, bar, [42], 17)
		              => [foo, bar, [42], 17]
					  (<=> foo.apply(bar, [42]) ^ 17)
					  (<=> bar.foo(42) ^ 17)
					+

		=> Object : addTerme([4, ["toto", classRoom, NO_ONE_CARES, 2],
		                     [foo, bar, [42], 17]], NO_ONE_CARES, NO_ONE_CARES, 2)
					(<=> (4 * (classRoom["toto"] ^ 2) * (foo.apply(bar, [42]) ^ 17)) ^ 2)
*/
Formula.prototype.addTerme = function(terme, context, args, power){
	if ((typeof(terme) != "number") &&
	   (typeof(terme) != "string") &&
	   (typeof(terme) != "function") &&
	   (typeof(terme) != "object")){
		return;
	}
	
	if (typeof(context) === "undefined"){
		context = -1;
	}
	
	if (typeof(args) === "undefined"){
		args = [];
	}

	if (typeof(power) === "undefined"){
		power = 1;
	}

    if (typeof(terme) === "number"){
		if (power != 1){
			this.allTermes.push([terme, power]);
		}
		else{
			this.allTermes.push(terme);
		}
	}
	else if (typeof(terme) === "string"){
		this.allTermes.push([terme, context, power]);
	}
	else if (typeof(terme) === "function"){
		this.allTermes.push([terme, context, args, power]);
	}
	else if (typeof(terme) === "object"){
		this.allTermes.push([terme, power]);
	}
}

Formula.prototype.evalTerme = function(terme){
    if (typeof(terme) === "number"){
        return terme;
    }
    else if (typeof(terme) === "object"){
		var result = 0;

        if (typeof(terme[0]) === "number"){
            result = this._evalNumber(terme);
        }
		else if (typeof(terme[0]) === "string"){
			result = this._evalString(terme);
		}
        else if (typeof(terme[0]) === "function"){
			result = this._evalFunction(terme);
        }
		else if (typeof(terme[0]) === "object"){
			result = 1;
			var power;

			if (terme[1].length > 1){
				power = 1;
				
				for(var i = 0; i < terme[1].length; i++) {
					power *= this.evalTerme(terme[1][i]);
				}
			}
			else{
				power = terme[1];
			}
			
			for(var i = 0; i < terme[0].length; i++) {
				result *= this.evalTerme(terme[0][i]);
			}

			result = (power == 1) ? result : Math.pow(result, power);
		}
		return result;
    }
}

Formula.prototype._evalNumber = function(completeNumber){
	var number = completeNumber[0];
	var power;

	power  = (completeNumber.length > 1) ? this.evalTerme(completeNumber[1]) : 1;

	return (power == 1) ? number : Math.pow(number, power);
}

Formula.prototype._evalString = function(completeString){
	var string = completeString[0];
	var context = completeString[1];
	var power;

	power = (completeString.length > 2) ? this.evalTerme(completeString[2]) : 1;

	context = (context == -1) ? this.entity : context;

	return (power == 1) ? context[string] : Math.pow(context[string], power);
}

Formula.prototype._evalFunction = function(completeFunction){
	var foo = completeFunction[0];
	var context = completeFunction[1];
	var args = completeFunction[2];
	var power;

	power = (completeFunction.length > 3) ? this.evalTerme(completeFunction[3]) : 1;

	context = (context == -1) ? this.entity : context;

	var result = foo.apply(context, args);

	return (power == 1) ? result : Math.pow(result, power);
}

Formula.prototype.kill = function(){
	this.destroy();
}

Formula.prototype.destroy = function(){
	this._del();
}

Formula.prototype._del = function(){
	this.entity = null;

	this.allTermes = [];
	this.result = undefined;

	this.onCompute.dispose();
	this.onCompute = null;
}
/******************************************************************************/
/* Formula */
/***********/

