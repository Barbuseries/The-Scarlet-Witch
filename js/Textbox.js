var Textbox = function(x, y, width, height, sprite, egoist){
    if (typeof(x) == "undefined") x = 0;
    if (typeof(y) === "undefined") y = 0;
    if (typeof(width) === "undefined") width = 0;
    if (typeof(height) === "undefined") height = 0;
    if (typeof(sprite) === "undefined") sprite = null;
    if (typeof(egoist) === "undefined") egoist = false;

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.sprite = game.add.sprite(game, x, y, sprite, 0);
    this.egoist = egoist;
    this.text = [];
    this.isActive = false;
    this.delay = 0;
};
//Ouvre la textbox en time ms  avec une opacité alpha entre 0 et 1

Textbox.prototype.update = function(time){
    if(this.isActive == false){
        return;
    }else{
        if(this.delay < time){
            this.delay += 1000.0/60.0;
            this.sprite.alpha=this.delay/time;
        }
    }
}

Textbox.prototype.toggle = function(time, alpha){
    if(this.egoist == true) game.pause = true;
    this.sprite.visible = true;
    update(time);
    this.isActive = true;
    
    
}
//ferme la textbox en time ms
Textbox.prototype.close = function(time){
    if(this.sprite.visible == false){
       return;    
    }
    if(this.egoist == true){
        game.pause = false;
    }
    this.isActive == false;    
}
//Enlève le texte de la textbox
Textbox.prototype.clear = function(){

}
//charge un texte d'un fichier .txt .t .json .ONVERRALASUITETROLOLOLOL
Textbox.prototype.loadTextFromFile= function(file){

}
// Passe a la phrase suivante en effaçant la phrase d'avant
Textbox.prototype.nextSentence = function(function){

}

Textbox.prototype.addOnStartToogle = function(function){

}

Textbox.prototype.addOnToogle = function(function){

}

Textbox.prototype.addOnStartClose = function(function){

}

Textbox.prototype.onStartToggle = function(){

}

Textbox.prototype.onToggle = function(){

}

Textbox.prototype.onStartClose = function(){

}

Textbox.prototype.onClose = function(){

}