var StateMachine = (function() {
	var stack = [],
        StateMachine = {event: {}},
        onUpdateCallback = null,
        onStateChangeCallback = null;

    //adds the event methods to the stateMachine and applies other options
    StateMachine.create = function(options) {
        var events = options.events;

        events.forEach(function(event) {
            var key = Object.keys(event)[0];
            StateMachine.event[Object.keys(event)[0]] = event[key];
        });

        if(typeof options.onUpdate == 'function') {
            onUpdateCallback = options.onUpdate;
        }
        if(typeof options.onStateChange == 'function') {
            onStateChangeCallback = options.onStateChange;
        }
    };

    //happens in a loop. updates the state based on event
	StateMachine.update = function() {
        var currentStateFunction = StateMachine.getCurrentState();

        if (currentStateFunction != null) {
            StateMachine.event[currentStateFunction]();
        }

        if(typeof onUpdateCallback == 'function') {
            onUpdateCallback();
        }
    };

    //pops state off the top of the stack
    StateMachine.popState = function() {
    	return stack.pop();
    };

    //adds state to top of stack
    StateMachine.pushState = function(state) {
        if (StateMachine.getCurrentState() != state) {
            stack.push(state);
            if(typeof onStateChangeCallback == 'function') {
                onStateChangeCallback(state);
            }
        }
    };

    //returns the state at the pop of the stack
    StateMachine.getCurrentState = function() {
        return stack.length > 0 ? stack[stack.length - 1] : null;
    };

    return StateMachine;
}());