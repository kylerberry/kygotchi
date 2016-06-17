var StateMachine = (function() {
	var stack = [];

	this.update = function() {
        var currentStateFunction = this.getCurrentState();

        if (currentStateFunction != null) {
            this[currentStateFunction]();
        }

        console.log(stack);
    };

    this.popState = function() {
    	return stack.pop();
    };

    this.pushState = function(state) {
        if (this.getCurrentState() != state) {
            stack.push(state);
        }
    };

    this.getCurrentState = function() {
        return stack.length > 0 ? stack[stack.length - 1] : null;
    };

    return this;
}).call(null);