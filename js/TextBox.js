// FIXME: Trouver un moyen de centrer/mettre a droite la premiere ligne de texte qui
//        est affichee.
//        (align ne fonctionne que quand un texte est sur plusieurs lignes)
// FIXED !


// FIXME: Afficher le texte centré/à droite quand il ne fait qu'une ligne et qu'il
// possède un textSpeedFactor négatif.

// FIXME: Faire fonctionner le scroll avec un textSpeedFactor nul ou négatif.

// TODO: Faire passer le nombre de fonctions pour l'animation de l'ouverture et de
//       la fermeture d'une TextBox à 2 (au lieu de 6 (!) actuellement).


/*******/
/* Box */
/*******************************************************************************/
// Create a box at (x, y) with the given width and height.
// If the Box has a mask, everything going out of it will be cropped.
var Box = function(x, y, width, height, sprite, hasMask){
    if (typeof(hasMask) != "number") hasMask = true;

    Phaser.Sprite.call(this, game, x, y, sprite);

    this.width = width;
    this.height = height;

    if (hasMask){
        this.mask = game.add.graphics(x, y);
        this.mask.isMask = true;
    }
    else{
        this.mask = null;
    }

    // Should work, but doesn't...
    //this.addChild(this.mask);

    this.updateMask();

    game.add.existing(this);
}


Box.prototype = Object.create(Phaser.Sprite.prototype);
Box.prototype.constructor = Box;

// Set the Box's width at the given width.
// Update the Box's mask's width if there's any.
Box.prototype.setWidth = function(width){
    if (typeof(width) != "number") return;

    this.width = width;
    this.updateMask();
};

// Set the Box's height at the given height.
// Update the Box's mask's height if there's any.
Box.prototype.setHeight = function(height){
    if (typeof(height) != "number") return;

    this.height = height;
    this.updateMask();
};

// Set the Box's dimensions (width and height) at the given dimensions.
// If only the first value is correct, both dimensions will be set to this one.
// (Example : Calling the function with only one parameter)
// Update the Box's mask's width and height if there's any.
Box.prototype.setDimensions = function(width, height){
    // If the new width is not correct,
    if (typeof(width) != "number"){
        // If there's no correct value, return.
        if (typeof(height) != "number"){
            return;
        }

        // Otherwhise, only assign the new height.
        this.height = height;

        this.updateMask();

        return;
    }
    else{
        // Otherwhise, if the width is the only correct value, assign the new width
        // AND the new height.
        if (typeof(height) != "number"){
            this.width = width;
            this.height = height;

            this.updateMask();

            return;
        }
    }

    // Otherwhise, everything is fine !

    this.width = width;
    this.height = height;

    this.updateMask();
}

// Set the Box's x at the given x.
// Update the Box's mask's x if there's any.
Box.prototype.setX = function(x){
    if (typeof(x) != "number") return;

    this.x = x;

    if (this.mask != null){
        this.mask.x = x;
    }
};

// Set the Box's y at the given y.
// Update the Box's mask's y if there's any.
Box.prototype.setY = function(y){
    if (typeof(y) != "number") return;

    this.y = y;

    if(this.mask != null){
        this.mask.y = y;
    }
};

// Set the Box's position at the given position.
// If only the first value is correct, x and y will be set to the same value.
// (Example : Calling the function with only one parameter)
// Update the Box's mask's position if there's any.
Box.prototype.setPosition = function(x, y){
    if (typeof(x) == "number"){
        if (typeof(y) != "number"){
            y = x;
        }
    }

    this.setX(x);
    this.setY(y);
};

// Clear and redraw the mask at it's position and with it's dimensions.
Box.prototype.updateMask = function(){
    if (this.mask != null){
        this.mask.clear();

        this.mask.beginFill(H_WHITE);

        this.mask.drawRect(0, 0,
                           this.width, this.height);
        this.mask.endFill();
    }
}
/******************************************************************************/
/* Box */
/*******/



/***********/
/* TextBox */
/******************************************************************************/
var TEXTBOX_CLOSED = 0;
var TEXTBOX_TOGGLING = 1;
var TEXTBOX_TOGGLED = 2;
var TEXTBOX_CLOSING = 3;


