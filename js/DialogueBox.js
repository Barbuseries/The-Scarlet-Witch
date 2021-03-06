/***************/
/* DialogueBox */
/******************************************************************************/

var DialogueBox = function(game, outerSprite, innerSprite, egoist, enableInput){
    Phaser.Group.call(this, game);

    this.x = 0;
    this.y = game.camera.height - 100 + 10;

    this.textBox = new TextBox(game, 0, 0,
                               game.camera.width, game.camera.height - this.y,
                               outerSprite, innerSprite,
                               egoist, enableInput);

    this.speakerBox = new TextBox(game, 0, -50, 100, 40, outerSprite, innerSprite);

    var speakerName = new Sentence(game, "", MOOD_NORMAL, null, -1, 24);
    speakerName.setTextSpeedFactor(-1);
    speakerName.phaserText.align = "doublecenter";
	speakerName.phaserText.fontWeight = "bold";
	this.speakerBox.fitSentenceToTextBox = false;

    this.speakerBox.addSentence(speakerName);

    this.add(this.textBox);
    this.add(this.speakerBox);

    this.onStartToggle = new Phaser.Signal();
    this.onEndToggle = new Phaser.Signal();

    this.onUpdate = new Phaser.Signal();

    this.onNextSentence = new Phaser.Signal();

    this.onStartClose = new Phaser.Signal();
    this.onEndClose = new Phaser.Signal();

	// Link textBox Signals and dialogueBox Signals.
	// (textBox Signals are dispatched first)
    this.textBox.onStartToggle.add(this.onStartToggle.dispatch, this.onStartToggle,
                                   [this]);
    this.textBox.onEndToggle.add(this.onEndToggle.dispatch, this.onEndToggle,
                                 [this]);


    this.textBox.onNextSentence.add(this.onNextSentence.dispatch, this.onNextSentence,
                                    [this]);


    this.textBox.onStartClose.add(this.onStartClose.dispatch, this.onStartClose,
                                  [this]);
    this.textBox.onEndClose.add(this.onEndClose.dispatch, this.onEndClose,
                                [this]);


	// Link toggle and close of textBox and speakerBox.
	// (textBox Signals are dispatched first)
    this.textBox.onStartToggle.add(this.speakerBox.toggle, this.speakerBox);
    this.speakerBox.onEndToggle.add(this._initSpeakerName, this);

    this.textBox.onNextSentence.add(this._initSpeakerName, this);

    this.textBox.onStartClose.add(this.speakerBox.close, this.speakerBox);
};


DialogueBox.prototype = Object.create(Phaser.Group.prototype);
DialogueBox.prototype.constructor = DialogueBox;

DialogueBox.prototype.toggle = function(){
    this.textBox.toggle();
}

DialogueBox.prototype.close = function(){
	this.textBox.close();
}

DialogueBox.prototype.update = function(){
	this.onUpdate.dispatch();
	
	Phaser.Group.prototype.update.call(this);
}

DialogueBox.prototype._initSpeakerName = function(){
    if (validIndex(this.textBox.indexCurrentSentence, this.textBox.allSentences)){
		var i = this.textBox.indexCurrentSentence;
        var currentSentence = this.textBox.allSentences[i];
        var speakerName = this.speakerBox.allSentences[0];
        var nextSpeakerName;
        var oldSpeakerName;

        if (validIndex(i + 1, this.textBox.allSentences)){
            nextSpeakerName = this.textBox.allSentences[i + 1].getSpeakerName();

            if (nextSpeakerName != currentSentence.getSpeakerName()){
                if (!this.textBox.allClears[i]){
                    this.textBox.allClears[i] = 1;
                }
            }
        }

        if (validIndex(i - 1, this.textBox.allSentences)){
            oldSpeakerName = this.textBox.allSentences[i - 1].getSpeakerName();
        }

        if (oldSpeakerName != currentSentence.getSpeakerName()){
            speakerName.wholeText = currentSentence.getSpeakerName();
            (speakerName.wholeText == null) ? speakerName.wholeText = "" : 0;

            this.speakerBox.visible = (speakerName.wholeText != null);

            speakerName.phaserText.text = speakerName.wholeText;

            if (this.speakerBox.allSentences[0].wholeText != ""){
                this.speakerBox.fitWidthToSentence(0, 40, 2, 50);
            }

            speakerName.x = this.speakerBox.innerBox.x + this.speakerBox.innerBox.width / 2 - speakerName.phaserText.width / 2;

            speakerName.y = this.speakerBox.innerBox.y + this.speakerBox.innerBox.height / 2 - speakerName.phaserText.height / 2;

			switch(currentSentence.speaker.dialogueAlign){
				case "right":
				this.speakerBox.x = this.textBox.width - this.speakerBox.width;
				break;

				default:
				this.speakerBox.x = 0;
				break;
			}
        }

		// If the current sentence has a mood, copy the effect on the textBox
		// to speakerBox.
		speakerName.mood = currentSentence.mood;

		this.speakerBox.handleMood();
    }
    else{
        this.hideSpeakerBox();

        this.speakerBox.allSentences[0].wholeText = "";


        this.speakerBox.allSentences[0].phaserText.text = "";

        this.speakerBox.fitWidthToSentence(0, 40);
    }
}

DialogueBox.prototype.hideSpeakerBox = function(){
    this.speakerBox.visible = false;
}
/******************************************************************************/
/* DialogueBox */
/***************/
