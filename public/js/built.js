$('document').ready(function() {
  Kygotchi.init({
    'gotchi' : '#gotchi',
    'bindings' : {
      'feed' : '#feed',
      'play' : '#play',
      'reset': '#reset',
      'sleep' : '#sleep',
      'wake' : '#wake',
      'medicine' : '#medicine'
    }
  });
});
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
  };

  return this;
})();
var Kygotchi = (function(animate) {
  // fetch states from LocalStorage
  var localSettings = localStorage.getItem('gotchi') ? JSON.parse(localStorage.getItem('gotchi')) : {};

  var defaults = {
    birthday: new Date('September 22, 1987'),
    isSleeping: false,
    foodLevel: 10,
    restLevel: 10,
    happinessLevel: 10,
    last_interaction: 'date'
  };

  var ky = $.extend(ky, defaults, localSettings);

  var bindings = {},
    maxThreshold = 15, //limit on health and other states
    timeInterval = 2000, //time interval for timePasses()
    timer = null,
    medicineCount = 2, //number of medicines available
    mainEl = {},
    fsm = {}; //state machine

  /*
  * initialize bindings and timer
  */
  ky.init = function(options) {
    //take in action bindings to bind/unbind in a clean way
    bindings = $.extend(bindings, options.bindings);

    $.each(bindings, function(method, selector) {
      $(selector).on('click', ky[method]);
    });

    //using none as 'to' to classify dynamic end state, handler decides
    fsm = StateMachine.create({
      error: function(e) {
        console.log(e + ' cannot be called from "' + fsm.current + '" state');
        return;
      },
      events: [
        { name: '_normal_health', from: ['none', 'happy', 'sad'], to: 'neutral' },
        { name: '_low_health', from: ['none', 'neutral'], to: 'sad' },
        { name: '_high_health', from: ['none', 'neutral'], to: 'happy' },
        { name: '_sleep', from: ['none', 'happy', 'neutral', 'sad'], to: 'sleep' },
        { name: '_feed', from: ['sad', 'neutral', 'happy'], to: 'none' },
        { name: '_wake', from: ['sleep'], to: 'none' },
        { name: '_die', from: ['sad', 'sleep'], to: 'dead'}
      ],
      callbacks: {
        on_normal_health: function() {
          animate.to('neutral');
        },
        on_high_health: function() {
          animate.to('happy');
        },
        on_low_health: function() {
          animate.to('sad');
        },
        on_sleep: function() {
          animate.to('sleep');
          debugStats();
        },
        on_wake: function() {
          animate.to();
          ky.update();
          debugStats();
          return false;
        },
        on_feed: function() {
          animate.to('eating');
          if(ky.foodLevel) {
            ky.foodLevel++;
          }
          setTimeout(function() {
            animate.to();
            ky.update();
            debugStats();
            return false;
          }, 1000);

          return StateMachine.ASYNC;
        },
        on_die: function() {
          animate.die();
          clearInterval(timer);
          localStorage.removeItem('gotchi');
          unbindActions();
        }
      }
    });

    timer = startTimer();

    mainEl = options.gotchi ? options.gotchi : mainEl; //save this state in the animator?
    animate.init(mainEl);

    ky.update();
  };

  /*
  * sleep
  */
  ky.sleep = function() {
    fsm._sleep();
  };

  /*
  * wake
  */
  ky.wake = function() {
    fsm._wake();
  };

  /*
  * increase foodLevel action, bindable
  */
  ky.feed = function() {
    fsm._feed();
  };

  /*
  * increase happiness action, bindable
  */
  ky.play = function() {
    if(!ky.isSleeping) {
      if(ky.happinessLevel < maxThreshold) {
        ky.happinessLevel++;
      }
    } else { //sleeping
      console.log('happy dreams');
    }
    debugStats();
  };

  /*
  * increase health action, bindable
  * limited use*
  */
  ky.medicine = function() {
    if(ky.calcHealth() < maxThreshold
      && medicineCount
      && !ky.isSleeping) {
      if(ky.happinessLevel < maxThreshold) {
        ky.happinessLevel++;
      }

      if(ky.restLevel < maxThreshold) {
        ky.restLevel++;
      }

      medicineCount--;
    }
    debugStats();
  };

  /*
  * for debugging: reset states for testing without reloading
  */
  ky.reset = function() {
    ky = $.extend(ky, defaults);
    clearInterval(timer);
    unbindActions();
    ky.init(bindings);
  };

  /*
  * check that the gotchi is alive
  */
  ky.isAlive = function() {
    return Boolean((ky.calcHealth() > 2) && ky.foodLevel);
  };

  /*
  * calculate the health of the gotchi
  */
  ky.calcHealth = function() {
    var accHealth = (ky.foodLevel + ky.happinessLevel + ky.restLevel) / 3;
    return accHealth >= maxThreshold ? maxThreshold : Math.floor(accHealth);
  };

  /*
  * Save Gotchi Props
  */
  ky.save = function() {
    localStorage.setItem('gotchi', JSON.stringify(pick(ky, Object.keys(defaults))));
  };

  /* pick the props we need to save from
  * the ky obj with a set of keys provided from defaults
  */
  var pick = function(obj, keys) {
    var acc = {};
    keys.forEach(function(k) {
      if(obj.hasOwnProperty(k)) {
        acc[k] = obj[k];
      }
    });
    return acc;
  };

  /*
  * the game loop
  * //@todo find out how to get these to be contained in their states.
  * //states have their own update?
  */
  var timePasses = function() {
    if(ky.foodLevel) {
      ky.foodLevel--;
    }

    if(ky.happinessLevel) {
      ky.happinessLevel--;
    }

    if(fsm.is('sleep')) {
      if(ky.restLevel < maxThreshold) {
        ky.restLevel++;
      }
    } else {
      if(ky.restLevel) {
        ky.restLevel--;
      }
    }

    ky.update();
  };

  /* update animations based on healthLevel*/
  ky.update = function() {
    var health = ky.calcHealth();
    if(health > 8) {
      fsm._high_health();
    } else if(health > 5 && health <= 8) {
      fsm._normal_health();
    } else if(health <= 5 && health > 2) {
      fsm._low_health();
    } else {
      fsm._die();
      return;
    }

    ky.save();
  };

  /*
  * unbind the eventListeners
  */
  var unbindActions = function() {
    $.each(bindings, function(key, selector) {
      if(key !== 'reset') {
        $(selector).off();
      }
    });
  };

  /*
  * sets game timer
  */
  var startTimer = function() {
    debugStats();
    return setInterval(function() {
      timePasses();
      debugStats();
    }, timeInterval);
  };

  /*
  * Output properties for debugging
  */
  var debugStats = function() {
    $('#debug').html(
      'healthLevel: ' + ky.calcHealth() + '<br/>' +
      'foodLevel: ' + ky.foodLevel + '<br/>' +
      'happinessLevel: ' + ky.happinessLevel + '<br/>' +
      'restLevel: ' + ky.restLevel + '<br/>'
    );
  };

  return ky;
}(Animate || {}));
