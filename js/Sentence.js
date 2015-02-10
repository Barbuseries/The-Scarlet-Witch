var Sentence = function(text,speaker,mood,font,fontsize,fill){
    if (typeof(text) === "undefined") text = 0;
    if (typeof(speaker) === "undefined") speaker = 0;
    if (typeof(mood) != "normal" || typeof(mood) != "sad" || typeof(mood) != "raging" || typeof(mood) != "joyfull" || typeof(mood) != "feared" || typeof(mood) != "dying") mood = 0;
    if (typeof(font) === "undefined") font = 0;
    if (typeof(fontsize) === "undefined") fontsize = null;
    if (typeof(fill) === "undefined") fill = false;

    this.text = x;
    this.speaker = y;
    this.mood = width;
    this.font = height;
    this.fontsize = sprite;
    this.fill = egoist
};


//Remplace le texte actuel par newText
Sentence.prototype.setText = function(newText){
     if (typeof(text) != "undefined"){
        this.text = newText;
     } 
}

//Remplace l'humeur actuelle par newMood
Sentence.prototype.setMood = function(newMood){
    if (typeof(newMood) != "undefined"){
        this.mood = newMood;
    }
}

Sentence.prototype.addOnStartSaying = function(){
    
}