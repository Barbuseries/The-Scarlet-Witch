// TODO: Ajouter les animations
//       Ajouter d'autres types de jauges (sprite, linear, monochrome, ... ?)
//       Ajouter deux variables offset (x et y) pour le sprite
//       Ajouter la possibilité d'afficher les valeurs (brut, pourcentage)
//       Ajouter la possibilité d'overflow


// Jauge classique. N'affiche rien en elle même.
// Prend en paramètre une entité (par exemple, un joueur) ainsi que le nom des variables qui correspondent
// aux valeurs de la jauge.
// Les valeurs de la jauge (et donc son affichage) sont mis à jour automatiquement.
// x et y sont les coordonnées de la barre (pixels).
// width sa largeur et height sa hauteur (pixels).
// backgroundColor est la couleur de fond de la barre. (Quand la partie correspondante est vide)
// sprite est la possible image qui entoure la barre (pour plus de style).
// isHorizontal indique si la jauge est horizontal ou vertical (boolean).

// IMPORTANT : Une jauge a besoin d'un entité. Sans, elle ne sera pas créée.
var Gauge = function (entity, maxValueName, actualValueName, x, y, width, height, backgroundColor, sprite, isHorizontal){
    if (typeof(entity) === "undefined") return;

    if (typeof(isHorizontal) === "undefined") isHorizontal = true;

    Phaser.Group.call(this, game);

    // Toutes les animations que possède la barre.
    this.allTweens = [];
    this.tweenActivateAt = [];

	this.isHorizontal = isHorizontal;

    //this.backgroundSprite = this.create(0, 0, fillSprite);
    //this.fillSprite = this.create(0, 0, fillSprite);
    this.sprite = this.create(0, 0, sprite);

    //this.backgroundSprite.tint = backgroundColor;
    //this.fillSprite.tint = color;

    //this.backgroundSprite.scale.setTo(width / this.fillSprite.width, height / this.fillSprite.height);
    //this.fillSprite.scale.setTo(width / this.fillSprite.width, height / this.fillSprite.height);

    if (this.isHorizontal){
        this.sprite.scale.setTo(width / this.sprite.width, height / this.sprite.height);
    }
    else{
        // Need to learn how to rotate a sprite first....
        this.sprite.scale.setTo(width / this.sprite.width, height / this.sprite.height);
    }

    this.entity = entity;
	this.isEntityFollowedByCamera = false;

    this.maxValueName = maxValueName;
    this.actualValueName = actualValueName;

    this.maxValue = entity[maxValueName];
    this.actualValue = entity[actualValueName];

    this.currentValue = this.actualValue;

    //var mask = game.add.graphics(x, y);
    //mask.beginFill(H_WHITE);
    //mask.drawRect(0, 0, this.actualValue * 1.0 / this.maxValue * this.fillSprite.width, this.fillSprite.height);

    //this.fillSprite.mask = mask;

    this.x = x;
    this.y = y;

    this.width = width;
    this.height = height;

    this.updateIncrDelay = 0;
    this.updateDecrDelay = 0;

    this.isFollowingEntity = false;

    this.alpha = 1;

    //this.color = color;
    //this.backgroundColor = backgroundColor;
}



