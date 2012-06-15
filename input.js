var inputState = {
	keypressed: false,
	keyvalue: -1,
	
	getKeyValue: function(){
		this.keypressed = false;
		return this.keyvalue;
	}
}

$(document).keypress(function(e){
	if (!inputState.keypressed){
		inputState.keyvalue = e.which;
		inputState.keypressed = true;
	}
})
