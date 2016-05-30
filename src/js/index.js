$('document').ready(function() {
  Kygotchi.init({
    'gotchi' : '.ky',
    'bindings' : {
      'feed' : '#feed',
      'play' : '#play',
      'reset': '#reset',
      'toggleSleep' : '#toggleSleep',
      'medicine' : '#medicine'
    }
  });
});