// Jauge avec dégradé.
// Cet objet là est affichable (contrairement à Gauge).
// Voir Gauge pour les paramètres en commum (contourSprite correspond à sprite).
// colors est un tableau de toutes les couleurs faisant partie de la barre.
// Deux couleurs sont suffisantes pour faire un dégradé.
// positions est un tableau qui place toutes les couleurs de la barre.
// Les positions correspondent à un ratio par rapport à la taille maximal (0 => 0%, 1 => 100%).
// Celle-ci sont placées dans le même ordre
// (la première case de positions correspond à la première case de colors).
// colors et positions doivent être de la même taille.
// ex: colors = [RED, GREEN]; positions = [0, 1];
// Cela place la couleur rouge au début de la barre et la couleur verte à la fin. Un dégradé est ensuite appliqué
// le long de la barre.
// A noter, le nombre de couleur n'est pas limité ! (colors = [RED, BLUE, GREEN]; positions = [0, 0.1, 0.7] est
// valable (bien que moche))
var GradientGauge = function(entity, maxValueName, actualValueName, x, y, width, height, colors, positions, backgroundColor, contourSprite, isHorizontal){
    Gauge.apply(this, [entity, maxValueName, actualValueName, x, y, width, height, backgroundColor, contourSprite, isHorizontal]);

    if (typeof(entity) === 'undefined') return;

    this.allColors = colors;
    this.allPositions = positions;

    var backgroundBitmap = game.add.bitmapData(width, height);
    backgroundBitmap.context.fillStyle = backgroundColor;
    backgroundBitmap.context.fillRect(0, 0, width, height);

    this.backgroundSprite = this.create(0, 0, backgroundBitmap);

    var bitmap = game.add.bitmapData(width, height);

    var gradient = bitmap.context.createLinearGradient(0, height * (this.isHorizontal), width, height);

    for(var i = 0; i < this.allColors.length; i++) {
        if (this.isHorizontal){
            gradient.addColorStop(this.allPositions[i], this.allColors[i]);
        }
        else{
            gradient.addColorStop(1 - this.allPositions[i], this.allColors[i]);
        }
    }

    bitmap.context.fillStyle = gradient;
    bitmap.context.fillRect(0, 0, width, height);

    this.fillSprite = this.create(0, 0, bitmap);

    var mask = game.add.graphics(0, 0);
    mask.beginFill(H_WHITE);
	

    if (this.isHorizontal){
        mask.drawRect(0, 0, this.actualValue / this.maxValue * this.width, this.height);
    }
    else{
        mask.drawRect(0, this.height, this.width, -this.actualValue / this.maxValue * this.height);
    }


    this.fillSprite.mask = mask;
	this.fillSprite.addChild(this.fillSprite.mask);

    this.updateIncr = GradientGauge_updateDefault;
    this.updateDecr = GradientGauge_updateDefault;

    this.bringToTop(this.sprite);
}

// Gauge est un groupe.
Gauge.prototype = Object.create(Phaser.Group.prototype);
Gauge.prototype.constructor = Gauge;

Gauge.prototype.followEntity = function(offsetX, offsetY, toCenter,
										isEntityFollowedByCamera){
    if (typeof(offsetX) === "undefined") offsetX = 0;
    if (typeof(offsetY) === "undefined") offsetY = 0;
    if (typeof(toCenter) === "undefined") toCenter = false;
	if (typeof(isEntityFollowedByCamera) == "undefined") isEntityFollowedByCamera = false;

    if (toCenter){
        this.forEach(function(item){
            item.anchor.setTo(0.5, 0.5);
        });

        this.fillSprite.mask.x -= this.fillSprite.width / 2;
        this.fillSprite.mask.y -= this.fillSprite.height / 2;
    }
	
    this.offsetEntityX = offsetX;
    this.offsetEntityY = offsetY;

	this.isEntityFollowedByCamera = isEntityFollowedByCamera;
    this.isFollowingEntity = true;
};

Gauge.prototype.updatePosition = function(){
    if (this.isFollowingEntity){
        this.x = this.entity.x + this.offsetEntityX;
		this.y = this.entity.y + this.offsetEntityY;
    }
	
	if (this.isEntityFollowedByCamera){
		this.x -= game.camera.x;
		this.y -= game.camera.y;
	}
};


