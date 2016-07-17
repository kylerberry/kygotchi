var Kygotchi = (function(animate, StateMachine) {
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
    timeInterval = 1000, //time interval for timePasses()
    timer = null,
    medicineCount = 2, //number of medicines available
    mainEl = {};

  /*
  * initialize bindings and timer
  */
  ky.init = function(options) {
    //take in action bindings to bind/unbind in a clean way
    bindings = $.extend(bindings, options.bindings);

    $.each(bindings, function(method, selector) {
      $(selector).on('click', ky[method]);
    });

    StateMachine.create({
      events : [
        {'happy' : ky.happy},
        {'neutral' : ky.neutral},
        {'sad' : ky.sad},
        {'dead' : ky.dead},
        {'sleep' : ky.sleep},
        {'wake' : ky.wake},
        {'eat' : ky.eat},
        {'play' : ky.play},
        {'dragFood' : ky.dragFood},
        {'medicine' : ky.medicine},
        {'dragMedicine' : ky.dragMedicine}
      ],
      onUpdate : function() {
        if(ky.isAlive()) {
          ky.save();
        }
      }
    });

    /*BEGIN Drag & Drop*/
    var drake = dragula([
        $('#drop-target')[0],
        $('#controls')[0]
      ], {
        revertOnSpill: true,
        copy: true
    });

    //dragging item
    drake.on('drag', function(el, src) {
      if(ky.isAlive()) {
        if($(el).hasClass('food')) {
          ky.dragFood();
        }
        if($(el).hasClass('medicine')) {
          ky.dragMedicine();
        }
      }
    });

    //drop draggable
    drake.on('drop', function(el, target, src) {
      $(target).empty();
      if(ky.isAlive()) {
        if($(el).hasClass('food')) {
          ky.eat();
        }
        if($(el).hasClass('medicine')) {
          ky.medicine($(src).find('.medicine'));
        }
      }
    });

    //if draggables spill
    drake.on('cancel', function(el, container, src) {
      if(ky.isAlive()) {
        StateMachine.popState();
        animate.to(StateMachine.getCurrentState());
      }
    });
    /*END Drag & Drop*/

    timer = startTimer();

    mainEl = options.element ? options.element : mainEl; //save this in the animator?
    animate.init(mainEl);
    applyHealthState();
  };

  /* applies the next health state and animations */
  var applyHealthState = function() {
    var healthState = getHealthState();
    if(healthState == 'dead') {
      ky.dead();
      return;
    }

    StateMachine.pushState(healthState);
    animate.to(healthState);
  };

  /* returns happy, neutral, sad or dead based on health */
  var getHealthState = function() {
    if(!ky.foodLevel) {
      return 'dead';
    }

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

  /* Decrement Values */
  var decrementStats = function(props) {
    if(typeof props == 'undefined' || !props.length) {
      props = ['food', 'happiness', 'rest'];
    }

    props.forEach(function(prop) {
      if(ky[prop + 'Level']) {
        ky[prop + 'Level']--;
      }
    });
  };

  /* health application wrapper. logic same for all health states */
  var handleHealth = function() {
    if(StateMachine.getCurrentState() == 'eat') {
      var popped = StateMachine.pop();
    }

    decrementStats();
    applyHealthState();

    if(popped) {
      StateMachine.pushState(popped);
    }
  };

  ky.happy = function() {
    handleHealth();
  };

  ky.neutral = function() {
    handleHealth();
  };

  ky.sad = function() {
    handleHealth();
  };

  ky.dead = function() {
    StateMachine.pushState(getHealthState());
    animate.die();
    clearInterval(timer);
    localStorage.removeItem('gotchi');
    unbindActions();
  };

  ky.sleep = function() {
    decrementStats(['happiness', 'food']);
    if(ky.restLevel < maxThreshold
      && StateMachine.getCurrentState() !== 'eat'
      && StateMachine.getCurrentState() !== 'sleep') {
      ky.restLevel++;
      StateMachine.pushState('sleep');
      animate.to('sleep');
    }

    if(getHealthState() == 'dead') {
      StateMachine.pushState('dead');
      return;
    }
  };

  ky.wake = function() {
    applyHealthState();
  };

  ky.eat = function() {
    var currState = StateMachine.getCurrentState();

    if(ky.foodLevel < maxThreshold
      && currState !== 'eat'
      && currState !== 'sleep')
      {
      ky.foodLevel++;
      StateMachine.pushState('eat');
      animate.to('eat');

      var eatingTO = setTimeout(function() {
        StateMachine.pushState(getHealthState());
        clearTimeout(eatingTO);
      }, 500);
    }
  };

  ky.dragFood = function() {
    StateMachine.pushState('dragFood');
    animate.to('drag-food');
  };

  ky.play = function() {
    console.log('my current state is ' + StateMachine.getCurrentState());
  };

  ky.dragMedicine = function() {
    StateMachine.pushState('dragMedicine');
    animate.to('drag-medicine');
  };

  ky.medicine = function(el) {
    var currState = StateMachine.getCurrentState();
    if(medicineCount
      && currState !== 'sleep'
      && currState !== 'medicine')
      {
      StateMachine.pushState('medicine');
      animate.to('medicine');
      ky.happinessLevel += ky.happinessLevel < maxThreshold ? 2 : 0;
      ky.restLevel += ky.restLevel < maxThreshold ? 2 : 0;
      medicineCount--;

      var medsTO = setTimeout(function() {
        StateMachine.pushState(getHealthState());
        clearTimeout(medsTO);
      }, 500);

      if(!medicineCount) {
        $(el).remove();
      }
    }
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
      //@todo make this called by the state and not the world timer.
      StateMachine.update();

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
