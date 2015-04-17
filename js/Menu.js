/********/
/* Menu */
/******************************************************************************/
var Menu = function(game, manager, title, x, y, width, height, sprite, cursor){
	Interface.call(this, game, x, y, width, height, sprite);

	if (typeof(BasicGame.sfx.cursorSelect) === "undefined"){
		BasicGame.sfx.cursorSelect = this.game.audio.load("cursor_select");
	}

	
	this.manager = manager;
	
	this.title = this.game.add.text(this.width / 2, 0, title,
									{ font: "30px Arial", fill: "#ffffff"});

	this.title.anchor.setTo(0.5, 0);
	this.title.visible = false;

	this.add(this.title);
	
	this.cursor = this.game.add.sprite(0, 0, cursor);

	this.cursor.anchor.setTo(1, 0.5);
	
	this.cursorTween = null;
	
	this.offsetCursorX = - this.cursor.width;
	this.offsetCursorY = 0;
	
	this.add(this.cursor);
	
	this.cursor.visible = false;


	this.indexCurrentOption = -1;
	
	this.allOptions = [];
	
	this.toric = true;
	
	this.hasFocus = true;
	this.mouseEnabled = false;
	this.showTitle = false;
}

Menu.prototype = Object.create(Interface.prototype);
Menu.prototype.constructor = Menu;


Menu.prototype.addOption = function(option){
	this.allOptions.push(option);
	
	this.add(option.display);

	if (this.indexCurrentOption == -1){
		this.indexCurrentOption = 0;
		this.cursor.visible = true;
		
		this.updateCursorPosition();
	}
}

// Enable the use of the mouse to choose and select an option.
Menu.prototype.enableMouse = function(){
	var self = this;
	
	function moveToCursor(sprite){
		var oldIndex = self.indexCurrentOption;
		var oldOption = self.getCurrentOption();
		
		self.indexCurrentOption = sprite._index;
		
		var option = self.getCurrentOption();
		
		if (oldIndex != sprite._index){
			BasicGame.sfx.cursorSelect.play("", 0, BasicGame.volume.sfx);

			oldOption.onOut.dispatch(oldOption);
			option.onOver.dispatch(option);

			self.updateCursorPosition();
		
			self.updateCursorTween();
		}
		else{
			option.whileOver.dispatch(option);
		}
	}
	

	for(var i = 0; i < this.allOptions.length; i++) {
		var option = this.allOptions[i];

		option.enableMouse();

		option.display._index = i;

		option.display.events.onInputOver.add(moveToCursor, this);
	}
	
	this.mouseEnabled = true;
}


Menu.prototype.goNext = function(control, factor){
	if (typeof(factor) === "undefined"){
		factor = 1;
	}
	
	var oldIndex = this.indexCurrentOption;

	this.indexCurrentOption += factor;

	if (this.indexCurrentOption >= this.allOptions.length){
		if (this.toric){
			this.indexCurrentOption -= this.allOptions.length;
		}
		else{
			this.indexCurrentOption = this.allOptions.length - 1;
		}
	}

	if (oldIndex != this.indexCurrentOption){
		BasicGame.sfx.cursorSelect.play("", 0, BasicGame.volume.sfx);

		var oldOption = this.allOptions[oldIndex];
		var option = this.getCurrentOption();

		oldOption.onOut.dispatch(option);
		option.onOver.dispatch(option);

		this.updateCursorPosition();

		this.updateCursorTween();
	}
}


Menu.prototype.goPrevious = function(control, factor){
	if (typeof(factor) === "undefined"){
		factor = 1;
	}

	var oldIndex = this.indexCurrentOption;
  
	this.indexCurrentOption -= factor;

	if (this.indexCurrentOption < 0){
		if (this.toric){
			this.indexCurrentOption += this.allOptions.length;
		}
		else{
			this.indexCurrentOption = 0;
		}
	}

	if (oldIndex != this.indexCurrentOption){
		BasicGame.sfx.cursorSelect.play("", 0, BasicGame.volume.sfx);

		var oldOption = this.allOptions[oldIndex];
		var option = this.getCurrentOption();

		oldOption.onOut.dispatch(option);
		option.onOver.dispatch(option);

		this.updateCursorPosition();

		this.updateCursorTween();
	}
}

Menu.prototype.setFocus = function(focus){
	if (!booleanable(focus)){
		focus = true;
	}

	if (focus != this.hasFocus){
		if (!focus){
			this.stopCursorTween();
			
			for(var i = 0; i < this.allOptions.length; i++) {
				this.allOptions[i].display.input.enabled = false;
			}
		}
		else{
			this.updateCursorTween();

			if (this.mouseEnabled){
				for(var i = 0; i < this.allOptions.length; i++) {
					this.allOptions[i].display.input.enabled = true;
				}
			}
		}

		this.hasFocus = focus;
	}
}

