$(window).scroll( function () {
	$("body").scrollTop() > $("main").position().top - 20 ? $("#navbar-side").addClass("affix") : $("#navbar-side").removeClass("affix");
});