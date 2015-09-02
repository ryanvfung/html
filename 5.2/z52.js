$(window).scroll( function () {
	if ( $("body").scrollTop() > $("main").position().top - 64 ) { // - 64
		$("#sidenav").addClass("affix")
	} else {
		$("#sidenav").removeClass("affix");
	}
});
