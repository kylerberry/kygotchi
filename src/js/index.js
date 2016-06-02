$('document').ready(function() {
  Kygotchi.init({
    'gotchi' : '#gotchi',
    'bindings' : {
      'feed' : '#feed',
      'play' : '#play',
      'reset': '#reset',
      'toggleSleep' : '#toggleSleep',
      'medicine' : '#medicine'
    }
  });
});