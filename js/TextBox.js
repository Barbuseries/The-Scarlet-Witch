/*******/
/* Box */
/*******/
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

var TEXTBOX_CLOSED = 0;
var TEXTBOX_TOGGLING = 1;
var TEXTBOX_TOGGLED = 2;
var TEXTBOX_CLOSING = 3;

/***********/
/* TextBox */
/***********/
/******************************************************************************/
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
	this.indexCurrentSentence = -1;

	this.visible = false;
	this.displayState = TEXTBOX_CLOSED;
	this.alpha = 0;

	this.verticalScrollAnimation = null;
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
TextBox.prototype.toggle = function(time, alpha){
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
			return;
		}
	}

	// If only the time is specified, alpha is set to 1.
	if (typeof(alpha) != "number"){
		alpha = 1;
	}

	// If the time is negative or zero, automatically toggle the TextBox.
	if (time <= 0){

		this.displayState = TEXTBOX_TOGGLED;
		this.alpha = alpha;
		
		return;
	}

	// Otherwhise, create a tween which will update the TextBox's alpha.
	this.toggleAnimation = game.add.tween(this)
		.to({alpha: alpha}, time);

	this.toggleAnimation.onComplete.add(this.fixTogglingState, this);
	
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

	if (typeof(time) != "number" || time <= 0){
		this.displayState = TEXTBOX_CLOSED;
		this.visible = false;

		this.alpha = 0;
		
		return;
	}

	this.closeAnimation = game.add.tween(this)
		.to({alpha: 0}, time);

	this.closeAnimation.onComplete.add(this.fixTogglingState, this);

	this.closeAnimation.start();

	this.displayState = TEXTBOX_CLOSING;
}

TextBox.prototype.updateMarginH = function(){
    this.innerBox.setWidth(this.width - this.marginLeft - this.marginRight);
}

TextBox.prototype.updateMarginV = function(){
    this.innerBox.setHeight(this.height - this.marginTop - this.marginBottom);
}

TextBox.prototype.setMarginLeft = function(marginLeft){
    this.setMarginH(marginLeft, "");
}

TextBox.prototype.setMarginRight = function(marginRight){
    this.setMarginH("", marginRight);
}

TextBox.prototype.setMarginTop = function(marginTop){
    this.setMarginV(marginTop, "");
}

TextBox.prototype.setMarginBottom = function(marginBottom){
    this.setMarginV("", marginBottom);
}

TextBox.prototype.setMarginH = function(marginLeft, marginRight){
    if ((typeof(marginLeft) != "number") &&
        (typeof(marginRight) != "number")) return;

    if (typeof(marginLeft) === "number"){
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
}


TextBox.prototype.setMarginV = function(marginTop, marginBottom){
    if ((typeof(marginTop) != "number") &&
        (typeof(marginBottom) != "number")) return;

    if (typeof(marginTop) === "number"){
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

TextBox.prototype.addSentence = function(sentence, index){
	if (typeof(sentence) != "object") return;
	if (typeof(index) != "number") index = -1;

	sentence.x = this.innerBox.x;
	sentence.y = this.innerBox.y;
	sentence.mask = this.innerBox.mask;
	sentence.setWordWrap(true, this.innerBox.width);

	if (sentence.phaserText.align == "center"){
		sentence.phaserText.anchor.set(0.5);
		sentence.x += this.innerBox.width / 2;
		sentence.y += this.innerBox.height / 2;
	}

	this.allSentences.splice(index, 0, sentence);
	this.add(sentence);
}

TextBox.prototype.update = function(){
	if (this.displayState == TEXTBOX_TOGGLED){
		if (this.indexCurrentSentence >= 0){
			var i  = this.indexCurrentSentence;
			
			if (this.allSentences[i].readingState == SENTENCE_READING){
				this.allSentences[i].update();

				if (this.allSentences[i].y + this.allSentences[i].phaserText.height >
					1.2 * this.innerBox.height){		
					if (this.verticalScrollAnimation == null){
						this.verticalScrollAnimation = game.add.tween(this.allSentences[i])
							.to({}, 2500 / this.allSentences[i].textSpeedFactor)
							.to({y: this.allSentences[i].y - this.innerBox.height}, 2000);

						this.verticalScrollAnimation._lastChild.onComplete.add(this.resetVerticalScroll,
																	this);
						
						this.verticalScrollAnimation.start();
					}
				}
			}
		}
	}
}

TextBox.prototype.resetVerticalScroll = function(){
	if (this.verticalScrollAnimation != null){
		this.verticalScrollAnimation.stop();
		this.verticalScrollAnimation = null;
	}
}

TextBox.prototype.nextLine = function(){
	if (this.displayState != TEXTBOX_TOGGLED) return;

	if (this.allSentences.length < 1) return;

	if (this.indexCurrentSentence >= 0){
		if (this.indexCurrentSentence < this.allSentences.length){
			this.allSentences[this.indexCurrentSentence++].stopReading();

			if (this.indexCurrentSentence < this.allSentences.length){
				this.allSentences[this.indexCurrentSentence].startReading();
				
				return true;
			}
			else{
				return false;
			}
		}
	}
	else{
		this.indexCurrentSentence = 0;
		
		this.allSentences[0].startReading();

		return true;
	}
}
/******************************************************************************/

/************/
/* Sentence */
/************/
/******************************************************************************/
var MOOD_NORMAL = 0;
var MOOD_ANGRY = 1;
var MOOD_SAD = 2;
var MOOD_FRIGHTENED = 3;
var MOOD_DYING = 4;
var MOOD_JOYFUL = 5;

var SENTENCE_NOT_READING = 0;
var SENTENCE_READING = 1;
var SENTENCE_FINISHED_READING = 2;

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
    if (this.readingState == 0){
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
			this.phaserText.text = this.wholeText;

			this.indexCurrentLetter = this.wholeText.length - 1;
			this.oldIndexCurrentLetter = this.indexCurrentLetter;

			this.stopReading();
		}	
    }
}

Sentence.prototype.stopReading = function(){
    if (this.readingState){
		this.readingState = SENTENCE_FINISHED_READING;
    }
}

Sentence.prototype.update = function(){
    if (this.readingState = SENTENCE_READING){
    }
	else{
	}
}

Sentence.prototype.setWordWrap = function(enable, width){
	if (typeof(enable) != "number") enable = true;

	this.phaserText.wordWrap = enable;

	if (typeof(width) != "number") return;

	this.phaserText.wordWrapWidth = width;
}
/******************************************************************************/
