var Animate = (function() {

  var selector = '',
    blinkTimer = null;

  this.init = function(slct) {
    selector = $(slct);

    //remove dead look on restart
    if(selector.hasClass('dead')) {
      selector.removeClass('dead');
    }

<<<<<<< Updated upstream
=======
    //on reset
    if(blinkTimer) {
      clearInterval(blinkTimer);
    }

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  /*this.toggleSleep = function(selector, sleep) {
    if(sleep) {
      selector.addClass('sleep');
    }

    selector.addClass('sleep');
  };*/

  this.die = function() {
    clearInterval(blinkTimer);
    selector.addClass('dead');
=======
  this.emotion = function(state) {
    if(!state && state !== prevState) {
      selector.removeClass();
      selector.addClass('ky');
    }

    if(!selector.hasClass(state)) {
      selector.removeClass();
      selector.addClass('ky');
      if(state) {
        selector.addClass(state);
      }
    }

    var prevState = state;
  };

  this.die = function() {
    clearInterval(blinkTimer);
    selector.removeClass();
    selector.addClass('ky dead');
>>>>>>> Stashed changes
  };

  return this;
})();