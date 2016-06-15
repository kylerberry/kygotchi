var Kygotchi = (function(animate, sm) {
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

  var ky = $.extend(ky, defaults, localSettings, sm);

  var bindings = {},
    maxThreshold = 15, //limit on health and other states
    timeInterval = 1000, //time interval for timePasses()
    timer = null,
    medicineCount = 2, //number of medicines available
    mainEl = {}; //state machine

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
/*
        { name: '_normal_health', from: ['none', 'happy', 'sad'], to: 'neutral' },
        { name: '_low_health', from: ['none', 'neutral'], to: 'sad' },
        { name: '_high_health', from: ['none', 'neutral'], to: 'happy' },
        { name: '_sleep', from: ['none', 'happy', 'neutral', 'sad'], to: 'sleep' },
        { name: '_feed', from: ['sad', 'neutral', 'happy'], to: 'none' },
        { name: '_wake', from: ['sleep'], to: 'none' },
        { name: '_die', from: ['sad', 'sleep'], to: 'dead'}

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
        }
      }
    });*/

    timer = startTimer();

    mainEl = options.element ? options.element : mainEl; //save this state in the animator?
    animate.init(mainEl);

    ky.pushState(getHealthState());
    ky.update();
  };

  /* returns happy, neutral or sad */
  var getHealthState = function() {
    var health = ky.calcHealth();
     if(health > 8) {
      return 'happy';
    } else if(health > 5 && health <= 8) {
      return 'neutral';
    } else if(health <= 5 && health > 2) {
      return 'sad';
    } else {
      return 'dead';
    }
  };

  ky.happy = function() {
    console.log('my current state is ' + ky.getCurrentState());
    decrementStats();
    var nextState = getHealthState();
    ky.pushState(nextState);
    animate.to(nextState);
  };

  ky.neutral = function() {
    console.log('my current state is ' + ky.getCurrentState());
    decrementStats();
    var nextState = getHealthState();
    ky.pushState(nextState);
    animate.to(nextState);
  };

  ky.sad = function() {
    console.log('my current state is ' + ky.getCurrentState());
    decrementStats();
    var nextState = getHealthState();

    if(nextState == 'dead') {
      ky.pushState(nextState);
      ky.update();
    } else {
      ky.pushState(nextState);
      animate.to(nextState);
    }
  };

  ky.dead = function() {
    console.log('my current state is ' + ky.getCurrentState());
    ky.pushState(getHealthState());
    animate.die();
    clearInterval(timer);
    localStorage.removeItem('gotchi');
    unbindActions();
  };

  ky.eat = function() {
    console.log('my current state is ' + ky.getCurrentState());
  };

  ky.sleep = function() {
    console.log('my current state is ' + ky.getCurrentState());
  };

  ky.wake = function() {
    console.log('my current state is ' + ky.getCurrentState());
  };

  ky.play = function() {
    console.log('my current state is ' + ky.getCurrentState());
  };

  /* Decrement Values */
  var decrementStats = function(props) {
    if(!Array.isArray(props)) {
      props = ['food', 'happiness', 'rest'];
    }

    props.forEach(function(prop) {
      if(ky[prop + 'Level']) {
        ky[prop + 'Level']--;
      }
    });

    /*if(ky.foodLevel) {
      ky.foodLevel--;
    }
    if(ky.happinessLevel) {
      ky.happinessLevel--;
    }
    if(ky.restLevel) {
      ky.restLevel--;
    }*/
  };

  /*
  * reset states without reloading
  */
  ky.reset = function() {
    ky = $.extend(ky, defaults);
    clearInterval(timer);
    unbindActions();
    ky.init(bindings);
  };


  ky.medicine = function() {

  };

  // /*
  // * increase happiness action, bindable
  // */
  // ky.play = function() {
  //   if(!ky.isSleeping) {
  //     if(ky.happinessLevel < maxThreshold) {
  //       ky.happinessLevel++;
  //     }
  //   } else { //sleeping
  //     console.log('happy dreams');
  //   }
  //   debugStats();
  // };


  // * increase health action, bindable
  // * limited use*

  // ky.medicine = function() {
  //   if(ky.calcHealth() < maxThreshold
  //     && medicineCount
  //     && !ky.isSleeping) {
  //     if(ky.happinessLevel < maxThreshold) {
  //       ky.happinessLevel++;
  //     }

  //     if(ky.restLevel < maxThreshold) {
  //       ky.restLevel++;
  //     }

  //     medicineCount--;
  //   }
  //   debugStats();
  // };

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
      ky.update();
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
}(Animate || {}, StateMachine || {}));
