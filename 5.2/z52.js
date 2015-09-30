/* globals $ */
$(function(){
  var offset = $('main').position().top - $('header .navbar').height() - 8;
  $('body').scrollspy({
    target: '.c-sidebar .navbar',
    offset: offset
  });
  $(window).scroll( function () {
    if ( $('body').scrollTop() > $('main').position().top - $('header .navbar').height() - 8 ) {
      $('.c-sidebar .navbar').addClass('sticky');
    } else {
      $('.c-sidebar .navbar').removeClass('sticky');
    }
  });
});
