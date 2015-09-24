var fs = require( 'fs' ),
    html5Lint = require( 'html5-lint' );

var messages = "";

fs.readFile( 'dist/z52.html', 'utf8', function( err, html ) {
  if ( err )
    throw err;

  html5Lint( html, function( err, results ) {
    results.messages.forEach( function( msg ) {
      var type = msg.type, // error or warning
          message = msg.message;

      messages += "HTML5 Lint ["+ type + "]: " + message + "\n";
      console.log( "HTML5 Lint [%s]: %s", type, message );
    });
  });
});

fs.writeFile( '../log/z52-html5-lint.log', messages, function ( err ) {
  if ( err )
    throw err;
});
