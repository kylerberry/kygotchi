/*
food, happiness, rest decrease 1 per tick
if dragging food, happiness and rest decrease 1 per tick
if dragging medicine, food decrease 1 per tick
dropping food increase food 1
dropping medicine increase happiness and rest 2
*/

/*
instead of timer a set number of moves until a decrement action happens (timer happens if no choice is made)
*/

var Kygotchi = (function(animate, StateMachine, dragula) {
  // fetch states from LocalStorage
  var localSettings = localStorage.getItem('gotchi') ? JSON.parse(localStorage.getItem('gotchi')) : {};

  var defaults = {
    birthday: new Date('September 22, 1987'),
    foodLevel: 10,
    restLevel: 10,
    happinessLevel: 10,
    last_interaction: 'date'
  };

  var ky = $.extend(ky, defaults, localSettings);

  var bindings = {},
    maxThreshold = 10, //limit on health and other states
    timeInterval = 3000,
    timer = null,
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

        {'dragSleep' : ky.dragSleep},
        {'sleep' : ky.sleep},

        {'dragFood' : ky.dragFood},
        {'food' : ky.food},

        {'dragPlay' : ky.dragPlay},
        {'play' : ky.play},

        {'dragMedicine' : ky.dragMedicine},
        {'medicine' : ky.medicine}
      ],
      onUpdate : function() {
        decrementStats();

        if(ky.isAlive()) {
          ky.save();
        } else {
          ky.dead();
        }

        ky.updateMeters();
      },
      onStateChange : function(state) {
        //reset the stats to watch
        setDecStats();

        switch(state) {
          case 'dragSleep':
            removeStat(['rest']);
          break;
          case 'dragFood':
            removeStat(['food']);
          break;
          case 'dragMedicine':
            removeStat(['rest', 'happiness']);
          break;
          case 'dragPlay':
            removeStat(['happiness']);
          break;
        }
      }
    });

    /*BEGIN Drag & Drop*/
    drake = dragula([
        $('#drop-target')[0],
        $('#controls')[0],
      ], {
        revertOnSpill: true,
        copy: true
    });

    //dragging item
    drake.on('drag', function(el, src) {
      if(StateMachine.getCurrentState() == 'sleep') {
        drake.cancel();
        return;
      }

      var role = $(el).data().role,
        method = 'drag' + role.charAt(0).toUpperCase() + role.slice(1);
      if(typeof ky[method] == 'function') {
        ky[method]();
      }
    });

    //drop draggable
    drake.on('drop', function(el, target, src) {
      $(target).empty();

      if(typeof ky[$(el).data().role] == 'function') {
        ky[$(el).data().role]();
      }
    });

    //if draggables spill
    drake.on('cancel', function(el, container, src) {
      if(StateMachine.getCurrentState() == 'sleep') {
        return;
      }

      StateMachine.pushState(getHealthState());
      animate.to(getHealthState());
    });
    /*END Drag & Drop*/

    timer = startTimer();

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

    StateMachine.pushState(healthState);
    animate.to(healthState);
  };

  /* returns happy, neutral, sad or dead based on health */
  var getHealthState = function() {
    if(!ky.foodLevel || (!ky.restLevel && !ky.happinessLevel)) {
      return 'dead';
    }

    var health = ky.calcHealth();

    if(health > 7) {
      return 'happy';
    } else if(health > 4 && health <= 7) {
      return 'neutral';
    } else if(health <= 4 && health > 0) {
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
  var removeStat = function(stats) {
    for(var i = 0; i < stats.length; i++) {
      if(decStats.indexOf(stats[i]) !== -1) {
        decStats.splice(decStats.indexOf(stats[i]), 1);
      }
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
    decStats.forEach(function(stat) {
      if(ky[stat + 'Level']) {
        ky[stat + 'Level']--;
      }
    });
  };

  /*
  * =============
  * EVENT METHODS
  * =============
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
    StateMachine.pushState('dead'); //update state
    animate.die(); //death animate
    clearInterval(timer); // kill world clock
    localStorage.removeItem('gotchi'); //reset localStorage props
    unbindActions(); //unbind listeners
    $('#timer').hide();

    drake.destroy(); //kill dragula listeners
    /*fixes situation where dragula binds would not be destroyed if
    an item is dragged within milliseconds of a death state.
    remove the dragula instantiation*/
    drake = null;
  };

  ky.sleep = function() {
    var currState = StateMachine.getCurrentState();

    if(ky.restLevel < maxThreshold && currState !== 'sleep') {
      ky.restLevel++;
      StateMachine.pushState('sleep');
      animate.to('sleep');
      ky.updateMeters();

      var sleepingTO = setTimeout(function() {
        StateMachine.pushState(getHealthState());
        animate.to(getHealthState());
        clearTimeout(sleepingTO);
      }, 1000);
    } else {
      //maxed out (too rested)
      StateMachine.pushState(getHealthState());
      animate.to(getHealthState());
    }
  };

  ky.food = function() {
    var currState = StateMachine.getCurrentState();

    if(ky.foodLevel < maxThreshold && currState !== 'food') {
      ky.foodLevel++;
      StateMachine.pushState('food');
      animate.to('food');
      ky.updateMeters();

      var eatingTO = setTimeout(function() {
        StateMachine.pushState(getHealthState());
        animate.to(getHealthState());
        clearTimeout(eatingTO);
      }, 500);
    } else {
      //maxed out (too full)
      StateMachine.pushState(getHealthState());
      animate.to(getHealthState());
    }
  };

  ky.dragSleep = function() {
    StateMachine.pushState('dragSleep');
    animate.to('drag-sleep');
  };

  ky.dragFood = function() {
    StateMachine.pushState('dragFood');
    animate.to('drag-food');
  };

  ky.dragPlay = function() {
    StateMachine.pushState('dragPlay');
    animate.to('drag-play');
  };

  ky.play = function() {
    var currState = StateMachine.getCurrentState();

    if(ky.happinessLevel < maxThreshold && currState !== 'play') {
      ky.happinessLevel++;
      StateMachine.pushState('play');
      animate.to('play');
      ky.updateMeters();

      var playingTO = setTimeout(function() {
        StateMachine.pushState(getHealthState());
        animate.to(getHealthState());
        clearTimeout(playingTO);
      }, 500);
    } else {
      //maxed out (too happy??)
      StateMachine.pushState(getHealthState());
      animate.to(getHealthState());
    }
  };

  ky.dragMedicine = function() {
    StateMachine.pushState('dragMedicine');
    animate.to('drag-medicine');
  };

  ky.medicine = function(el) {
    var currState = StateMachine.getCurrentState();
    if(currState !== 'medicine') {
      StateMachine.pushState('medicine');
      animate.to('medicine');
      ky.happinessLevel += ky.happinessLevel < maxThreshold-1 ? 2 : 0;
      ky.restLevel += ky.restLevel < maxThreshold-1 ? 2 : 0;
      ky.updateMeters();

      var medsTO = setTimeout(function() {
        StateMachine.pushState(getHealthState());
        animate.to(getHealthState());
        clearTimeout(medsTO);
      }, 500);
    }
  };

  /*
  * reset states without reloading
  */
  ky.reset = function() {
    ky = $.extend(ky, defaults);
    clearInterval(timer);
    unbindActions(true);

    //reset the clock
    var clockClone = $('#timer').clone();
    $('#timer').remove();
    $('.timer-wrapper').append(clockClone.hide());

    if(drake) {
      drake.destroy();
      drake = null;
    }

    ky.init(bindings);
  };

  /*
  * check that the gotchi is alive
  */
  ky.isAlive = function() {
    return getHealthState() !== 'dead';
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
  *
  * @param includeReset Boolean | whether or not to unbind 'reset' listener
  */
  var unbindActions = function(includeReset) {
    if(typeof includeReset == 'undefined') {
      includeReset = false;
    }
    $.each(bindings, function(key, selector) {
      if(key !== 'reset' || includeReset) {
        $(selector).off();
      }
    });
  };

  /*
  * sets game timer
  */
  var startTimer = function() {
    ky.updateMeters();
    $('#timer').show();
    return setInterval(function() {
      StateMachine.update();
      ky.updateMeters();
    }, timeInterval);
  };

  var getColorByNumber = function(num) {
    var colors = {
      low:'#C34227',
      med:'#DDBF41',
      high:'#94AF3C'
    };

    if(num < 40) {
      return colors.low;
    }

    if(num < 70) {
      return colors.med;
    }

    return colors.high;
  };

  /*
  * Output properties for debugging
  */
  ky.updateMeters = function() {
    var meters = $('#meters').children();

    meters.each(function(i, meter) {
      var meter = $(meter),
        level = null;

      switch(meter.data().role) {
        case 'food':
          level = ky.foodLevel * 10;
        break;
        case 'happy':
          level = ky.happinessLevel * 10;
        break;
        case 'health':
          level = ky.calcHealth() * 10;
        break;
        case 'rest':
          level = ky.restLevel * 10;
        break;
      }

      meter.find('span').css({'width' : level + '%', 'background' : getColorByNumber(level)});
    });
  };

  return ky;
}(
  Animate || {},
  StateMachine || {},
  dragula || {}
));
