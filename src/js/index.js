$('document').ready(function() {
  Kygotchi.init({
    'element' : '#gotchi',
    'bindings' : {
      'eat' : '#feed',
      'play' : '#play',
      'reset' : '#reset',
      'sleep' : '#sleep',
      'wake' : '#wake'
    }
  });
});