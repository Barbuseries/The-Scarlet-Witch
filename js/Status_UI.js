/*************/
/* Status_UI */
/******************************************************************************/
var Status_UI = function(game, hero, x, y, isBarton){
	if (!booleanable(isBarton)){
		isBarton = false;
	}

	Phaser.Group.call(this, game);

	this.game = game;
	this.hero = hero;

	this.x = x;
	this.y = y;

	this.profilSprite = this.game.add.sprite(0, 0, hero.key);
	this.profilSprite.frame = 26;
	this.profilSprite.width = 45;
	this.profilSprite.height = 45;
	this.profilSprite.anchor.setTo(0.5, 0);
	this.add(this.profilSprite);

	this.healthBar = new MonoGauge(game, 50, 0, 100, 10, hero.allStats.health,
								   H_RED, H_WHITE, "", "ground2");
	this.add(this.healthBar);

	if (!isBarton){
		this.specialBar = new MonoGauge(game, 50, 0 + 20, 100, 10,
										hero.allStats.special,
										H_BLUE, H_WHITE, "", "ground2");
		this.add(this.specialBar);
	}
	else{
		this._specialBar1 = new MonoGauge(game, 50, 0 + 20, 100, 10,
										  hero.allStats.fury,
										  H_YELLOW, H_WHITE, "", "ground2");
		this._specialBar2 = new MonoGauge(game, 50, 0 + 20, 100, 10,
										  hero.allStats.quiver,
										  H_ORANGE, H_WHITE, "", "ground2");
		this._specialBar1.valueDisplayType = GAUGE_BRUT;
		this._specialBar2.valueDisplayType = GAUGE_BRUT;

		this._specialBar1.updateValueText();
		this._specialBar2.updateValueText();
		
		this._specialBar2.upperSprite.alpha = 0.2;
		this._specialBar2.backgroundFill.alpha = 0;
		
		this._specialBar2.allowIncreaseAnimation = false;
		this._specialBar2.allowDecreaseAnimation = false;

		this.add(this._specialBar1);
		this.add(this._specialBar2);

		this._specialBar2.visible = false;

		this.specialBar = this._specialBar1;
	}

	this.healthBar.upperSprite.alpha = 0.2;
	this.healthBar.backgroundFill.alpha = 0;
	this.healthBar.valueDisplayType = GAUGE_BRUT;

	this.healthBar.increaseSpeed = 0.5;
	this.healthBar.increaseAlpha = 0.4;

	this.healthBar.decreaseSpeed = 0.5;
	this.healthBar.decreaseAlpha = 0.4;

	this.specialBar.upperSprite.alpha = 0.2;
	this.specialBar.backgroundFill.alpha = 0;
	this.specialBar.valueDisplayType = GAUGE_BRUT;
	
	this.specialBar.allowIncreaseAnimation = false;
	this.specialBar.allowDecreaseAnimation = false;

	this.level = game.add.text(0, 0 + 50, hero.allStats.level.get());
	this.add(this.level);
	this.level.fontSize = 24;
	this.level.font = "Arial";
	this.level.weight = "bold";
	this.level.fill = "#ffffff";
	this.level.stroke = "#000000";
	this.level.strokeThickness = 6;
	this.level.setShadow(0, 2, BLACK, 5);

	this.level.anchor.setTo(0.5, 0);

	this.experienceBar = new MonoGauge(game, this.level.x - 12, this.level.y - 2,
									   24, 2, hero.allStats.experience,
									   H_YELLOW, H_BLACK, "", "");
	this.experienceBar.allowIncreaseAnimation = false;
	this.experienceBar.allowDecreaseAnimation = false;

	this.add(this.experienceBar);

	this.allStatusSkills = [];
	this.allStatusSkills[0] = {};
	this.allStatusSkills[1] = {};

	function Status_UI_updateLevel(stat, oldValue, newValue){
		this.level.text = newValue.toString();
	}

	hero.allStats.level.onUpdate.add(Status_UI_updateLevel, this);

	this.showStatusSkills();

	this.fixedToCamera = true;

	hero.onSwapMode.add(this.showStatusSkills, this);
}

Status_UI.prototype = Object.create(Phaser.Group.prototype);
Status_UI.prototype.constructor = Status_UI;

Status_UI.prototype.updateStatusSkills = function(){
	for(var j = 0; j < this.hero.allSkills.length; j++) {
		var i = 0;

		for(var skill in this.hero.allSkills[j]){
			if (typeof(this.allStatusSkills[j][skill]) === "undefined"){
				this.allStatusSkills[j][skill] = new StatusSkill(
					this.hero.allSkills[j][skill], 500 + i * 70, 0);
				i++;
				this.allStatusSkills[j][skill].visible = false;
				
				this.add(this.allStatusSkills[j][skill]);
			}
		}
	}
}

Status_UI.prototype.showStatusSkills = function(visible){
	if (!booleanable(visible)){
		visible = true;
	}

	for(var i in this.allStatusSkills[this.hero.currentMode]) {
		this.allStatusSkills[this.hero.currentMode][i].visible = visible;
	}

	for(var i in this.allStatusSkills[1 * !this.hero.currentMode]){
		this.allStatusSkills[1 * !this.hero.currentMode][i].visible = false;
	}
}

Status_UI.prototype.update = function(){
	Phaser.Group.prototype.update.call(this);

	for(var i in this.allStatusSkills[this.hero.currentMode]){
		var skill = this.hero.allSkills[this.hero.currentMode][i];
		
		if (!skill.costFunction(0)){
			this.allStatusSkills[this.hero.currentMode][i].iconSprite.tint = H_GREY;
			this.allStatusSkills[this.hero.currentMode][i].iconSprite.alpha = 0.2;
		}
		else{
			this.allStatusSkills[this.hero.currentMode][i].iconSprite.tint = H_WHITE;
			this.allStatusSkills[this.hero.currentMode][i].iconSprite.alpha = 0.9;
		}
	}
}
/******************************************************************************/
/* Status_UI */
/*************/
var StatusSkill = function(skill, x, y){
	Phaser.Group.call(this, skill.game);
	
	this.x = x;
	this.y = y;
	this.alpha = 0.9;

	this.backgroundSprite = this.game.add.sprite(32, 32, "template_icon");
	this.backgroundSprite.anchor.setTo(0.5);

	this.iconSprite = this.game.add.sprite(32, 32, skill.icon);
	this.iconSprite.anchor.setTo(0.5);

	skill.createChargeBar(0, 64 + 5,
						  64, 5, H_RED, H_BLACK);

	skill.chargeBar.allowIncreaseAnimation = false;
	skill.chargeBar.allowDecreaseAnimation = false;

	skill.chargeBar.visible = false;

	skill.cooldown.onUpdate.add(function(stat, oldValue, newValue){
		this.iconSprite.scale.y = 1 - stat.get(1);
		this.iconSprite.scale.x = this.iconSprite.scale.y;
	}, this);

	this.add(this.backgroundSprite);
	this.add(this.iconSprite);
	this.add(skill.chargeBar);
}

StatusSkill.prototype = Object.create(Phaser.Group.prototype);
StatusSkill.prototype.constructor = StatusSkill;
