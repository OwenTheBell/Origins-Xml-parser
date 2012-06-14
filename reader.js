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
	 * 	id: the id to identify what the statement is in case of error
	 * 		this is needed as playerStatements do not have ids so a string needs
	 * 		to be passed to be used instead
	 */
	function linkNext(statement, id){
		if (statement.nextType === 'overseer'){
			statement.setNext(overseerContainer[statement.nextVariable]);
		} else if (statement.nextType === 'player'){
			statement.setNext(playerContainer[statement.nextVariable]);
		} else if (statement.nextType === 'popup'){
			statement.setNext(popupContainer[statement.nextVariable]);
		} else if (statement.nextType === 'exit'){
			statement.setNext('exit'); //this is VERY temporary
		} else {
			console.log("ERROR: " + id + " has an invalid nextType of " + statement.nextType);
		}
	};
	
	console.log(overseerContainer[firstStatementId].printText());
	
	/*
	for (x in overseerContainer){
		console.log(overseerContainer[x].printText());
	}
	
	for (x in playerContainer){
		for (y in playerContainer[x].statementArray){
			console.log(y + " " + playerContainer[x].statementArray[y].printText());
		}
	}
	
	for (x in popupContainer){
		console.log(popupContainer[x].printText());
	}
	*/
}

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
})
	.methods({
		setNext: function(nextStatement){
			this.nextStatement = nextStatement;
		},
		addText: function(text){
			this.texts.push(text);
		},
		printText: function(){
			return this.texts.join("");
		},
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
			this.statementArray.push(statement);
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
