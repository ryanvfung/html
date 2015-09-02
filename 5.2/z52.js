// $(window).scroll( function () {
// 	if ( $("body").scrollTop() > $("main").position().top - 64 ) { // - 64
// 		$("#sidenav").addClass("affix")
// 	} else {
// 		$("#sidenav").removeClass("affix");
// 	}
// });
$(document).ready(function(){
	$('body').scrollspy({ target: '#sidenav', offset: 64 });
	$('nav#sidenav a').click( function () {
		$.scrollTo($('#'+this.href.split('#')[1]).offset().top - 64 + 'px', 400);
	});
});
