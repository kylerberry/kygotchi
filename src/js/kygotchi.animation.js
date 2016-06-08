// @todo implement a finite state machine
// http://gameprogrammingpatterns.com/state.html

var Animate = (function() {

  var selector = '',
    blinkTimer = null;

  this.init = function(slct) {
    selector = $(slct);

    //remove dead look on restart
    if(selector.hasClass('dead')) {
      selector.removeClass('dead');
    }

    //on reset
    if(blinkTimer) {
      clearInterval(blinkTimer);
    }

    //blink
    blinkTimer = setInterval(function(){
      if(Math.floor(Math.random() * 10) % 4 == 0) {
        this.blink();
      }
    }, 1000);
  };

  this.blink = function() {
    selector.addClass('blink');
    setTimeout(function() {
      selector.removeClass('blink');
    }, 200);
  };

  this.emotion = function(state) {
    if(!state && state !== prevState) {
      selector.removeClass();
    }

    if(!selector.hasClass(state)) {
      selector.removeClass();
      if(state) {
        selector.addClass(state);
      }
    }

    var prevState = state;
  };

  this.toggleSleep = function(isSleeping) {
    selector.removeClass();

    if(isSleeping) {
      selector.addClass('sleep');
    }
  };

  this.die = function() {
    clearInterval(blinkTimer);
    selector.removeClass();
    selector.addClass('dead');
  };

  return this;
})();