// FIXME: Trouver un moyen de centrer/mettre a droite la premiere ligne de texte qui est
//        affichee.
//        (align ne fonctionne que quand un texte est sur plusieurs lignes)

// FIXME: Faire fonctionner le scroll avec un textSpeedFactor nul ou négatif.

/*******/
/* Box */
/*******************************************************************************/
// Creates a box at (x, y) with the given width and height.
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
    this.alpha = 0;

    this.timerNextSentence = null;
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

// Make the TextBox appear in the given time with the given alpha.
// If time is undefined, negative or zero, the TextBox will be displayed instantly.
// If no alpha is passed, the TextBox's alpha is set to 1.
// TODO: add delay and a corresponding tween to make the TextBox only appear
// for delay milliseconds.
TextBox.prototype.toggle = function(time, alpha, duration){
    if ((this.displayState == TEXTBOX_TOGGLING) ||
        (this.displayState == TEXTBOX_TOGGLED)){
        return;
    }

    this.visible = true;

    // If not time nor alpha are specified, automatically toggle the TextBox and
    // set it's alpha to 1.
    if (typeof(time) != "number"){
        if (typeof(alpha) != "number"){
            this.displayState = TEXTBOX_TOGGLED;
            this.alpha = 1;
            this.nextSentence();
            return;
        }
    }

    // If only the time is specified, alpha is set to 1.
    if (typeof(alpha) != "number"){
        alpha = 1;
    }

    if (typeof(duration) == "number"){
        this.closeAnimation = game.add.tween(this)
            .to({}, time + duration);

        this.closeAnimation.onComplete.add(this.close, this);

        this.closeAnimation.start();
    }

    // If the time is negative or zero, automatically toggle the TextBox.
    if (time <= 0){

        this.displayState = TEXTBOX_TOGGLED;
        this.alpha = alpha;
        this.nextSentence();

        return;
    }

    // Otherwhise, create a tween which will update the TextBox's alpha.
    this.toggleAnimation = game.add.tween(this)
        .to({alpha: alpha}, time);

    this.toggleAnimation.onComplete.add(this.fixTogglingState, this);
    this.toggleAnimation.onComplete.add(this.nextSentence, this);

    this.toggleAnimation.start();

    this.displayState = TEXTBOX_TOGGLING;
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

    if (typeof(time) != "number" || time <= 0){
        this.displayState = TEXTBOX_CLOSED;
        this.visible = false;
        this.clear();

        this.alpha = 0;

        return;
    }

    this.closeAnimation = game.add.tween(this)
        .to({alpha: 0}, time);

    this.closeAnimation.onComplete.add(this.fixTogglingState, this);
    this.closeAnimation.onComplete.add(this.clear, this);

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

                this.handleVerticalOverflow();
            }
            // Otherwhise, prepare te display of the next sentence.
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

    var i = this.indexCurrentSentence;

    if (validIndex(i, this.allSentences)){
		var	currentSentence = this.allSentences[i];
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
            this.innerBox.y + this.innerBox.height + currentSentence.phaserText.fontSize){
            if (sentence.verticalScrollAnimation == null){
                var deltaHeight = Math.min(currentSentence.heightLeft,
                                           this.innerBox.height);

                sentence.heightLeft -= deltaHeight;

                var tween = game.add.tween(sentence)
                    .to({}, 1000)
                    .to({y: sentence.y - deltaHeight}, 2000);

                tween._lastChild.onComplete.add(sentence.resetVerticalScroll,
                                                sentence);

                if (j == i){
                    sentence.pause();
                    tween.onComplete.add(sentence.unpause, sentence);
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

	if ((typeof(width) != "number") ||
		(typeof(indexSentence) != "number")){
		return;
	}

	if (typeof(conserveMargin) != "number"){
		conserveMargin = 2;
	}

	if (!validIndex(indexSentence, this.allSentences)){
		return;
	}

	this.setWidth(width, conserveMargin);
	this.setWidth(this.width + this.marginLeft + this.marginRight, conserveMargin);
	this.setHeight(this.allSentences[indexSentence].maxHeight, conserveMargin);
	this.setHeight(this.height + this.marginTop + this.marginBottom, conserveMargin);

	console.log(this.innerBox.width);
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
/******************************************************************************/
/* TextBox */
/***********/


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

var Sentence = function(text, speaker, mood, font, fontSize, fill){
    if (typeof(text) === "undefined") text = "";
    if (typeof(text) === "number") text = text.toString();
    if (typeof(speaker) != "object") speaker = null;
    if (typeof(mood) != "number") mood = MOOD_NORMAL;
    if (typeof(font) != "string") font = "Arial";
    if (typeof(fontSize) != "number") fontSize = 12;
    if (typeof(fill) != "string") fill = WHITE;

    Phaser.Sprite.call(this, game, 0, 0, "");

    this.phaserText = game.add.text(0, 0, "");
    this.phaserText.font = font;
    this.phaserText.fontSize = fontSize;
    this.phaserText.fill = fill;

    this.addChild(this.phaserText);

    this.wholeText = text;
    this.textSpeedFactor = 1;
    this.speaker = speaker;

    this.indexCurrentLetter = 0;
    this.oldIndexCurrentLetter = -1;

    this.readingState = SENTENCE_NOT_READING;

    this.verticalScrollAnimation = null;
    this.horizontalScrollAnimation = null;
}

Sentence.prototype = Object.create(Phaser.Sprite.prototype);
Sentence.prototype.constructor = Sentence;


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
            totalReadingTime = 1000.0 * this.wholeText.length / this.textSpeedFactor;

            this.textDisplayAnimation = game.add.tween(this)
                .to({indexCurrentLetter: this.wholeText.length - 1}, totalReadingTime)
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
    return (index < 0) ? 0 :
        (index >= array.length) ? 0 : 1;
}
