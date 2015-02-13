/*******/
/* Box */
/*******/
/*******************************************************************************/
var Box = function(x, y, width, height, sprite){
    Phaser.Sprite.call(this, game, x, y, sprite);

    this.width = width;
    this.height = height;

    this.mask = game.add.graphics(x, y);
    this.mask.isMask = true;

    //this.addChild(this.mask);

    this.updateMask();

    game.add.existing(this);
}


Box.prototype = Object.create(Phaser.Sprite.prototype);
Box.prototype.constructor = Box;

Box.prototype.setWidth = function(width){
    this.width = width;
    this.updateMask();
};

Box.prototype.setHeight = function(height){
    this.height = height;
    this.updateMask();
};

Box.prototype.setX = function(x){
    if (typeof(x) != "number") return;

    this.x = x;
    this.mask.x = x;
};

Box.prototype.setY = function(y){
    if (typeof(y) != "number") return;

    this.y = y;
    this.mask.y = y;
};

Box.prototype.moveTo = function(x, y){
    this.setX(x);
    this.setY(y);
};

Box.prototype.updateMask = function(){
    this.mask.clear();

    this.mask.beginFill(H_WHITE);

    this.mask.drawRect(0, 0,
                       this.width, this.height);
    this.mask.endFill();
}
/******************************************************************************/


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

    this.outerBox = new Box(0, 0, width, height, outerSprite);
    this.outerBox.mask.x = x;
    this.outerBox.mask.y = y;

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
	this.isToggled = false;
}

TextBox.prototype = Object.create(Phaser.Group.prototype);
TextBox.prototype.constructor = TextBox;

TextBox.prototype.toggle = function(){
	this.visible = true;
	this.isToggled = true;
}

TextBox.prototype.close = function(){
	this.visible = false;
	this.isToggled = false;
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
    var deltaX = x - this.x;

    this.outerBox.mask.x += deltaX;
    this.innerBox.mask.x += deltaX;

    this.x += deltaX;
};


TextBox.prototype.setY = function(y){
    var deltaY = y - this.y;

    this.outerBox.mask.y += deltaY;
    this.innerBox.mask.y += deltaY;

    this.y += deltaY;
};

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
	if (this.isToggled){
		if (this.indexCurrentSentence >= 0){
			this.allSentences[this.indexCurrentSentence].update();
		}
	}
}

TextBox.prototype.nextLine = function(){
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

var MOOD_NORMAL = 0;
var MOOD_ANGRY = 1;
var MOOD_SAD = 2;
var MOOD_FRIGHTENED = 3;
var MOOD_DYING = 4;
var MOOD_JOYFUL = 5;

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

    this.isReading = false;
    this.totalReadingTime = 1000.0 * this.wholeText.length / this.textSpeedFactor;
    this.readingTimeout = 0;
}

Sentence.prototype = Object.create(Phaser.Sprite.prototype);
Sentence.prototype.constructor = Sentence;

Sentence.prototype.startReading = function(){
    if (!this.isReading){
        this.isReading = true;

        this.readingTimeout = 0;
    }
}

Sentence.prototype.stopReading = function(){
    if (this.isReading){
        this.isReading = false;

        this.readingTimeout = 0;
    }
}

Sentence.prototype.update = function(){
    if (this.isReading){
        if (this.textSpeedFactor > 0){
            if (!this.readingTimeout){
                if (this.indexCurrentLetter == 0){
                    this.phaserText.text = this.wholeText[this.indexCurrentLetter];
                }
                else{
                    this.phaserText.text += this.wholeText[this.indexCurrentLetter];
                }

                this.indexCurrentLetter++;

                if (this.indexCurrentLetter >= this.wholeText.length){
                    return this.stopReading();
                }
                else{
                    this.readingTimeout = 1000.0 / this.textSpeedFactor;
                }
            }

            this.readingTimeout -= 1000.0 / FPS;

            if (this.readingTimeout < 0){
                this.readingTimeout = 0;
            }
        }
		else{
			this.phaserText.text = this.wholeText;
			
			this.indexCurrentLetter = this.wholeText.length -1;

			this.stopReading();
		}
    }
}

Sentence.prototype.setWordWrap = function(enable, width){
	if (typeof(enable) != "number") enable = true;

	this.phaserText.wordWrap = enable;

	if (typeof(width) != "number") return;

	this.phaserText.wordWrapWidth = width;
}