var TextBox = function(x, y, width, height, outerSprite, innerSprite){
    if (typeof(x) != "number") x = 0;
    if (typeof(y) != "number") y = 0;
    if (typeof(width) != "number") width = 0;
    if (typeof(height) != "number") height = 0;
    if (typeof(outerSprite) != "string") outerSprite = "";
    if (typeof(innerSprite) != "string") innerSprite = "";

    Phaser.Group.call(this, game);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // Does not have a mask.
    this.outerBox = new Box(0, 0, width, height, outerSprite, false);
    this.outerBox.mask.x = x;
    this.outerBox.mask.y = y;

    // Box into which the text is written.
    this.innerBox = new Box(0, 0, width, height, innerSprite);
    this.innerBox.mask.x = x;
    this.innerBox.mask.y = y;

    this.add(this.outerBox);
    this.add(this.innerBox);

    this.marginLeft = 0;
    this.marginRight = 0;
    this.marginTop = 0;
    this.marginBottom = 0;

    this.allSentences = [];
    this.allDelays = [];
    this.allClears = [];
    this.indexCurrentSentence = -1;

    this.visible = false;
    this.displayState = TEXTBOX_CLOSED;
    this.alpha = 1;

    this.timerNextSentence = null;

    this.toggleAnimation = null;
    this.closeAnimation = null;

    this.toggleTimer = null;
    this.closeTimer = null;
}

TextBox.prototype = Object.create(Phaser.Group.prototype);
TextBox.prototype.constructor = TextBox;


// Not to be used externally (make it private in the near future).
// If the TextBox is being closed, close it (and make it invisible).
// Otherwhise, toggle it (and make it visible).
TextBox.prototype.fixTogglingState = function(){
    if (this.displayState == TEXTBOX_TOGGLING){
        this.displayState = TEXTBOX_TOGGLED;

        this.visible = true;
    }
    else if (this.displayState == TEXTBOX_CLOSING){
        this.displayState = TEXTBOX_CLOSED;

        this.visible = false;
    }
}

TextBox.prototype.createVerticalToggle = function(time, alpha, direction, easing){
    // If there's already a toggle animation, do nothing.
    // It's up to you to deal with the old one and then set a new one.
    if (this.toggleAnimation != null){
        return;
    }

    // By default, the animation takes 500 milliseconds.
    if (typeof(time) != "number"){
        time = 500;
    }
    // If the time is negative or zero, no need to do an animation :
    // It won't be seen anyway...
    else if (time <= 0){
        return;
    }

    // By default, the final alpha is set to 1.
    if (typeof(alpha) != "number"){
        alpha = 1;
    }
    // If the alpha is negative, it's set to the TextBox's current alpha (make sure
    // to change it as, by default, it's equal to 1).
    else if (alpha < 0){
        alpha = this.alpha;
    }

    // By default, the direction is from up to bottom.
    if ((typeof(direction) != "number") &&
        (typeof(direction) != "boolean")){
        direction = 0;
    }

    // By default, the animation is linear.
    if (typeof(easing) != "function"){
        easing = Phaser.Easing.Linear.None;
    }

    var y = this.y;
	var height = this.height;

    this.toggleAnimation = game.add.tween(this)
	// Init the toggle first (1 ms 'cause 0 doesn't do anything).
		.to({y: y - height + 2 * height * direction, alpha: 0}, 1)
        .to({y: y, alpha: alpha}, time, easing);

    this.normalizeToggleAnimation();
}

TextBox.prototype.createHorizontalToggle = function(time, alpha, direction, easing){
    // If there's already a toggle animation, do nothing.
    // It's up to you to deal with the old one and then set a new one.
    if (this.toggleAnimation != null){
        return;
    }

    // By default, the animation takes 500 milliseconds.
    if (typeof(time) != "number"){
        time = 500;
    }
    // If the time is negative or zero, no need to do an animation :
    // It won't be seen anyway...
    else if (time <= 0){
        return;
    }

    // By default, the final alpha is set to 1.
    if (typeof(alpha) != "number"){
        alpha = 1;
    }
    // If the alpha is negative, it's set to the TextBox's current alpha (make sure
    // to change it as, by default, it's equal to 1).
    else if (alpha < 0){
        alpha = this.alpha;
    }

    // By default, the direction is from top to bottom.
    if ((typeof(direction) != "number") &&
        (typeof(direction) != "boolean")){
        direction = 0;
    }

    // By default, the animation is linear.
    if (typeof(easing) != "function"){
        easing = Phaser.Easing.Linear.None;
    }

    var x = this.x;
	var width = this.width;

    this.toggleAnimation = game.add.tween(this)
		.to({x: x - width + 2 * width * direction, alpha: 0}, 1)
        .to({x: x, alpha: alpha}, time, easing);

    this.normalizeToggleAnimation();
}

