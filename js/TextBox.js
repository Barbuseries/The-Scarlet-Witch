/*******/
/* Box */
/*******************************************************************************/
// Create a box at (x, y) with the given width and height.
// If the Box has a mask, everything going out of it will be cropped.
var Box = function(game, x, y, width, height, sprite, hasMask, enableInput){
    if (!booleanable(hasMask)) hasMask = false;
	if (!booleanable(enableInput)) enableInput = false;

    Phaser.Sprite.call(this, game, x, y, sprite);

    this.width = width;
    this.height = height;

    if (hasMask){
        this.mask = game.add.graphics(0, 0);
        this.addChild(this.mask);

        this.updateMask();
    }
    else{
        this.mask = null;
    }

	this.inputEnabled = enableInput;

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


// Set the Box's position at the given position.
// If only the first value is correct, x and y will be set to the same value.
// (Example : Calling the function with only one parameter)
// Update the Box's mask's position if there's any.
Box.prototype.setPosition = function(x, y){
    if (typeof(y) != "number"){
        y = x;
    }

    this.x = x;
    this.y = y;
};

// Clear and redraw the mask at it's position and with it's dimensions.
Box.prototype.updateMask = function(){
    if (this.mask != null){
        this.mask.clear();

        this.mask.beginFill(H_WHITE);

        this.mask.drawRect(-this.anchor.x * this.width / this.scale.x,
                           -this.anchor.y * this.height / this.scale.y,
                           this.width / this.scale.x,
                           this.height / this.scale.y);
        this.mask.endFill();
    }
}

Box.prototype.setAnchor = function(x, y){
    this.anchor.setTo(x, y);
    this.updateMask();
}

Box.prototype.add = function(child){
	child.scale.x /= this.scale.x;
	child.scale.y /= this.scale.y;

	this.addChild(child);
}

Box.prototype.kill = function(){
    if (this.mask != null){
        this.mask.destroy();
    }

    Phaser.Sprite.prototype.kill.call(this);
}

Box.prototype.destroy = function(){
    if (this.mask != null){
        this.mask.destroy();
    }

    Phaser.Sprite.prototype.destroy.call(this);
	
	this.removeChildren();
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


var TextBox = function(game, x, y, width, height, outerSprite, innerSprite, egoist,
					   enableInput){
    if (typeof(x) != "number") x = 0;
    if (typeof(y) != "number") y = 0;
    if (typeof(width) != "number") width = 0;
    if (typeof(height) != "number") height = 0;
    if (typeof(outerSprite) != "string") outerSprite = "";
    if (typeof(innerSprite) != "string") innerSprite = "";
    if (!booleanable(egoist)) egoist = false;
	if (!booleanable(enableInput)) enableInput = false;

    Phaser.Group.call(this, game);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // Does not have a mask.
    this.outerBox = new Box(game, 0, 0, width, height, outerSprite);

    // Box into which the text is written.
    this.innerBox = new Box(game, 0, 0, width, height, innerSprite, true, enableInput);

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

    this.egoist = egoist;
	this.enableInput = enableInput;

	if (this.enableInput){
		this.innerBox.events.onInputDown.add(this.handleUserInput, this);    
	}

    this.timerNextSentence = null;

    this.toggleAnimation = null;
    this.closeAnimation = null;

    this.toggleTimer = null;
    this.closeTimer = null;

    this.onStartToggle = new Phaser.Signal();
    this.onEndToggle = new Phaser.Signal();

    this.onUpdate = new Phaser.Signal();

	this.onNextSentence = new Phaser.Signal();

    this.onStartClose = new Phaser.Signal();
    this.onEndClose = new Phaser.Signal();

    this.onEndToggle.add(this.fixTogglingState, this);
    this.onEndToggle.add(this.nextSentence, this);

    this.onEndClose.add(this.fixTogglingState, this);
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

TextBox.prototype.createAnimation = function(type, directionH, directionV,
                                             time, alpha, easing){
    if ((type != "toggle") &&
        (type != "close")){
        return;
    }

    if (type == "toggle"){
        // If there's already a toggle animation, do nothing.
        // It's up to you to deal with the old one and then set a new one.
        if (this.toggleAnimation != null){
            return;
        }
    }
    else{
        // The same goes for a close animation.
        if (this.closeAnimation != null){
            return;
        }
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

    // Alpha is ignored if it's a close animation.
    if (type == "toggle"){
        // By default, the final alpha is set to the TextBox's current alpha (make sure
        // to change it as, by default, it's equal to 1).
        if ((typeof(alpha) != "number") ||
            (alpha < 0)){
            alpha = this.alpha;
        }
    }


    if ((directionH != "right") &&
        (directionH != "left") &&
        (directionH != "both")){
        directionH = "none";
    }

    if ((directionV != "down") &&
        (directionV != "up") &&
        (directionV != "both")){
        directionV = "none";
    }

    // By default, the animation is linear.
    if (typeof(easing) != "function"){
        easing = Phaser.Easing.Linear.None;
    }

    var scaleX = 1;
    var scaleY = 1;

    var finalScaleX = 1;
    var finalScaleY = 1;

    var anchorX = 0;
    var anchorY = 0;

    var x = this.x;
    var y = this.y;


    switch (directionH){
    case "right":
        scaleX = 0;
        break;

    case "left":
        scaleX = 0;
        anchorX = 1;
        break;

    case "both":
        scaleX = 0;
        anchorX = 0.5;

    default:
        break;
    }

    switch (directionV){
    case "down":
        scaleY = 0;
        break;

    case "up":
        scaleY = 0;
        anchorY = 1;
        break;

    case "both":
        scaleY = 0;
        anchorY = 0.5;

    default:
        break;
    }


    if (type == "close"){
        if (anchorX != 0.5){
            anchorX = !anchorX;
        }

        if (anchorY != 0.5){
            anchorY = !anchorY;
        }

        var temp = scaleX;
        scaleX = finalScaleX;
        finalScaleX = temp;

        temp = scaleY;
        scaleY = finalScaleY;
        finalScaleY = temp;
    }


    function init(){
        this.alpha = alpha * (type == "close");
        this.outerBox.setAnchor(anchorX, anchorY);
        this.innerBox.setAnchor(anchorX, anchorY);

        this.x += anchorX * this.width;
        this.y += anchorY * this.height;

        this.innerBox.x = this.marginLeft * (1 - anchorX) - this.marginRight * anchorX;
        this.innerBox.y = this.marginTop * (1 - anchorY) - this.marginBottom * anchorY;

        for(var i = 0; i < this.allSentences.length; i++) {
            this.allSentences[i].x -= anchorX * this.width;
            this.allSentences[i].y -= anchorY * this.height;
        }
    }

    function update(){
        this.alpha = alpha * Math.min(this.scale.x, this.scale.y);
    }

    function reset(){
        this.outerBox.setAnchor(0, 0);
        this.innerBox.setAnchor(0, 0);

        for(var i = 0; i < this.allSentences.length; i++) {
            this.allSentences[i].x += anchorX * this.width;
            this.allSentences[i].y += anchorY * this.height;
        }

        this.scale.setTo(1, 1);
        this.x = x;
        this.y = y;
        this.alpha = alpha;

        this.innerBox.x = this.marginLeft;
        this.innerBox.y = this.marginTop;
    }

    var tween;

    if ((scaleX == finalScaleX) &&
        (scaleY == finalScaleY)){
        tween = this.game.add.tween(this)
            .to({alpha: alpha * (type == "close")}, 1)
            .to({alpha: alpha * (type == "toggle")}, time, easing);
    }
    else{
        tween = this.game.add.tween(this.scale)
            .to({x: scaleX, y: scaleY}, 1)
            .to({x: finalScaleX, y: finalScaleY}, time, easing);

        tween.onStart.add(init, this);

        tween._lastChild.onUpdateCallback(update, this);

        tween._lastChild.onComplete.add(reset, this);
    }

    if (type == "toggle"){
        this.toggleAnimation = tween;
    }
    else{
        this.closeAnimation = tween;
    }
}

TextBox.prototype.createToggleTimer = function(time){
    if (this.toggleTimer != null){
        return;
    }

    // By default, the timer waits 500 milliseconds.
    if (typeof(time) != "number"){
        time = 500;
    }
    // If the time is negative or zero, no need to create a timer.
    else if (time <= 0){
        return;
    }

    this.toggleTimer = this.game.time.create(false);

    this.toggleTimer.loop(time, this.toggle, this);
}

TextBox.prototype.createCloseTimer = function(time, startOnEndToggle){
    if (this.closeTimer != null){
        return;
    }

    // By default, the timer waits 500 milliseconds.
    if (typeof(time) != "number"){
        time = 500;
    }
    // If the time is negative or zero, no need to create a timer.
    else if (time <= 0){
        return;
    }

    if (!booleanable(startOnEndToggle)){
        startOnEndToggle = true;
    }

    this.closeTimer = this.game.time.create(false);

    this.closeTimer.loop(time, this.close, this);

    if (startOnEndToggle){
        this.onEndToggle.add(function(){resumeLoopedTimer(this.closeTimer)}, this);
    }
}

// Make the TextBox appear.
TextBox.prototype.toggle = function(){
    if ((this.displayState == TEXTBOX_TOGGLING) ||
        (this.displayState == TEXTBOX_TOGGLED)){
        return;
    }

    function setVisible(){
        this.visible = true;
    }

    this.onStartToggle.dispatch(this);

    if (this.toggleTimer != null){
        this.toggleTimer.pause();
    }

    // If there's no toggle animation, just start reading...
    if (this.toggleAnimation == null){
        this.visible = true;

        this.displayState = TEXTBOX_TOGGLED;

        this.onEndToggle.dispatch(this);
    }
    else{
        // Kind of a hack : wait until toggleAnimation has finished to init to set
        // the TextBox to visible, otherwhise, it's quite ugly.
        this.toggleAnimation.onComplete.add(setVisible, this);
        this.toggleAnimation._lastChild.onComplete.add(this.onEndToggle.dispatch,
                                                       this);
        this.toggleAnimation.start();
        this.displayState = TEXTBOX_TOGGLING;
    }
}

// Close the TextBox.
// If no time is specified, the TextBox will be automatically closed.
TextBox.prototype.close = function(){
    if ((this.displayState == TEXTBOX_CLOSING) ||
        (this.displayState == TEXTBOX_CLOSED)){
        return;
    }

    if (typeof(this.allSentences[this.indexCurrentSentence]) != "undefined"){
        if (this.allSentences[this.indexCurrentSentence].readingState == SENTENCE_READING){
            this.allSentences[this.indexCurrentSentence].stopReading(true);
        }

        // A hack : If I don't do that, when the TextBox reappears, it will close
        // automatically.
        this.allSentences[this.indexCurrentSentence].readingState = SENTENCE_READING;
    }

    this.onStartClose.dispatch(this);

    if (this.closeTimer != null){
        this.closeTimer.pause();
    }

    if (this.closeAnimation == null){
        this.displayState = TEXTBOX_CLOSED;
        this.visible = false;

        this.onEndClose.dispatch(this);

        return;
    }

    this.closeAnimation._lastChild.onComplete.add(this.onEndClose.dispatch, this);

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
    if ((typeof(marginLeft) != "number") &&
        (typeof(marginRight) != "number")) return;

    if (!booleanable(isPercentage)){
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

        this.innerBox.x = this.marginLeft;

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


TextBox.prototype.setMarginV = function(marginTop, marginBottom, isPercentage){
    if ((typeof(marginTop) != "number") &&
        (typeof(marginBottom) != "number")) return;

    if (!booleanable(isPercentage)){
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

        this.innerBox.y = this.marginTop;

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
		var sentence = this.allSentences[i];
		var beforeText = sentence.phaserText.text;

        sentence.setWordWrap(true, this.innerBox.width);
        sentence.phaserText.text = sentence.wholeText;
        sentence.heightLeft = sentence.phaserText.height;
        sentence.maxHeight = sentence.heightLeft;

        sentence.phaserText.text = beforeText;
    }
}

TextBox.prototype.setPosition = function(x, y){
    if (typeof(y) != "number") y = x;

    this.x = x;
    this.y = y;
}

TextBox.prototype.addSentence = function(sentence, delay, toClear, index){
    if (typeof(sentence) != "object") return;
    if (typeof(delay) != "number") delay = -1;
    if (typeof(toClear) != "number") toClear = 0;
    if (typeof(index) != "number") index = this.allSentences.length;

    sentence.x = this.innerBox.x;
    sentence.y = this.innerBox.y;

    sentence.setWordWrap(true, this.innerBox.width);

    sentence.phaserText.text = sentence.wholeText;
    sentence.heightLeft = sentence.phaserText.height;
    sentence.maxHeight = sentence.heightLeft;

    sentence.widthLeft = sentence.phaserText.width;
    sentence.maxWidth = sentence.widthLeft;

    sentence.phaserText.text = "";

    switch (sentence.phaserText.align){
    case "center":
        sentence.x += this.innerBox.width / 2;
        break;

    case "right":
        sentence.x += this.innerBox.width;
		break;

	case "doublecenter":
		sentence.x += this.innerBox.width / 2;
		sentence.y += this.innerBox.height / 2;
		break;

    default:
        break;
    }
    sentence.mask = this.innerBox.mask;

    this.allSentences.splice(index, 0, sentence);
    this.allDelays.splice(index, 0, delay);
    this.allClears.splice(index, 0, toClear);
    this.add(sentence);
}

// Called every frame.
TextBox.prototype.update = function(){
    this.onUpdate.dispatch(this);

    // If the TextBox is not completely toggled, do nothing.
    if (this.displayState == TEXTBOX_TOGGLED){
        // If the index of the current sentence is valid,
        if (validIndex(this.indexCurrentSentence, this.allSentences)){
            var i  = this.indexCurrentSentence;
            var currentSentence = this.allSentences[i];

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

				case "doublecenter":
					currentSentence.x = this.innerBox.x + this.innerBox.width / 2 -
                        currentSentence.phaserText.width / 2;

					currentSentence.y = this.innerBox.y + this.innerBox.height / 2 -
                        currentSentence.phaserText.height / 2;
					break;

                default:
                    break;
                }
            }


            this.handleVerticalOverflow();

            // If the current sentence is being read or is paused,
            if (currentSentence.readingState == SENTENCE_READING ||
                currentSentence.readingState == SENTENCE_PAUSED){
                currentSentence.update();

            }
            // Otherwhise, prepare the display of the next sentence.
            else{
                // If the delay until the next sentence is negative, wait until
                // user's input.
                if (this.allDelays[i] < 0){
                    if (this.enableInput){
                        console.log("PRESS A KEY TO CONTINUE !");
                    }
                    else{
                        /*if (this.indexCurrentSentence < this.allSentences.length - 1){
                          this.nextSentence();
                          }
                          else{

                          }*/
                    }
                }
                // Otherwhise, wait the given time to start reading the next sentence.
                else if (this.timerNextSentence == null){
                    var delay = this.allDelays[i];

                    this.timerNextSentence = this.game.time.create(true);
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

    if (this.timerNextSentence){
        this.timerNextSentence.stop();
        this.timerNextSentence = null;
    }

    var i = this.indexCurrentSentence;


    if (validIndex(i, this.allSentences)){
        var currentSentence = this.allSentences[i];
        var nextSentence = this.allSentences[i + 1];

        // Only case it can happen is when the user clicks on the TextBox.
        if (currentSentence.readingState == SENTENCE_READING){
            currentSentence.stopReading();

            // If I don't do that switch, the text will not be correctly
            // aligned if it's centered or righted.
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

            return;
        }

        // Clear the TextBox if needed.
        if (this.allClears[i]){
            this.clear(this.allClears[i] - 1);

            // If the Sentences have been destroyed, set nextSentence as the first valid one.
            if (this.indexCurrentSentence == -1){
                nextSentence = this.allSentences[0];
            }
        }
        // Otherwhise, the nextSentence will start below the currentSentence.
        else if (typeof(nextSentence) != "undefined"){
            nextSentence.y = currentSentence.y + currentSentence.phaserText.height;
        }

        // If there's a nextSentence, do what needs to be done and start reading.
        if (typeof(nextSentence) != "undefined"){
            this.indexCurrentSentence++;

            this.handleMood();

			this.onNextSentence.dispatch(this);

            nextSentence.startReading();

            return true;
        }

        // Otherwhise, close the TextBox.
        else{
            if (currentSentence.verticalScrollAnimation != null){
                currentSentence.verticalScrollAnimation._lastChild.onComplete.add(this.close,
                                                                                  this);
            }
            else{
                this.close();
            }

            return false;
        }
    }
    else if(i == -1){
        if (this.allSentences.length > 0){
            this.indexCurrentSentence = 0;

            this.handleMood();
			
			this.onNextSentence.dispatch(this);

            this.allSentences[0].startReading();

            return true;
        }
        /*else{
            this.close();

            return false;
        }*/
    }
}

TextBox.prototype.clear = function(destroySentences){
    if ((typeof(destroySentences) != "boolean") &&
        (typeof(destroySentences) != "number")){
        destroySentences = false;
    }

    if (destroySentences){
        var index = this.indexCurrentSentence;
        var sentencesToDestroy = this.allSentences.slice(0, index + 1);

        this.allSentences = this.allSentences.slice(index + 1);
        this.allDelays = this.allDelays.slice(index + 1);
        this.allClears = this.allClears.slice(index + 1);

        for(var i = 0; i < sentencesToDestroy.length; i++) {
            this.remove(sentencesToDestroy[i]);

            sentencesToDestroy[i].destroy();
        }

        this.indexCurrentSentence = -1;
    }
    else{
        for(var i = 0; i <= this.indexCurrentSentence; i++) {
            this.allSentences[i].alpha = 0;
        }
    }
};

TextBox.prototype.reset = function(){
    for(var i = 0; i <= this.indexCurrentSentence; i++) {
        if(!validIndex(this.indexCurrentSentence, this.allSentences)){
            return;
        }

        this.allSentences[i].reset();
        this.allSentences[i].x = this.innerBox.x;
        this.allSentences[i].y = this.innerBox.y;
    }

    this.indexCurrentSentence = -1;

    if (this.timerNextSentence != null){
        this.timerNextSentence.stop();
        this.timerNextSentence = null;
    }
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

                var minDelay = 1000;

                if (currentSentence.textSpeedFactor <= 0){
                    minDelay = 500;
                }

                sentence.heightLeft -= deltaHeight;

                var tween = this.game.add.tween(sentence)
                    .to({}, minDelay)
                    .to({y: sentence.y - deltaHeight},
                        Math.max(15000 / currentSentence.textSpeedFactor, 100));

                tween._lastChild.onComplete.add(function(){sentence.stopAnimation(0)},
                                                sentence);

                if (j == i){
                    sentence.pause();
                    tween.onComplete.add(sentence.unpause, sentence);

                    if (this.closeTimer != null){
                        this.closeTimer.pause();

                        tween.onComplete.add(this.closeTimer.resume, this.closeTimer);
                    }
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
    if (typeof(indexSentence) != "number"){
        return;
    }

    if (!validIndex(indexSentence, this.allSentences)){
        return;
    }

	if ((typeof(height) === "undefined") ||
	   (height == -1)){
		height = this.height;
	}

	var sentence = this.allSentences[this.indexCurrentSentence];
	var beforeText = sentence.phaserText.text;
	
	sentence.wordWrap = false;
	sentence.phaserText.text = sentence.wholeText;

	var oldWidth = sentence.phaserText.width;
	var oldHeight = sentence.phaserText.height;

	var newWidth = oldHeight * oldWidth / height;

	sentence.wordWrap = true;
	sentence.phaserText.text = beforeText;

    this.setHeight(height, conserveMargin);
    //this.setHeight(this.height + this.marginTop + this.marginBottom, conserveMargin);
    this.setWidth(newWidth + 50, conserveMargin);
    //this.setWidth(this.width + this.marginLeft + this.marginRight, conserveMargin);
};

TextBox.prototype.fitDurationToSentence = function(indexSentence, additionalTime){
    if (!validIndex(indexSentence, this.allSentences)){
        return;
    }

    this.createCloseTimer(additionalTime, false);

    this.allSentences[indexSentence].onEndReading.add(function(){resumeLoopedTimer(this.closeTimer)}, this);
}

TextBox.prototype.handleMood = function(){
    var currentSentence = this.allSentences[this.indexCurrentSentence];
    var tween = null;

    switch(currentSentence.mood){
    case MOOD_ANGRY:
        this.toto = this.y;
        tween = this.game.add.tween(this)
            .to({ y: this.y -10}, 50,
                Phaser.Easing.Linear.None, false, 0, 5, true);

        currentSentence.moodAnimation = tween;
        break;
    case MOOD_DYING:
        break;
    default:
        break;
    }

    this.moodAnimation = tween;

    if (tween != null){
        this.moodAnimation.start();
    }
}

TextBox.prototype.handleUserInput = function(){
    if (this.timerNextSentence != null){
        return;
    }

    if (validIndex(this.indexCurrentSentence, this.allSentences)){
        if (this.allSentences[this.indexCurrentSentence].verticalScrollAnimation != null){

            return;
        }
    }

    this.nextSentence();
}

TextBox.prototype.kill = function(){
    this.callAll("kill");
    this.removeAll();

    this._del();

	this.onStartToggle = null;
	this.onEndToggle = null;

	this.onUpdate = null;

	this.onStartClose = null;
	this.onEndClose = null;

    this.parent.remove(this, true);
}

TextBox.prototype.destroy = function(){
    this.removeAll(true);

    this._del();

    this.parent.remove(this, true);
}

TextBox.prototype._del = function(){
    this.allSentences = [];
    this.allDelays = [];
    this.allClears = [];

    this.onStartToggle.dispose();
    this.onEndToggle.dispose();
	
    this.onUpdate.dispose();
	
    this.onStartClose.dispose();
    this.onEndClose.dispose();
	
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

var Sentence = function(game, text, mood, speaker, textSpeedFactor, font, fontSize,
						fill){
    if (typeof(text) === "undefined") text = "";
    if (typeof(text) === "number") text = text.toString();
    if (typeof(mood) != "number") mood = MOOD_NORMAL;
	if ((typeof(speaker) != "object") && (typeof(speaker) != "string")) speaker = null;
	if (typeof(textSpeedFactor) != "number") textSpeedFactor = 60;
    if (typeof(font) != "string") font = "Arial";
    if (typeof(fontSize) != "number") fontSize = 24;
    if (typeof(fill) != "string") fill = WHITE;

    Phaser.Sprite.call(this, game, 0, 0, "");

    this.phaserText = game.add.text(0, 0, "");
    this.phaserText.font = font;
    this.phaserText.fontSize = fontSize;
    this.phaserText.fill = fill;

    this.wholeText = text;
    this.textSpeedFactor = textSpeedFactor;

    this.readingEasing = Phaser.Easing.Linear.None;

    this.setMood(mood);

    this.addChild(this.phaserText);

    this.indexCurrentLetter = 0;
    this.oldIndexCurrentLetter = -1;

    this.readingState = SENTENCE_NOT_READING;

    this.verticalScrollAnimation = null;
    this.horizontalScrollAnimation = null;
    this.moodAnimation = null;

    this.speaker = speaker;

    this.totalReadingTime = 1000.0 * this.wholeText.length / this.textSpeedFactor;

    this.onStartReading = new Phaser.Signal();

    this.onUpdate = new Phaser.Signal();

    this.onEndReading = new Phaser.Signal();

    this.phaserText.text = this.wholeText;
    this.heightLeft = this.phaserText.height;
    this.maxHeight = this.heightLeft;

    this.widthLeft = this.phaserText.width;
    this.maxWidth = this.widthLeft;

    this.phaserText.text = "";
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

Sentence.prototype.setMood = function(mood){
    switch (mood){
    case MOOD_NORMAL:
        this.mood = mood;
        break;

    case MOOD_ANGRY:
        this.mood = mood;
        this.readingEasing = Phaser.Easing.Cubic.In;
        this.setTextSpeedFactor(40);
        break;

    case MOOD_SAD:
        this.mood = mood;
        break;

    case MOOD_FRIGHTENED:
        this.mood = mood;
        break;

    case MOOD_DYING:
        this.mood = mood;
        this.setTextSpeedFactor(2);
        break;

    case MOOD_JOYFUL:
        this.mood = mood;
        break;

    default:
        break;
    }
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
            if (validIndex(i, this.wholeText)){
                this.phaserText.text += this.wholeText[i];
            }
        }
    }

    this.oldIndexCurrentLetter = i - 1;
}

Sentence.prototype.startReading = function(){
    if (this.readingState == SENTENCE_NOT_READING){

        this.onStartReading.dispatch(this);

        if (this.textSpeedFactor > 0){
            this.textDisplayAnimation = this.game.add.tween(this)
                .to({indexCurrentLetter: this.wholeText.length},
                    this.totalReadingTime, this.readingEasing)
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

            this.textDisplayAnimation = null;
        }

        this.phaserText.text = this.wholeText;

        this.indexCurrentLetter = this.wholeText.length - 1;
        this.oldIndexCurrentLetter = this.indexCurrentLetter;

        this.readingState = SENTENCE_FINISHED_READING;

        this.onEndReading.dispatch(this);
    }
}

Sentence.prototype.pause = function(){
    if (this.readingState != SENTENCE_READING){
        return;
    }

    if (this.textDisplayAnimation != null){
        this.textDisplayAnimation.pause();
    }

    this.readingState = SENTENCE_PAUSED;
};

Sentence.prototype.unpause = function(){
    if (this.readingState != SENTENCE_PAUSED){
        return;
    }

    if (this.textDisplayAnimation != null){
        this.textDisplayAnimation.resume();
    }

    this.readingState = SENTENCE_READING;
};



Sentence.prototype.update = function(){
    this.onUpdate.dispatch();

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

Sentence.prototype.reset = function(){
    this.phaserText.text = "";
    this.oldIndexCurrentLetter = -1;
    this.indexCurrentLetter = 0;

    this.readingState = SENTENCE_NOT_READING;

    this.stopAnimation(-1);

    this.widthLeft = this.maxWidth;
    this.heightLeft = this.maxHeight;
};

Sentence.prototype.stopAnimation = function(type){
    if (typeof(type) != "number"){
        return;
    }

    if ((type == 0) ||
        (type == -1)){
        if (this.verticalScrollAnimation != null){
            this.verticalScrollAnimation.stop();
            this.verticalScrollAnimation = null;
        }
    }

    if ((type == 1) ||
        (type == -1)){
        if (this.horizontalScrollAnimation != null){
            this.horizontalScrollAnimation.stop();
            this.horizontalScrollAnimation = null;
        }
    }

    if ((type == 2) ||
        (type == -1)){
        if (this.moodAnimation != null){
            this.moodAnimation.stop();
            this.moodAnimation = null;
        }
    }
}

Sentence.prototype.getSpeakerName = function(){
	if (this.speaker == null){
		return null;
	}
	if (typeof(this.speaker) === "object"){
		return this.speaker.name;
	}
	else{
		return this.speaker;
	}
}

Sentence.prototype.getSpeakerAlign = function(){
	if (this.speaker == null){
		return undefined;
	}
	else if(typeof(this.speaker) === "object"){
		return this.speaker.dialogueAlign;
	}
	else{
		return undefined;
	}
}

// kill() and destroy() are the same.
Sentence.prototype.kill = function(){
    this.destroy();
}

Sentence.prototype.destroy = function(){
    this._del();

    Phaser.Sprite.prototype.destroy.call(this);
}

Sentence.prototype._del = function(){
    this.phaserText.destroy();
	this.phaserText = null;

    if (this.readingState == SENTENCE_READING){
        this.stopReading(true);
    }

    this.stopAnimation(-1);

    this.onStartReading.dispose();
	this.onStartReading = null;

    this.onUpdate.dispose();
	this.onUpdate = null;

    this.onEndReading.dispose();
	this.onEndReading = null;
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

function booleanable(value){
    return ((typeof(value) == "number") ||
            (typeof(value) == "boolean"));
}

function resumeLoopedTimer(loopedTimer){
    if (loopedTimer.paused == false){
        loopedTimer.start();
    }
    else{
        loopedTimer.resume();
    }
}