Menu.prototype.updateCursorPosition = function(){
	var currentOption = this.getCurrentOption();

	if (currentOption != null){
		this.cursor.x = (currentOption.display.x -
						 currentOption.display.width * currentOption.display.anchor.x) +
			this.offsetCursorX;
		this.cursor.y = (currentOption.display.y +
						 currentOption.display.height *
						 (0.5 - currentOption.display.anchor.y)) + this.offsetCursorY;
	}
}

Menu.prototype.getCurrentOption = function(){
	if (!validIndex(this.indexCurrentOption, this.allOptions)){
		return null;
	}
	else{
		return this.allOptions[this.indexCurrentOption];
	}
}

Menu.prototype.update = function(){
	var currentOption = this.getCurrentOption();

	if (currentOption != null){
		if (typeof(currentOption.whileHoverFunction) === "function"){
			currentOption.whileOver.apply(currentOption);
		}
	}

	if ((!this.hasFocus) &&
		(this.cursorTween != null)){
		this.stopCursorTween();
	}


	Interface.prototype.update.call(this);
}

Menu.prototype.toggle = function(){
	if (this.state == Interface.State.CLOSED){
		this.indexCurrentOption = 0;
		this.title.visible = this.showTitle;
		
		var option = this.getCurrentOption();
		
		if (option != null){
			option.onOver.dispatch(option);
		}
		
		this.updateCursorPosition();
		
		this.updateCursorTween();
		
		Interface.prototype.toggle.call(this);
	}
}

Menu.prototype.close = function(){
	if (this.state == Interface.State.TOGGLED){
		var option = this.getCurrentOption();
		
		if (option != null){
			option.onOut.dispatch(option);
		}
		
		this.stopCursorTween();
		
		Interface.prototype.close.call(this);
	}	
}

Menu.prototype.select = function(){
	if (this.state == Interface.State.TOGGLED){
		var option = this.getCurrentOption();
		
		if (option != null){
			BasicGame.sfx.cursorSelect.play("", 0, BasicGame.volume.sfx);

			option.onSelect.dispatch(option);
		}
		
	}
}

Menu.prototype.updateCursorTween = function(){
	this.stopCursorTween();

	this.cursorTween = this.game.add.tween(this.cursor)
		.to({x: this.cursor.x + this.offsetCursorX}, 500,
			Phaser.Easing.Quadratic.InOut);

	this.cursorTween.yoyo(true);
	this.cursorTween.repeat();
	
	this.cursorTween.start();
}

Menu.prototype.stopCursorTween = function(){
	if (this.cursorTween != null){
		this.cursorTween.stop();
		this.updateCursorPosition();

		this.cursorTween = null;
	}
}

Menu.prototype.kill = function(){
	this._del();

	Interface.prototype.kill.call(this);
}

Menu.prototype.destroy = function(){
	this._del();

	Interface.prototype.destroy.call(this);
}

Menu.prototype._del = function(){
	if (this.cursorTween != null){
		this.cursorTween.stop();
		this.cursorTween = null;
	}
}
/******************************************************************************/
/* Menu */
/********/

/**********/
/* Option */
/******************************************************************************/
var Option = function(display){	
	this.display = display;

	this.onOver = new Phaser.Signal();
	this.onOut = new Phaser.Signal();
	this.onSelect = new Phaser.Signal();
	this.whileOver = new Phaser.Signal();
}

Option.prototype.enableMouse = function(){
	this.display.inputEnabled = true;

	this.display.events.onInputDown.add(function(){
		BasicGame.sfx.cursorSelect.play("", 0, BasicGame.volume.sfx);

		this.onSelect.dispatch(this);
	}, this);
}

Option.prototype.kill = function(){
	this._del();
	
	if (this.display != null){
		if (this.display instanceof Phaser.Text){
			this.display.destroy();
		}
		else{
			this.display.kill();
		}
	}
}

Option.prototype.destroy = function(){
	this._del();

	if (this.display != null){
		this.display.destroy();
	}
}

Option.prototype._del = function(){
	this.onOver.dispose();
	this.onOver = null;

	this.onOut.dispose();
	this.onOut = null;

	this.onSelect.dispose();
	this.onSelect = null;

	this.whileOver.dispose();
	this.whileOver = null;
}
/******************************************************************************/
/* Option */
/**********/

