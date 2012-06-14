onLoad = function(){
	$.ajax({
		type: "GET",
		url: "IntroDialogue.xml",
		dataType: "xml",
		success: parseXML
	});
};


parseXML = function(xml){
	var count = 0;
	/*
	 * Object literals for storing dialogue statements
	 * These are just for setting up structures 
	 */
	var overseerContainer = {};
	var playerContainer = {};
	$(xml).find("overseer").each(function(){
		var id = $(this).attr('id');
		var nextItem = $(this).attr('nextItem');
		var nextVariable = null;
		if (nextItem === 'exit'){
			nextVariable = $(this).attr('nextScreen');
		} else {
			nextVariable = $(this).attr('nextId');
		}
		var overseer = null;
		if($(this).attr('highlight')){
			overseer = new OverseerStatement(nextItem, nextVariable, id, $(this).attr('highlight'));
		} else {
			overseer = new OverseerStatement(nextItem, nextVariable, id);
		}
		
		//add overseers to overseerContainer sorted by id for easy lookup later
		overseerContainer[overseer.id] = overseer;
		
		$(this).find('text').each(function(){
			overseer.addText($(this).text());
		});
		
	});
	
	$(xml).find('player').each(function(){
		var player = new PlayerOptions($(this).attr('id'));
		
		//now find the different options and add them to player
		$(this).find('option').each(function(){
			var nextItem = $(this).attr('nextItem');
			var nextVariable = null;
			if (nextItem === 'exit'){
				nextVariable = $(this).attr('nextScreen');
			} else {
				nextVariable = $(this).attr('nextId');
			}
			var set_check = {};
			if ($(this).attr('set')){
				set_check.set = $(this).attr('set');
			}
			if ($(this).attr('check')){
				set_check.check = $(this).attr('check');
			}
			
			var statement = new PlayerStatement(nextItem, nextVariable, set_check);
			
			$(this).find('text').each(function(){
				statement.addText($(this).text());
			});
			
			player.addStatement(statement);
		});
		playerContainer[player.id] = player;
	});
	
	/*
	 * Make all the different statements before we string them together
	 * This means that we can efficiently go back and look stuff up all in one
	 * swoop rather than needing to wait for stuff to be made so that different
	 * objects are attached at different times.
	 */
	
	
	for (x in overseerContainer){
		console.log(overseerContainer[x].printText());
	}
	
	for (x in playerContainer){
		for (y in playerContainer[x].statementArray){
			console.log(y + " " + playerContainer[x].statementArray[y].printText());
		}
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
 * 	highlight: (optional) id of sprite to highlight on the screentr
 */

//An obvious change would be to have each object handle its own XML parsing
//just pass it a semiparsed piece of XML as the argument and then have it sort
//out the rest during initialization
var Statement = klass(function(nextItem, nextVariable){
	this.nextItem = nextItem;
	if(this.nextItem === 'exit'){
		this.exit = true;
		this.nextScreen = nextVariable;
	} else {
		this.exit = false;
		this.nextId = nextVariable;
	}
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

var OverseerStatement = Statement.extend(function(nextItem, nextVariable, id, highlight){
	this.id = id;
	this.highlight = highlight; //this arugment is optional
});

var PlayerOptions = klass(function(id){
	this.id = id;
	this.statementArray = [];
})
	.methods({
		addStatement: function(statement){
			this.statementArray.push(statement);
		}
	});

/*
 * A player statement can have both a set and a check value, this just needs
 * to be reflected in the input object
 */
var PlayerStatement = Statement.extend(function(nextItem, nextVariable, set_check){
	this.set_check = set_check; //optional, object containing id and whether or not this statement uses set or check
	
})
	.methods({
		//perform relevant actions for if the player if they chose this decision
		wasClicked: function(){
			
		}
	});

var PopupStatement = Statement.extend(function(nextItem, nextVariable, id, target){
	this.id = id;
})
	.methods({
		
	});
