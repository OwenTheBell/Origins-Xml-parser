onLoad = function(){
	$.ajax({
		type: "GET",
		url: "IntroDialogue.xml",
		dataType: "xml",
		success: parseXML
	});
};

var active;

parseXML = function(xml){
	var count = 0;
	/*
	 * Object literals for storing dialogue statements
	 * These are just for setting up structures 
	 */
	var overseerContainer = {};
	var playerContainer = {};
	var popupContainer = {};
	
	var firstStatementId = null;
	
	$(xml).find("overseer").each(function(){
		var id = $(this).attr('id');
		if (!firstStatementId){
			firstStatementId = id;
		}
		var nextType = $(this).attr('nextType');
		var nextVariable = null;
		if (nextType === 'exit'){
			nextVariable = $(this).attr('nextScreen');
		} else {
			nextVariable = $(this).attr('nextId');
		}
		var overseer = null;
		if($(this).attr('highlight')){
			overseer = new OverseerStatement(nextType, nextVariable, id, $(this).attr('highlight'));
		} else {
			overseer = new OverseerStatement(nextType, nextVariable, id);
		}
		
		$(this).find('text').each(function(){
			overseer.addText($(this).text());
		});
		
		//add overseers to overseerContainer sorted by id for easy lookup later
		overseerContainer[overseer.id] = overseer;
		
	});
	
	$(xml).find('player').each(function(){
		var player = new PlayerOptions($(this).attr('id'));
		
		//now find the different options and add them to player
		$(this).find('option').each(function(){
			var nextType = $(this).attr('nextType');
			var nextVariable = null;
			if (nextType === 'exit'){
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
			
			var statement = new PlayerStatement(nextType, nextVariable, set_check);
			
			$(this).find('text').each(function(){
				statement.addText($(this).text());
			});
			
			player.addStatement(statement);
		});
		
		playerContainer[player.id] = player;
	});
	
	$(xml).find('popup').each(function(){
		
		var id = $(this).attr('id');
		var nextType = $(this).attr('nextType');
		var nextVariable = null;
		if (nextType === 'exit'){
			nextVariable = $(this).attr('nextScreen');
		} else {
			nextVariable = $(this).attr('nextId');
		}
		var target = $(this).attr('target');
		var statement = new PopupStatement(nextType, nextVariable, id, target);
		
		$(this).find('text').each(function(){
			statement.addText($(this).text());
		});
		
		popupContainer[statement.id] = statement;
	});
	
	/*
	 * Now that all the statements have been parsed from the XML they need to 
	 * be attached together using the linkNext function
	 */
	
	for (x in overseerContainer){
		var overseer = overseerContainer[x];
		linkNext(overseer, overseer.id);
	}
	
	for (x in playerContainer){
		var player = playerContainer[x];
		for (y in player.statementArray){
			linkNext(player.statementArray[y], player.id + "statement " + y);
		}
	}
	
	for (x in popupContainer){
		var popup = popupContainer[x];
		linkNext(popup, popup.id);
	}
	/*
	 * Function for setting a statement's nextStatement
	 * ARGS:
	 * 	statement: the statement itself
	 * 	id: identify what the statement is in case of error. This is needed 
	 * 		as playerStatements do not have ids so a string needs to be passed
	 * 		to be used instead
	 * 
	 * All the if statements are for debuging as they help locate the tags in
	 * the XML that have mislabeled attributes
	 */
	function linkNext(statement, id){
		if (statement.nextType === 'overseer'){
			var tester = overseerContainer[statement.nextId];
			if (!tester){
				console.log('ERROR: ' + statement.nextId + ' is not a valid overseer id ' + id);
			} else {
				statement.setNext(tester);
			}
		} else if (statement.nextType === 'player'){
			var tester = playerContainer[statement.nextId];
			if (!tester){
				console.log('ERROR: ' + statement.nextId + ' is not a valid player id ' + id);
			} else {
				statement.setNext(tester);
			}
		} else if (statement.nextType === 'popup'){
			var tester = popupContainer[statement.nextId];
			if (!tester){
				console.log('ERROR: ' + statement.nextId + ' is not a valid popup id ' + id);
			} else {
				statement.setNext(tester);
			}
		} else if (statement.nextType === 'exit'){
			statement.setNext('exit'); //this is VERY temporary
		} else {
			console.log("ERROR: " + id + " has an invalid nextType of " + statement.nextType);
		}
	};
	
	active = overseerContainer[firstStatementId];
	startDialogue();
	
	/*
	function runDialogue(){
		active.display();
		if (active instanceof OverseerStatement){
			if (active.nextType === 'player'){
				active = active.nextStatement;
				runDialogue();
			} else if (active.nextType === 'popup') {
				console.log('next statement is a popup');
			} else if (active.nextType === 'exit'){
				console.log('THE END');
			}
		}
		$(document).keypress(function(e){
			if (active instanceof OverseerStatement){
				if (active.nextType === 'overseer'){
					if(e.which == 13) {
						active = active.nextStatement;
					}
				} else if (active.nextType === 'player'){
					active = active.nextStatement;
					runDialogue();
				} else if (active.nextType === 'popup'){
					console.log('next statement is a poup');
				} else if (active.nextType === 'exit'){
					console.log('THE END');
				}
			} else if (active instanceof PlayerOptions){
				if (((e.which - 49) < active.statementArray.length) && ((e.which - 49) >= 0)){
					active = active.statementArray[e.which - 49].nextStatement;
				}
			}
		});
	};
	*/
}

var displayed = false;
var keepGoing = true;

startDialogue = function(){
	var dialogueInterval = setInterval(runDialogue, 1000/60);
	if (!dialogueInterval) clearInterval(dialogueInterval);
}

runDialogue = function(){
	if (!displayed){
		active.draw();
		displayed = true;
	}
	var keyValue = -1;
	if(inputState.keypressed){
		keyValue = inputState.getKeyValue();
	}
	active.update(keyValue);
	if (!keepGoing){
		return "false";
	}
}




/*
 * Statment objects start here
 */



/*
 * General parent object that all statements inherit from
 * ARGS:
 * 	nextType: the type of the next statements (overseer/player/popup/arachne/exit)
 * 	nextVariable: info on where to go. The data type changes based on the value of nextType
 * 			overseer: id of an overseerStatement
 * 			player: id of a playerOptions
 * 			popup: id of a popupStatement
 * 			arachne: id of an arachneStatement
 * 			exit: id of a Screen that the chat will exit to
 */

//An obvious change would be to have each object handle its own XML parsing.
//Just pass it a semiparsed piece of XML as the argument and then have it sort
//out the rest during initialization
var Statement = klass(function(nextType, nextVariable){
	this.nextType = nextType;
	if(this.nextType === 'exit'){
		this.exit = true;
		this.nextScreen = nextVariable;
	} else {
		this.exit = false;
		this.nextId = nextVariable;
	}
	this.texts = [];
	this.nextStatement = null;
})
	.methods({
		setNext: function(nextStatement){
			this.nextStatement = nextStatement;
			if(nextStatement != 'exit'){
				//console.log(this.nextStatement.id + " attached to " + this.id);
			};
		},
		addText: function(text){
			this.texts.push(text);
		},
		printText: function(){
			return this.texts.join("");
		},
		update: function(keyValue){
			if (this.nextType === 'overseer'){
				if (keyValue == 13){
					active = this.nextStatement;
					displayed = false;
				}
			} else if (this.nextType === 'player'){
				active = this.nextStatement;
				displayed = false;
			} else if (this.nextType === 'popup'){
				console.log("Next statement is a popup");
				keepGoing = false;
			} else if (this.nextType === 'exit'){
				console.log("THE END!!!!");
				keepGoing = false;
			} else {
				console.log("ERROR: " + this.id + " has an invalid nextType");
				keepGoing = false;
			}
		},
		draw: function(){
			console.log(this.texts.join(""));
		}
	});

var OverseerStatement = Statement.extend(function(nextType, nextVariable, id, highlight){
	this.id = id;
	this.highlight = highlight; //this arugment is optional
});

/*
 * Not a statement but still important. Since all player statements
 * are choice driven we need a class that contains each set of player
 * statements that are available as a reply to anything said to the player.
 * Nonplayer statements will point to a playerOptions that contains
 * reply statements
 */
var PlayerOptions = klass(function(id){
	this.id = id;
	this.statementArray = [];
})
	.methods({
		addStatement: function(statement){
			statement.setId(this.id + "Statement");
			this.statementArray.push(statement);
		},
		update: function(keyValue){
			if (((keyValue - 49) < this.statementArray.length) && ((keyValue - 49) >= 0)){
				var next = this.statementArray[keyValue - 49];
				if (next.nextType === 'exit'){
					console.log('THE END!!!!');
					keepGoing = false;
				} else if (next.nextType === 'popup'){
					console.log("next up is a popup");
					keepGoing = false;
				} else {
					active = this.statementArray[keyValue - 49].nextStatement;
					displayed = false;
				}
			}
		},
		draw: function(){
			for(x in this.statementArray){
				console.log((parseInt(x)+1) + " " + this.statementArray[x].printText());
			}
		}
	});

/*
 * A player statement can have both a set and a check value, this just needs
 * to be reflected in the input object
 */
var PlayerStatement = Statement.extend(function(nextType, nextVariable, set_check){
	this.set_check = set_check; //optional, object containing id and whether or not this statement uses set or check
})
	.methods({
		setId: function(id){
			this.id = id;
		},
		//perform relevant actions for if the player if they chose this decision
		wasClicked: function(){
		}
	});

var PopupStatement = Statement.extend(function(nextType, nextVariable, id, target){
	this.id = id;
	this.target = target;
})
	.methods({
		
	});
