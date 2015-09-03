// $(window).scroll( function () {
// 	if ( $("body").scrollTop() > $("main").position().top - 64 ) { // - 64
// 		$("#sidenav").addClass("affix")
// 	} else {
// 		$("#sidenav").removeClass("affix");
// 	}
// });
$(document).ready(function(){
	$('body').scrollspy({ target: '#sidenav', offset: 64 });
	// $('nav#sidenav a').click( function () {
	// 	$.scrollTo($('#'+this.href.split('#')[1]).offset().top - 64 + 'px', 400);
	// });

	// $("a[href^='#']").on('click', function(e) {
	//
	// 	// prevent default anchor click behavior
	// 	e.preventDefault();
	//
	// 	// store hash
	// 	var hash = this.hash;
	// 	// animate
	// 	$('body').animate({
	// 		scrollTop: $(hash).offset().top - 64
	// 	}, 300);
	//
	// 	if(history.pushState) {
	// 	    history.pushState(null, null, hash);
	// 	}
	// 	else {
	// 	    location.hash = hash;
	// 	}
	// });
});