Gauge.prototype.updateTweens = function(){
    var ratio = this.actualValue / this.maxValue;

    for(var i = 0; i < this.allTweens.length; i++) {
        if ((ratio >= this.tweenActivateAt[i][0])&&
            (ratio <= this.tweenActivateAt[i][1])){
			if (this.allTweens[i].willComplete &&
				!this.allTweens[i]._lastChild.isRunning){
				this.allTweens[i].start();
				this.allTweens[i].willComplete = false;
			}
			if (this.allTweens[i]._lastChild.isRunning){
				this.allTweens[i].willComplete = true;
			}
            /*if (!this.allTweens[i]._lastChild.isRunning){
                this.allTweens[i].start();
                //this.allTweens[i].isPaused = false;
            }*/
            /*else if (this.allTweens[i].isPaused){
                this.allTweens[i].resume();
                this.allTweens[i].isPaused = false;
            }*/
        }
		else{
			this.allTweens[i].willComplete = true;
		}
        /*else{
            if (this.allTweens[i].isRunning){
                this.allTweens[i].pause();
                this.allTweens[i].isPaused = true;
            }
        }*/
    }
}


Gauge.prototype.addTween = function(tween, activationAt){
	tween.willComplete = true;
    this.allTweens.push(tween);
    this.tweenActivateAt.push(activationAt);
}


// GradientGauge hérite de Gauge.
GradientGauge.prototype = Object.create(Gauge.prototype);
GradientGauge.prototype.constructor = GradientGauge;


GradientGauge.prototype.update = function (){
    this.updatePosition();

    this.actualValue = this.entity[this.actualValueName];
	
    if (this.currentValue != this.actualValue){
		
		if (this.currentValue < this.actualValue){
			this.updateIncr(1);
		}
		else{
			this.updateDecr(0);
		}
	}
											   
    this.updateTweens();
};


function GradientGauge_updateDefault(isIncreasing){
    if (isIncreasing){
        if (this.updateIncrDelay == 0){
            this.currentValue = this.actualValue;

            this.fillSprite.mask.clear();
            this.fillSprite.mask.beginFill(H_WHITE);

            if (this.isHorizontal){
                this.fillSprite.mask.drawRect(0, 0,
                                              this.currentValue / this.maxValue * this.width,
                                              this.height);
            }
            else{
                this.fillSprite.mask.drawRect(0, this.height,
                                              this.width,
                                              -this.currentValue / this.maxValue * this.height);
            }
        }
    }
    else{
        if (this.updateDecrDelay == 0){
            this.currentValue = this.actualValue;

            this.fillSprite.mask.clear();
            this.fillSprite.mask.beginFill(H_WHITE);

            if (this.isHorizontal){
                this.fillSprite.mask.drawRect(0, 0,
                                              this.currentValue / this.maxValue * this.width,
                                              this.height);
            }
            else{
                this.fillSprite.mask.drawRect(0, this.height,
                                              this.width,
                                              -this.currentValue / this.maxValue * this.height);
            }
        }
    }
}


Gauge.prototype.flash = function(goToValue, returnToValue, goToDelay,
								 returnToDelay, goToEasing, returnToEasing,
								 activateAt, target){
	if (typeof(target) === "undefined") target = this;
	else target = this[target];

	if (goToEasing == -1) goToEasing = Phaser.Easing.Linear.None;
	if (returnToEasing == -1) returnToEasing = Phaser.Easing.Linear.None;
	
	if (returnToValue == -1) returnToValue = target.alpha;

	var tween = game.add.tween(target)
		.to({alpha: goToValue}, goToDelay, goToEasing)
		.to({alpha: returnToValue}, returnToDelay, returnToEasing);

	this.addTween(tween, activateAt);
}

Gauge.prototype.pulse = function(deltaX, deltaY, goToDelay,
								 returnToDelay, goToEasing, returnToEasing,
								 activateAt, target){
	if (typeof(target) === "undefined") target = this;
	else target = this[target];

	if (goToEasing == -1) goToEasing = Phaser.Easing.Linear.None;
	if (returnToEasing == -1) returnToEasing = Phaser.Easing.Linear.None;

	var tween = game.add.tween(target.scale)
		.to({x: 1 + deltaX, y: 1 + deltaY}, goToDelay, goToEasing)
		.to({x: 1, y: 1}, returnToDelay, returnToEasing)
		.to({x: 1 - deltaX, y: 1 - deltaY}, goToDelay, goToEasing)
		.to({x: 1, y: 1}, returnToDelay, returnToEasing);
	
	this.addTween(tween, activateAt);
}
