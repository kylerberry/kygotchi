var Animate = (function() {

  var selector = '',
    blinkTimer = null,
    parent = '',
    shadow = '',
    reveal = '';

  this.init = function(slct) {
    if(!selector) {
      selector = $(slct);
      parent = selector.parent();
      shadow = parent.next('.shadow');
      reveal = $('.poof');
    }

    //gotchi entrance poof, kind of dirty
    reveal.addClass('poof-in');
    selector.css({'opacity' : 0});
    setTimeout(function() {
      selector.css({'opacity' : 1});
    }, 350);
    setTimeout(function() {
      reveal.removeClass('poof-in');
    }, 500);

    //remove dead look on restart
    if(selector.hasClass('dead')) {
      selector.removeClass('dead');
      parent.addClass('hover');
      shadow.addClass('shadow-moving');
    }

    //on reset
    if(blinkTimer) {
      clearInterval(blinkTimer);
    }

    //blink
    blinkTimer = setInterval(this.blink, 2000);
  };

  this.blink = function() {
    selector.addClass('blink');
    setTimeout(function() {
      selector.removeClass('blink');
    }, 200);
  };

  this.to = function(state) {
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

  this.die = function() {
    clearInterval(blinkTimer);
    selector.removeClass();
    selector.addClass('dead');
    parent.removeClass('hover');
    shadow.removeClass('shadow-moving');
  };

  return this;
})();