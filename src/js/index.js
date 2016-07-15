$('document').ready(function() {
  Kygotchi.init({
    'element' : '#gotchi',
    'bindings' : {
      'play' : '#play',
      'reset' : '#reset',
      'sleep' : '#sleep',
      'wake' : '#wake'
    }
  });
});