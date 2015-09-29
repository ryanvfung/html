/* globals $ */
$(function(){
  var offset = $('main').position().top - $('header .navbar').height() - 8;
  $('body').scrollspy({
    target: '#sidenav',
    offset: offset
  });
  $(window).scroll( function () {
    if ( $('body').scrollTop() > $('main').position().top - $('header .navbar').height() - 8 ) {
      $('#sidenav').addClass('sticky');
    } else {
      $('#sidenav').removeClass('sticky');
    }
  });
});
