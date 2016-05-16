$('document').ready(function() {
  Kygotchi.init({
    'feed' : '#feed',
    'play' : '#play',
    'reset': '#reset',
    'toggleSleep' : '#toggleSleep',
    'medicine' : '#medicine'
  });
});
var Kygotchi = (function() {
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
    medicineCount = 2; //number of medicines available

  /*
  * initialize bindings and timer
  */
  ky.init = function(options) {
    //take in action bindings to bind/unbind in a clean way
    bindings = $.extend(bindings, options);

    $.each(bindings, function(method, selector) {
      $(selector).on('click', function() {
        ky[method]();
      });
    });

    timer = startTimer();
  };

  /*
  * toggle the sleep state
  */
  ky.toggleSleep = function() {
    ky.isSleeping = !ky.isSleeping;
    $(bindings['toggleSleep']).html(ky.isSleeping ? 'Wake' : 'Sleep');
    debugStats();
  };

  /*
  * Gotchi dies. Kill the timer and unbind actions
  */
  ky.die = function() {
    clearInterval(timer);
    localStorage.removeItem('gotchi');
    unbindActions();
  };

  /*
  * increase foodLevel action, bindable
  */
  ky.feed = function() {
    if(!ky.isSleeping) {
      if(ky.foodLevel < maxThreshold) {
        ky.foodLevel++;
      } else {
        console.log('barf!');
      }
    }
    debugStats();
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
  */
  var timePasses = function() {
    if(ky.foodLevel) {
      ky.foodLevel--;
    }

    if(!ky.isSleeping) { //awake
      if(ky.restLevel) {
        ky.restLevel--;
      }

      if(ky.happinessLevel) {
        ky.happinessLevel--;
      }

    } else { //sleeping
      if(ky.restLevel < maxThreshold) {
        ky.restLevel++;
      }

      if(ky.happinessLevel) {
        ky.happinessLevel--;
      }
    }

    if(!ky.isAlive()) {
      ky.die();
    } else {
      ky.save();
    }
  };

  /*
  * unbind the eventListeners
  */
  var unbindActions = function() {
    $.each(bindings, function(key, selector) {
      if(key!=='reset') {
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
  * get a descriptive hunger state
  * perhaps use for animation or sprite state
  */
  var fatLevel = function() {
    if(ky.foodLevel <= 5) {
      return 'starving';
    } else if(ky.foodLevel >= 11) {
      return 'fat';
    }
    return 'fit';
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
}());

var Animate = (function() {
  return this;
})();