TextBox.prototype.createVerticalClose = function(time, direction, easing){
    // If there's already a close animation, do nothing.
    // It's up to you to deal with the old one and then set a new one.
    if (this.closeAnimation != null){
        return;
    }

    // By default, the animation takes 500 milliseconds.
    if (typeof(time) != "number"){
        time = 500;
    }
    // If the time is negative or zero, no need to do an animation :
    // It won't be seen anyway...
    else if (time <= 0){
        return;
    }


    // By default, the direction is from top to bottom.
    if ((typeof(direction) != "number") &&
        (typeof(direction) != "boolean")){
        direction = 0;
    }

    // By default, the animation is linear.
    if (typeof(easing) != "function"){
        easing = Phaser.Easing.Linear.None;
    }

    var y = this.y;
	var height = this.height;
	var alpha = this.alpha;

    function reset(){
        this.y = y;
		this.alpha = alpha;
    }

    this.closeAnimation = game.add.tween(this)
        .to({y: y - height +  2 * height * direction, alpha: 0}, time, easing);

	this.closeAnimation._lastChild.onComplete.add(reset, this);

    this.normalizeCloseAnimation();
}

TextBox.prototype.createHorizontalClose = function(time, direction, easing){
    // If there's already a close animation, do nothing.
    // It's up to you to deal with the old one and then set a new one.
    if (this.closeAnimation != null){
        return;
    }

    // By default, the animation takes 500 milliseconds.
    if (typeof(time) != "number"){
        time = 500;
    }
    // If the time is negative or zero, no need to do an animation :
    // It won't be seen anyway...
    else if (time <= 0){
        return;
    }


    // By default, the direction is from left to right.
    if ((typeof(direction) != "number") &&
        (typeof(direction) != "boolean")){
        direction = 0;
    }

    // By default, the animation is linear.
    if (typeof(easing) != "function"){
        easing = Phaser.Easing.Linear.None;
    }

    var x = this.x;
	var width = this.width;
	var alpha = this.alpha;

    function reset(){
        this.x = x;
		this.alpha = alpha;
    }

    this.closeAnimation = game.add.tween(this)
        .to({x: x - width + 2 * width * direction, alpha: 0}, time, easing);

	this.closeAnimation._lastChild.onComplete.add(reset, this);

    this.normalizeCloseAnimation();
}

TextBox.prototype.createBasicToggle = function(time, alpha, easing){
    // If there's already a toggle animation, do nothing.
    // It's up to you to deal with the old one and then set a new one.
    if (this.toggleAnimation != null){
        return;
    }

    // By default, the animation takes 500 milliseconds.
    if (typeof(time) != "number"){
        time = 500;
    }
    // If the time is negative or zero, no need to do an animation :
    // It won't be seen anyway...
    else if (time <= 0){
        return;
    }

    // By default, the final alpha is set to 1.
    if (typeof(alpha) != "number"){
        alpha = 1;
    }
    // If the alpha is negative, it's set to the TextBox's current alpha (make sure
    // to change it as, by default, it's equal to 1).
    else if (alpha < 0){
        alpha = this.alpha;
    }

    // By default, the animation is linear.
    if (typeof(easing) != "function"){
        easing = Phaser.Easing.Linear.None;
    }

    this.toggleAnimation = game.add.tween(this)
        .to({alpha: alpha}, time, easing);

    this.normalizeToggleAnimation();
}

TextBox.prototype.createBasicClose = function(time, easing){
    // If there's already a close animation, do nothing.
    // It's up to you to deal with the old one and then set a new one.
    if (this.closeAnimation != null){
        return;
    }

    // By default, the animation takes 500 milliseconds.
    if (typeof(time) != "number"){
        time = 500;
    }
    // If the time is negative or zero, no need to do an animation :
    // It won't be seen anyway...
    else if (time <= 0){
        return;
    }

    // By default, the animation is linear.
    if (typeof(easing) != "function"){
        easing = Phaser.Easing.Linear.None;
    }

	var alpha = this.alpha;

	function reset(){
		this.alpha = alpha;
	}

    this.closeAnimation = game.add.tween(this)
        .to({alpha: 0}, time, easing);

	this.closeAnimation._lastChild.onComplete.add(reset, this);

    this.normalizeCloseAnimation();
}

TextBox.prototype.normalizeToggleAnimation = function(){
    if (this.toggleAnimation == null){
        return;
    }

    this.toggleAnimation._lastChild.onComplete.add(this.fixTogglingState, this);
    this.toggleAnimation._lastChild.onComplete.add(this.nextSentence, this);
}

TextBox.prototype.normalizeCloseAnimation = function(){
    if (this.closeAnimation == null){
        return;
    }

    this.closeAnimation._lastChild.onComplete.add(this.fixTogglingState, this);
    this.closeAnimation._lastChild.onComplete.add(this.clear, this);
}

TextBox.prototype.createToggleTimer = function(time){
    if (this.toggleTimer != null){
        return;
    }

    // By default, the timer waits 500 milliseconds.
    if (typeof(time) != "number"){
        time = 500;
    }
    // If the time is negative or zero, no need to do create a timer.
    else if (time <= 0){
        return;
    }

    this.toggleTimer = game.time.create(false);

    this.toggleTimer.add(time, this.toggle, this);
}

