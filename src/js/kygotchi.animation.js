var Animate = (function() {

  var selector = '',
    blinkTimer = null;

  this.init = function(slct) {
    selector = $(slct);

    //remove dead look on restart
    if(selector.hasClass('dead')) {
      selector.removeClass('dead');
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

  /*this.toggleSleep = function(selector, sleep) {
    if(sleep) {
      selector.addClass('sleep');
    }

    selector.addClass('sleep');
  };*/

  this.die = function() {
    clearInterval(blinkTimer);
    selector.addClass('dead');
  };

  return this;
})();