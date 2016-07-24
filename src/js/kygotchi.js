/*
food, happiness, rest decrease 1 per tick
if dragging food, happiness and rest decrease 1 per tick
if dragging medicine, food decrease 1 per tick
dropping food increase food 1
dropping medicine increase happiness and rest 2
*/

var Kygotchi = (function(animate, StateMachine, dragula) {
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
    mainEl = {},
    drake = null, //dragula instance
    decStats = ['happiness', 'rest', 'food']; //stat watchers

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
        decrementStats();

        if(ky.isAlive()) {
          ky.save();
        } else {
          ky.dead();
        }
      },
      onStateChange : function(state) {
        //reset the stats to watch
        setDecStats();

        switch(state) {
          case 'sleep':
            removeStat('rest');
          break;
          case 'dragFood':
            removeStat('food');
          break;
          case 'dragMedicine':
            removeStat('rest');
            removeStat('happiness');
          break;
        }
      }
    });

    /*BEGIN Drag & Drop*/
    drake = dragula([
        $('#drop-target')[0],
        $('#controls')[0]
      ], {
        revertOnSpill: true,
        copy: true
    });

    //dragging item
    drake.on('drag', function(el, src) {
      if(StateMachine.getCurrentState() == 'sleep' || getHealthState() == 'dead') {
        drake.cancel();
        return;
      }

      if($(el).hasClass('food')) {
        ky.dragFood();
      } else if($(el).hasClass('medicine')) {
        ky.dragMedicine();
      }
    });

    //drop draggable
    drake.on('drop', function(el, target, src) {
      $(target).empty();

      if($(el).hasClass('food')) {
        ky.eat();
      } else if($(el).hasClass('medicine')) {
        ky.medicine($(src).find('.medicine'));
      }
    });

    //if draggables spill
    drake.on('cancel', function(el, container, src) {
      if(StateMachine.getCurrentState() == 'sleep' || getHealthState() == 'dead') {
        return;
      }

      StateMachine.pushState(getHealthState());
      animate.to(getHealthState());
    });
    /*END Drag & Drop*/

    timer = startTimer();

    medicineCount = 2;
    mainEl = options.element ? options.element : mainEl; //save this in the animator?
    animate.init(mainEl);
    applyHealthState();
  };

  /*
  * ======================
  * HEALTH & STATE METHODS
  * ======================
  */

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

  /*
  * ============
  * STAT METHODS
  * ============
  */

  /* remove a stat to be decreased */
  var removeStat = function(stat) {
    if(decStats.indexOf(stat) !== -1) {
      decStats.splice(decStats.indexOf(stat), 1);
    }
  };

  /* sets the stats for which the decrementer will decrease */
  var setDecStats = function(props) {
    if(typeof props == 'undefined' || !props.length) {
      props = ['food', 'happiness', 'rest'];
    }
    decStats = props;
  };

  /* Decrement Stats */
  var decrementStats = function() {
    console.log(decStats);
    decStats.forEach(function(stat) {
      if(ky[stat + 'Level']) {
        ky[stat + 'Level']--;
      }
    });
  };

  /*
  * ============
  * EVENT METHODS
  * ============
  */

  ky.happy = function() {
    applyHealthState();
  };

  ky.neutral = function() {
    applyHealthState();
  };

  ky.sad = function() {
    applyHealthState();
  };

  ky.dead = function() {
    console.log('dead');
    StateMachine.pushState('dead'); //update state
    animate.die(); //death animate
    drake.destroy(); //kill drag listeners
    clearInterval(timer); // kill world clock
    localStorage.removeItem('gotchi'); //reset localStorage props
    unbindActions(); //unbind listeners
  };

  ky.sleep = function() {
    if(ky.restLevel < maxThreshold) {
      ky.restLevel++;
      StateMachine.pushState('sleep');
      animate.to('sleep');
    }

    if(getHealthState() == 'dead') {
      ky.dead();
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
        animate.to(getHealthState());
        clearTimeout(eatingTO);
      }, 500);
    }
  };

  ky.dragFood = function() {
    if(getHealthState() == 'dead') {
      ky.dead();
      return;
    }
    StateMachine.pushState('dragFood');
    animate.to('drag-food');
  };

  ky.play = function() {
    console.log('my current state is ' + StateMachine.getCurrentState());
  };

  ky.dragMedicine = function() {
    if(getHealthState() == 'dead') {
      ky.dead();
      return;
    }
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
      ky.happinessLevel += ky.happinessLevel < maxThreshold-1 ? 2 : 0;
      ky.restLevel += ky.restLevel < maxThreshold-1 ? 2 : 0;
      medicineCount--;

      var medsTO = setTimeout(function() {
        StateMachine.pushState(getHealthState());
        animate.to(getHealthState());
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
}(
  Animate || {},
  StateMachine || {},
  dragula || {}
));
