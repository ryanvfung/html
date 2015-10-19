HTML Template 5.2
=================

Description
-----------

A starting boilerplate for any website development based on the *PyroCarbon* theme, with essential HTML structure, CSS styling and JavaScript scripting included. Version 5.2 is built on Twitter Bootstrap 4.0.0 alpha.

Available for use under the MIT license.

**Author**: Ryan Fung

**Created**: April 29th 2015

**Last Modified**: October 2015



Usage
-----

HTML Template 5.2 is written in Jade, SCSS and JavaScript.

Either modify the source file and compile Jade and SCSS to HTML and CSS respectively, or use the distribution version in the `dist` folder.

Minified versions of the compiled files are also available in the `dist` folder.

As HTML Template 5.2 is based on [Bootstrap 4](http://getbootstrap.com/), all CSS style classes and JavaScript components from Bootstrap can be used.

### Build steps

* To compile all files, run `npm run make`
* To compile only Jade, run `npm run jade`
* To compile only SCSS, run `npm run scss`
* To minify all files, run `npm run minify`

### Contents

```
5.2/
├── _z52-colours.scss
├── z52.jade
├── z52.js
├── z52.scss
├── dist/
    ├── z52.css
    ├── z52.css.map
    ├── z52.html
    ├── z52.js
    ├── z52.min.css
    ├── z52.min.html
    └── z52.min.js
```



Housekeeping
------------

### Upcoming edits

* Style footer
* Test jumbotron and other Bootstrap components

### Validation
* [HTML via Validator.nu](https://validator.nu/?doc=https%3A%2F%2Fryanvfung.github.io%2Fprojects%2Fhtml%2Fz52.html&parser=html5&laxtype=yes)
* [CSS via W3C CSS Validation Service](https://jigsaw.w3.org/css-validator/validator?uri=https%3A%2F%2Fryanvfung.github.io%2Fprojects%2Fhtml%2Fz52.html&profile=css3&usermedium=all&warning=1&vextwarning=&lang=en)
* [CSS via W3C CSS Validation Service (verbose)](https://jigsaw.w3.org/css-validator/validator?uri=https%3A%2F%2Fryanvfung.github.io%2Fprojects%2Fhtml%2Fz52.html&profile=css3&usermedium=all&warning=2&vextwarning=true&lang=en)
