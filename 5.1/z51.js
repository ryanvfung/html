/* Ryan Fung's HTML Template v5.1 JavaScript */
window.onload = function () {
    $('#navbar-title').text( $('#subtitle').text() );
    var a = $('nav#nav a');
    for ( i = 0; i < a.length; i++ ) {
        if( a[i].text == $('#subtitle').text() ) {
            $(a[i]).addClass('nav-this');
            $(a[i]).parent().addClass('intra');
        }
    }
    document.title = $('#subtitle').text() + ' \xb7 ' + $('#title').text();
    if( window.location.hash !== '' ) {
        window.setTimeout(
            function () {
                if ( $('#navbar').height() == 0 ) {
                    $.scrollTo($(window.location.hash).offset().top - $('header').height() - 1*$('header').css('paddingTop').split('px')[0] + 'px', 500);
                } else {
                    $.scrollTo($(window.location.hash).offset().top - $('#navbar').height() + 'px', 500);
                }
            },
            1000
        );
    }
    $('#navbar-button').click( function () {
        $('body').toggleClass('nav-active');
    });
    $('nav#nav > ul > li a').click( function () {
        $('body').toggleClass('nav-active');
    });
    $('nav#nav .intra a').click( function () {
        if ( $('#navbar').height() == 0 ) {
            $.scrollTo($('#'+this.href.split('#')[1]).offset().top - $('header').height() - 1*$('header').css('paddingTop').split('px')[0] + 'px', 500);
        } else {
            $.scrollTo($('#'+this.href.split('#')[1]).offset().top - $('#navbar').height() + 'px', 500);
        }
    });
    $('#main-wrapper').click ( function () {
        if( $('body').hasClass('nav-active') ) {
            $('body').toggleClass('nav-active');
        }
    });
}
$(window).scroll( function () {
    if( $('body').scrollTop() > $('#header-wrapper').css('paddingTop').split('px')[0] ) {
        $('body').addClass('obscured');
    } else {
        $('body').removeClass('obscured');
    }
});