TextBox.prototype.createCloseTimer = function(time){
    if (this.closeTimer != null){
        return;
    }

    // By default, the timer waits 500 milliseconds.
    if (typeof(time) != "number"){
        time = 500;
    }
    // If the time is negative or zero, no need to do create a timer.
    else if (time <= 0){
        return;
    }

    this.closeTimer = game.time.create(false);

    this.closeTimer.add(time, this.close, this);
}

// Make the TextBox appear in the given time with the given alpha.
// If time is undefined, negative or zero, the TextBox will be displayed instantly.
// If no alpha is passed, the TextBox's alpha is set to 1.
// TODO: add delay and a corresponding tween to make the TextBox only appear
// for delay milliseconds.
TextBox.prototype.toggle = function(duration){
    if ((this.displayState == TEXTBOX_TOGGLING) ||
        (this.displayState == TEXTBOX_TOGGLED)){
        return;
    }

	function setVisible(){
		this.visible = true;
	}

    // If there's no toggle animation, just start reading...
    if (this.toggleAnimation == null){
		this.visible = true;

        this.displayState = TEXTBOX_TOGGLED;

        if (this.closeTimer != null){
            this.closeTimer.start();
        }

        this.nextSentence();
    }
    else{
        if (this.closeTimer != null){
            this.closeTimer.start(this.toggleAnimation.totalDuration);
        }
		
		// Kind of a hack : wait until toggleAnimation has finished to init to set
		// the TextBox to visible, otherwhise, it's quite ugly.
		this.toggleAnimation.onComplete.add(setVisible, this);

        // Otherwhise, start the animation and only start reading once it's finished.
        this.toggleAnimation.start();

        this.displayState = TEXTBOX_TOGGLING;
    }

    // If the TextBox must be closed after a given time,
    if (typeof(duration) == "number" && duration > 0){
        this.createCloseTimer(duration);

        if (this.toggleAnimation != null){
            this.closeTimer.start(this.toggleAnimation.totalDuration);
        }
        else{
            this.closeTimer.start();
        }
    }
}

// Close the TextBox in the given time.
// If no time is specified, the TextBox will be automatically closed.
TextBox.prototype.close = function(time){
    if ((this.displayState == TEXTBOX_CLOSING) ||
        (this.displayState == TEXTBOX_CLOSED)){
        return;
    }

    if (typeof(this.allSentences[this.indexCurrentSentence]) != "undefined"){
        this.allSentences[this.indexCurrentSentence].stopReading(true);
    }


    if (this.closeAnimation == null){
        if (typeof(time) != "number" || time <= 0){
            this.displayState = TEXTBOX_CLOSED;
            this.visible = false;
            this.clear();

            this.alpha = 0;

            return;
        }
        else{
            this.closeAnimation = game.add.tween(this)
                .to({alpha: 0}, time);

            this.closeAnimation.onComplete.add(this.fixTogglingState, this);
            this.closeAnimation.onComplete.add(this.clear, this);
        }
    }

    this.closeAnimation.start();

    this.displayState = TEXTBOX_CLOSING;
}

TextBox.prototype.updateMarginH = function(){
    this.innerBox.setWidth(this.width - this.marginLeft - this.marginRight);
}

TextBox.prototype.updateMarginV = function(){
    this.innerBox.setHeight(this.height - this.marginTop - this.marginBottom);
}

TextBox.prototype.setMarginLeft = function(marginLeft, isPercentage){
    this.setMarginH(marginLeft, "", isPercentage);
}

TextBox.prototype.setMarginRight = function(marginRight, isPercentage){
    this.setMarginH("", marginRight, isPercentage);
}

TextBox.prototype.setMarginTop = function(marginTop, isPercentage){
    this.setMarginV(marginTop, "", isPercentage);
}

TextBox.prototype.setMarginBottom = function(marginBottom, isPercentage){
    this.setMarginV("", marginBottom, isPercentage);
}

