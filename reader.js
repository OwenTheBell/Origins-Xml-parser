onLoad = function(){
	$.ajax({
		type: "GET",
		url: "IntroDialogue.xml",
		dataType: "xml",
		success: parseXML
	});
};


function parseXML(xml){
	var count = 0;
	var overseerArray = [];
	$(xml).find("overseer").each(function(){
		var id = $(this).attr('id');
		var nextItem = $(this).attr('nextItem');
		if (nextItem === 'exit'){
			var nextVariable = $(this).attr('nextScreen');
		} else {
			var nextVariable = $(this).attr('nextId');
		}
		var overseer = null;
		if($(this).attr('highlight')){
			overseer = new OverseerStatement(id, nextItem, nextVariable, $(this).attr('highlight'));
		} else {
			overseer = new OverseerStatement(id, nextItem, nextVariable);
		}
		
		inputArray.push(overseer);
		
		$(this).find('text').each(function(){
			overseer.addText($(this).text());
		})
		
	});
	
	$(xml).find('player').each(function(){
		
	});
	
	for (x in overseerArray){
		console.log(overseerArray[x].printText());
	}
}

/*
 * object to store the Overseer parts of a conversation
 * arguments:
 * 	id: identifier for the object
 * 	nextItem: type of the next conversation element to follow
 * 		overseer/player/popup/exit
 * 	nextVariable: can either be the id of the next element if nextItem is overseer/player/popup
 * 		or the id for the screen that should appear after conversation over
 * 	highlight: (optional) id of sprite to highlight on the screen
 */

//An obvious change would be to have each object handle its own XML parsing
//just pass it a semiparsed piece of XML as the argument and then have it sort
//out the rest during initialization
var OverseerStatement = klass(function(id, nextItem, nextVariable, highlight){
	this.id = id;
	this.nextItem = nextItem;
	if(this.nextItem === 'exit'){
		this.exit = true;
		this.nextScreen = nextVariable;
	} else {
		this.exit = false;
		this.nextId = nextVariable;
	}
	this.highlight = highlight; //this argument is optional
	this.texts = [];
})
	.methods({
		setNextPart: function(nextPart){
			this.nextConversation = nextPart;
		},
		addText: function(text){
			this.texts.push(text);
		},
		printText: function(){
			return this.texts.join("");
		}
	});

var PlayerStatement = klass(function(){
	
})
	.methods({
		
	});
