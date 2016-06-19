var StateMachine = (function() {
	var stack = [],
        StateMachine = {event: {}};

    //adds the event methods to the stateMachine
    StateMachine.create = function(events) {
        events.forEach(function(event) {
            var key = Object.keys(event)[0];
            StateMachine.event[Object.keys(event)[0]] = event[key];
        });
    };

	StateMachine.update = function() {
        var currentStateFunction = StateMachine.getCurrentState();

        console.log(stack);

        if (currentStateFunction != null) {
            StateMachine.event[currentStateFunction]();
        }
    };

    StateMachine.popState = function() {
    	return stack.pop();
    };

    StateMachine.pushState = function(state) {
        if (StateMachine.getCurrentState() != state) {
            stack.push(state);
        }
    };

    StateMachine.getCurrentState = function() {
        return stack.length > 0 ? stack[stack.length - 1] : null;
    };

    return StateMachine;
}());