TextBox.prototype.setMarginH = function(marginLeft, marginRight, isPercentage){
    if (this.displayState != TEXTBOX_CLOSED){
        return;
    }

    if ((typeof(marginLeft) != "number") &&
        (typeof(marginRight) != "number")) return;

    if ((typeof(isPercentage) != "number") &&
        (typeof(isPercentage) != "boolean")){
        isPercentage = false;
    }

    var width = this.innerBox.width;

    if (typeof(marginLeft) === "number"){
        if (isPercentage){
            marginLeft *= width * 0.01;
        }

        if (marginLeft < 0){
            marginLeft = 0;
        }
        else if (marginLeft > this.innerBox.width + this.marginLeft){
            marginLeft = this.innerBox.width + this.marginLeft;
        }

        this.marginLeft = marginLeft;

        this.innerBox.setX(this.marginLeft);
        this.innerBox.mask.x += this.x;

        if (typeof(marginRight) === "undefined"){
            this.marginRight = this.marginLeft;
        }
    }

    if (typeof(marginRight) === "number"){
        if (isPercentage){
            marginRight *= width * 0.01;
        }

        if (marginRight < 0){
            marginRight = 0;
        }
        else if (marginRight > this.innerBox.width + this.marginRight){
            marginRight = this.innerBox.width + this.marginRight;
        }

        this.marginRight = marginRight;
    }

    this.updateMarginH()

    this.innerBox.updateMask();

    for(var i = 0; i < this.allSentences.length; i++) {
        this.allSentences[i].x = this.innerBox.x;
        this.allSentences[i].y = this.innerBox.y;
    }
}


TextBox.prototype.setMarginV = function(marginTop, marginBottom){
    if (this.displayState != TEXTBOX_CLOSED){
        return;
    }

    if ((typeof(marginTop) != "number") &&
        (typeof(marginBottom) != "number")) return;

    if ((typeof(isPercentage) != "number") &&
        (typeof(isPercentage) != "boolean")){
        isPercentage = false;
    }

    var height = this.innerBox.height;

    if (typeof(marginTop) === "number"){
        if (isPercentage){
            marginTop *= height * 0.01;
        }

        if (marginTop < 0){
            marginTop = 0;
        }
        else if (marginTop > this.innerBox.height + this.marginTop){
            marginTop = this.innerBox.height + this.marginTop;
        }

        this.marginTop = marginTop;

        this.innerBox.setY(this.marginTop);
        this.innerBox.mask.y += this.y;

        if (typeof(marginBottom) === "undefined"){
            this.marginBottom = this.marginTop;
        }
    }

    if (typeof(marginBottom) === "number"){
        if (isPercentage){
            marginBottom *= height * 0.01;
        }
        if (marginBottom < 0){
            marginBottom = 0;
        }
        else if (marginBottom > this.innerBox.height + this.marginBottom){
            marginBottom = this.innerBox.height + this.marginBottom;
        }

        this.marginBottom = marginBottom;
    }


    this.updateMarginV();

    this.innerBox.updateMask();

    for(var i = 0; i < this.allSentences.length; i++) {
        this.allSentences[i].x = this.innerBox.x;
        this.allSentences[i].y = this.innerBox.y;
    }
}

TextBox.prototype.setHeight = function(height, conserveMargin){
    if (this.displayState != TEXTBOX_CLOSED){
        return;
    }

    var oldHeight = this.height;

    if (oldHeight == height){
        return;
    }

    var marginTop = this.marginTop;
    var marginBottom = this.marginBottom;

    if (conserveMargin == 0){
        marginTop = 0;
        marginBottom = 0;
    }
    else if (conserveMargin == 2){
        var factor = height / oldHeight;

        marginTop *= factor;
        marginBottom *= factor;
    }

    this.height = height;
    this.outerBox.setHeight(height);
    this.innerBox.setHeight(height);

    this.setMarginV(marginTop, marginBottom);
}

TextBox.prototype.setWidth = function(width, conserveMargin){
    if (this.displayState != TEXTBOX_CLOSED){
        return;
    }

    var oldWidth = this.width;

    if (oldWidth == width){
        return;
    }

    var marginLeft = this.marginLeft;
    var marginRight = this.marginRight;

    if (conserveMargin == 0){
        marginLeft = 0;
        marginRight = 0;
    }
    else if (conserveMargin == 2){
        var factor = width / oldWidth;

        marginLeft *= factor;
        marginRight *= factor;
    }

    this.width = width;
    this.outerBox.setWidth(width);
    this.innerBox.setWidth(width);

    this.setMarginH(marginLeft, marginRight);

    for(var i = 0; i < this.allSentences.length; i++) {
        this.allSentences[i].setWordWrap(true, this.innerBox.width);
        this.allSentences[i].phaserText.text = this.allSentences[i].wholeText;
        this.allSentences[i].heightLeft = this.allSentences[i].phaserText.height;
        this.allSentences[i].maxHeight = this.allSentences[i].heightLeft;

        this.allSentences[i].phaserText.text = "";
    }
}

TextBox.prototype.setX = function(x){
    if (typeof(x) != "number") return;

    var deltaX = x - this.x;

    this.outerBox.mask.x += deltaX;
    this.innerBox.mask.x += deltaX;

    this.x += deltaX;
};


TextBox.prototype.setY = function(y){
    if (typeof(y) != "number") return;

    var deltaY = y - this.y;

    this.outerBox.mask.y += deltaY;
    this.innerBox.mask.y += deltaY;

    this.y += deltaY;
};

