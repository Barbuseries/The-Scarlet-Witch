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

		this.add(this._specialBar1);
		this.add(this._specialBar2);

		this._specialBar1.visible = false;

		this.specialBar = this._specialBar2;
	}

	this.healthBar.upperSprite.alpha = 0.2;
	this.healthBar.backgroundFill.alpha = 0;

	this.healthBar.increaseSpeed = 0.5;
	this.healthBar.increaseAlpha = 0.4;

	this.healthBar.decreaseSpeed = 0.5;
	this.healthBar.decreaseAlpha = 0.4;

	this.specialBar.upperSprite.alpha = 0.2;
	this.specialBar.backgroundFill.alpha = 0;
	
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

	this.level.anchor.setTo(0.5, 0);

	this.experienceBar = new MonoGauge(game, this.level.x - 12, this.level.y - 2,
									   24, 2, hero.allStats.experience,
									   H_YELLOW, H_BLACK, "", "");
	this.experienceBar.allowIncreaseAnimation = false;
	this.experienceBar.allowDecreaseAnimation = false;

	this.add(this.experienceBar);

	this.allStatusSkills = {};

	function Status_UI_updateLevel(stat, oldValue, newValue){
		this.level.text = newValue.toString();
	}

	hero.allStats.level.onUpdate.add(Status_UI_updateLevel, this);

	this.showStatusSkills();

	this.fixedToCamera = true;
}

Status_UI.prototype = Object.create(Phaser.Group.prototype);
Status_UI.prototype.constructor = Status_UI;

Status_UI.prototype.showStatusSkills = function(visible){
	if (!booleanable(visible)){
		visible = true;
	}

	var i = 0;

	for(var skill in this.hero.allSkills[this.hero.currentMode]){
		this.allStatusSkills[skill] = new StatusSkill(this.hero.allSkills[this.hero.currentMode][skill],
													  500 + i * 70, 0);
		i++;
		
		this.add(this.allStatusSkills[skill]);
	}

	for(var i in this.allStatusSkills) {
		this.allStatusSkills[i].visible = visible;
	}
}
/******************************************************************************/
/* Status_UI */
/*************/
var StatusSkill = function(skill, x, y){
	Phaser.Group.call(this, skill.game);
	
	this.x = x;
	this.y = y;

	this.iconSprite = this.game.add.sprite(32, 32, skill.icon);
	this.iconSprite.anchor.setTo(0.5);

	skill.createCooldownBar(0, 64 + 5,
							64, 5, H_YELLOW);

	skill.cooldownBar.onUpdate.add(function(){
		this.iconSprite.scale.y = 1 - skill.cooldownBar.stat.get(1);
		this.iconSprite.scale.x = this.iconSprite.scale.y;
		skill.cooldownBar.visible = false;
	}, this);

	this.add(this.iconSprite);
	this.add(skill.cooldownBar);
}

StatusSkill.prototype = Object.create(Phaser.Group.prototype);
StatusSkill.prototype.constructor = StatusSkill;