TextBox.prototype.setPosition = function(x, y){
    if (typeof(y) != "number") y = x;

    this.setX(x);
    this.setY(y);
}

TextBox.prototype.addSentence = function(sentence, delay, toClear, index){
    if (typeof(sentence) != "object") return;
    if (typeof(delay) != "number") delay = -1;
    if ((typeof(toClear) != "number") &&
        (typeof(toClear) != "boolean")) toClear = false;
    if (typeof(index) != "number") index = this.allSentences.length;

    sentence.x = this.innerBox.x;
    sentence.y = this.innerBox.y;
    sentence.mask = this.innerBox.mask;
    sentence.setWordWrap(true, this.innerBox.width);

    sentence.phaserText.text = sentence.wholeText;
    sentence.heightLeft = sentence.phaserText.height;
    sentence.maxHeight = sentence.heightLeft;

    sentence.phaserText.text = "";

    this.allSentences.splice(index, 0, sentence);
    this.allDelays.splice(index, 0, delay);
    this.allClears.splice(index, 0, toClear);
    this.add(sentence);
}

// Called every frame.
TextBox.prototype.update = function(){
    // If the TextBox is not completely toggled, do nothing.
    if (this.displayState == TEXTBOX_TOGGLED){
        // If the index of the current sentence is valid,
        if (validIndex(this.indexCurrentSentence, this.allSentences)){
            var i  = this.indexCurrentSentence;
            var currentSentence = this.allSentences[i];

            // If the current sentence is being read or is paused,
            if (currentSentence.readingState == SENTENCE_READING ||
                currentSentence.readingState == SENTENCE_PAUSED){
                currentSentence.update();

				if (currentSentence.phaserText.height <
                        2 * currentSentence.phaserText.fontSize){
					switch (currentSentence.phaserText.align){
						case "center":
						currentSentence.x = this.innerBox.x + this.innerBox.width / 2 -
                            currentSentence.phaserText.width / 2;
						break;

						case "right":
						currentSentence.x = this.innerBox.x + this.innerBox.width -
							currentSentence.phaserText.width;
						break;
						
						default:
						break;
					}
				}

                this.handleVerticalOverflow();
            }
            // Otherwhise, prepare the display of the next sentence.
            else{
                // If the delay until the next sentence is negative, wait until
                // user's input.
                if (this.allDelays[i] < 0){
                    console.log("PRESS A KEY TO CONTINUE !");
                }
                // Otherwhise, wait the given time to start reading the next sentence.
                else if (this.timerNextSentence == null){
                    var delay = this.allDelays[i];

                    this.timerNextSentence = game.time.create(false);
                    this.timerNextSentence.add(this.allDelays[i],
                                               this.nextSentence, this);

                    this.timerNextSentence.start();
                }
            }

        }
    }
}


TextBox.prototype.nextSentence = function(){
    if (this.displayState != TEXTBOX_TOGGLED) return;

    if (this.allSentences.length < 1) return;

    if (this.timerNextSentence){
        this.timerNextSentence = null;
    }

    var i = this.indexCurrentSentence;

    if (validIndex(i, this.allSentences)){
        var currentSentence = this.allSentences[i];
        var nextSentence = this.allSentences[i + 1];

        currentSentence.stopReading();

        if (this.allClears[i]){
            this.clear();
        }
        else{
            if (typeof(nextSentence) != "undefined"){
                nextSentence.y = currentSentence.y + currentSentence.phaserText.height;
            }
        }

        this.indexCurrentSentence++;

        if (typeof(nextSentence) != "undefined"){
            this.handleMood();

            nextSentence.startReading();

            return true;
        }
        else{
            this.indexCurrentSentence--;
            return false;
        }
    }
    else if(i == -1){
        this.indexCurrentSentence = 0;

        this.handleMood();

        this.allSentences[0].startReading();

        return true;
    }
}

TextBox.prototype.clear = function(){
    var sentencesToDestroy = this.allSentences.slice(0, this.indexCurrentSentence + 1);

    this.allSentences = this.allSentences.slice(this.indexCurrentSentence + 1);
    this.allDelays = this.allDelays.slice(this.indexCurrentSentence + 1);
    this.allClears = this.allClears.slice(this.indexCurrentSentence + 1);

    for(var i = 0; i < sentencesToDestroy.length; i++) {
        sentencesToDestroy[i].stopReading(true);

        this.remove(sentencesToDestroy[i]);

        sentencesToDestroy[i].phaserText.destroy();
        sentencesToDestroy[i].kill();
    }

    this.indexCurrentSentence = -1;
};

TextBox.prototype.handleVerticalOverflow = function(){
    var i = this.indexCurrentSentence;
    var currentSentence = this.allSentences[i];

    for(var j = 0; j <= i; j++) {
        var sentence = this.allSentences[j];

        if (currentSentence.y + currentSentence.phaserText.height >
            this.innerBox.y + this.innerBox.height + 0.5 * currentSentence.phaserText.fontSize){
            if (sentence.verticalScrollAnimation == null){
                var deltaHeight = Math.min(currentSentence.heightLeft,
                                           this.innerBox.height);

                sentence.heightLeft -= deltaHeight;

                var tween = game.add.tween(sentence)
                    .to({}, 1000)
                    .to({y: sentence.y - deltaHeight},
                        15000 / currentSentence.textSpeedFactor);

                tween._lastChild.onComplete.add(sentence.resetVerticalScroll,
                                                sentence);

                if (j == i){
                    sentence.pause();
                    this.closeTimer.pause();
                    tween.onComplete.add(sentence.unpause, sentence);

                    // Should work but doesn't...
                    tween.onComplete.add(this.closeTimer.resume, this);
                }

                sentence.verticalScrollAnimation = tween;

                sentence.verticalScrollAnimation.start();
            }
        }
    }
};

// Change the TextBox's height to match the height of the given sentence with the given
// width.
// In BETA...
TextBox.prototype.fitHeightToSentence = function(indexSentence, width, conserveMargin){
    if (this.displayState != TEXTBOX_CLOSED){
        return;
    }

    if (typeof(indexSentence) != "number"){
        return;
    }

    if (typeof(conserveMargin) != "number"){
        conserveMargin = 2;
    }

    if (!validIndex(indexSentence, this.allSentences)){
        return;
    }

    if ((typeof(width) != "number") ||
        (width == -1)){
        width = this.width;
    }

    this.setWidth(width, conserveMargin);
    this.setWidth(this.width + this.marginLeft + this.marginRight, conserveMargin);
    this.setHeight(this.allSentences[indexSentence].maxHeight, conserveMargin);
    this.setHeight(this.height + this.marginTop + this.marginBottom, conserveMargin);
}

TextBox.prototype.fitWidthToSentence = function(indexSentence, height, conserveMargin){
    if (this.displayState != TEXTBOX_CLOSED){
        return;
    }

    if (typeof(indexSentence) != "number"){
        return;
    }

    if (!validIndex(indexSentence, this.allSentences)){
        return;
    }

    var oldHeight = this.allSentences[indexSentence].maxHeight;
    var newWidth = this.width * oldHeight / height;

    this.setHeight(height, conserveMargin);
    this.setHeight(this.height + this.marginTop + this.marginBottom, conserveMargin);
    this.setWidth(newWidth, conserveMargin);
    this.setWidth(this.width + this.marginLeft + this.marginRight, conserveMargin);
};

TextBox.prototype.fitDurationToSentence = function(indexSentence, additionalTime){
    if (this.displayState != TEXTBOX_CLOSED){
        return;
    }

    if (this.closeTimer != null){
        return;
    }

    if (!validIndex(indexSentence, this.allSentences)){
        return;
    }

    if (typeof(additionalTime) != "number"){
        additionalTime = 0;
    }

    this.createCloseTimer(this.allSentences[indexSentence].totalReadingTime +
                          additionalTime);
}

TextBox.prototype.handleMood = function(){
    var currentSentence = this.allSentences[this.indexCurrentSentence];
    var tween = null;

    function setY(){
        this.setY(this.toto);
    }

    switch(currentSentence.mood){
    case MOOD_ANGRY:
        this.toto = this.y;
        tween = game.add.tween(this)
            .to({ toto: this.y -10 }, 40,
                Phaser.Easing.Linear.None, false, 0, 5, true)
            .to({ toto: this.y + 10 }, 40,
                Phaser.Easing.Linear.None, false, 0, 5, true);

        tween.onUpdateCallback(setY, this);
        //  tween._lastChild.onComplete(this.reset)

        currentSentence.setTextSpeedFactor(40);
        break;
    case MOOD_DYING:
        currentSentence.setTextSpeedFactor(2);
        break;
    default:
        break;
    }

    this.moodAnimation = tween;

    if (tween != null){
        this.moodAnimation.start();
    }
}
/******************************************************************************/
/* TextBox */
/***********/

/***************/
/* DialogueBox */
/******************************************************************************/

/******************************************************************************/
/* DialogueBox */
/***************/

/************/
/* Sentence */
/******************************************************************************/
var MOOD_NORMAL = 0;
var MOOD_ANGRY = 1;
var MOOD_SAD = 2;
var MOOD_FRIGHTENED = 3;
var MOOD_DYING = 4;
var MOOD_JOYFUL = 5;

var SENTENCE_NOT_READING = 0;
var SENTENCE_READING = 1;
var SENTENCE_PAUSED = 2;
var SENTENCE_FINISHED_READING = 3;

var Sentence = function(text, mood, font, fontSize, fill){
    if (typeof(text) === "undefined") text = "";
    if (typeof(text) === "number") text = text.toString();
    if (typeof(mood) != "number") mood = MOOD_NORMAL;
    if (typeof(font) != "string") font = "Arial";
    if (typeof(fontSize) != "number") fontSize = 12;
    if (typeof(fill) != "string") fill = WHITE;

    Phaser.Sprite.call(this, game, 0, 0, "");

    this.phaserText = game.add.text(0, 0, "");
    this.phaserText.font = font;
    this.phaserText.fontSize = fontSize;
    this.phaserText.fill = fill;

    this.mood = mood;

    this.addChild(this.phaserText);

    this.wholeText = text;
    this.textSpeedFactor = 1;

    this.indexCurrentLetter = 0;
    this.oldIndexCurrentLetter = -1;

    this.readingState = SENTENCE_NOT_READING;

    this.verticalScrollAnimation = null;
    this.horizontalScrollAnimation = null;

    this.speaker = null;
    this.speakerAlign = "right";

    this.totalReadingTime = 1000.0 * this.wholeText.length;
}

Sentence.prototype = Object.create(Phaser.Sprite.prototype);
Sentence.prototype.constructor = Sentence;

Sentence.prototype.setTextSpeedFactor = function(factor){
    if (typeof(factor) != "number"){
        return;
    }

    if (factor <= 0){
        this.totalReadingTime = 0;
    }
    else{
        this.totalReadingTime = 1000.0 * this.wholeText.length / factor;
    }

    this.textSpeedFactor = factor;
}

Sentence.prototype.addLetterDisplay = function(){
    if (this.oldIndexCurrentLetter == Math.floor(this.indexCurrentLetter)){
        return;
    }

    for(var i = this.oldIndexCurrentLetter + 1; i <= this.indexCurrentLetter; i++){
        if (i == 0){
            this.phaserText.text = this.wholeText[i];
        }
        else{
            this.phaserText.text += this.wholeText[i];
        }
    }

    this.oldIndexCurrentLetter = i - 1;
}

Sentence.prototype.startReading = function(){
    if (this.readingState == SENTENCE_NOT_READING){
        if (this.textSpeedFactor > 0){
            this.textDisplayAnimation = game.add.tween(this)
                .to({indexCurrentLetter: this.wholeText.length - 1},
                    this.totalReadingTime)
                .onUpdateCallback(this.addLetterDisplay, this);

            this.textDisplayAnimation.onComplete.add(this.stopReading, this);

            this.textDisplayAnimation.start();

            this.readingState = SENTENCE_READING;
        }
        else{
            this.stopReading(true);
        }
    }
}

Sentence.prototype.stopReading = function(forceStop){
    if ((typeof(forceStop) != "number") &&
        (typeof(forceStop) != "boolean")) forceStop = false;

    if (this.readingState == SENTENCE_READING ||
        forceStop){
        if (this.textDisplayAnimation != null){
            this.textDisplayAnimation.stop();
        }

        this.phaserText.text = this.wholeText;

        this.indexCurrentLetter = this.wholeText.length - 1;
        this.oldIndexCurrentLetter = this.indexCurrentLetter;

        this.readingState = SENTENCE_FINISHED_READING;
    }
}

Sentence.prototype.pause = function(){
    if (this.readingState != SENTENCE_READING){
        return;
    }

    this.textDisplayAnimation.pause();
    this.readingState = SENTENCE_PAUSED;
};

Sentence.prototype.unpause = function(){
    if (this.readingState != SENTENCE_PAUSED){
        return;
    }

    this.textDisplayAnimation.resume();
    this.readingState = SENTENCE_READING;
};



Sentence.prototype.update = function(){
    if (this.readingState == SENTENCE_READING){
    }
    else{
    }
}

Sentence.prototype.setWordWrap = function(enable, width){
    if ((typeof(enable) != "number") &&
        (typeof(enable) != "boolean")) enable = true;

    this.phaserText.wordWrap = enable;

    if (typeof(width) != "number") return;

    this.phaserText.wordWrapWidth = width;
}

Sentence.prototype.resetVerticalScroll = function(){
    if (this.verticalScrollAnimation != null){
        this.verticalScrollAnimation.stop();
        this.verticalScrollAnimation = null;
    }
}
/******************************************************************************/
/* Sentence */
/************/


function validIndex(index, array){
    if (typeof(index) != "number"){
        return false;
    }

    return (index < 0) ? 0 :
        (index >= array.length) ? 0 : 1;
}
