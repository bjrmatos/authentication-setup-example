'use strict';

/**
*
* Issue por resolver: Cuando creamos una cuenta y la asociamos a facebook,
* luego cerramos session, creamos otra cuenta y asociamos la misma
* cuenta de facebook anteriormente registrada en otra cuenta, queda un problema
* en la base de datos, ya que existen 2 cuentas con el mismo facebook asociado,
* y para esta aplicacion que usa el login de facebook, al intentar iniciar sesion
* con facebook, la base de datos tiene 2 cuentas asociadas al facebook que se esta
* intentando logear, por ende el login termina siendo realizada por cualquiera
* de las 2 cuentas al alzar (incluso al un problema mayor en el relinking de las
* cuentas, ya que volviendo a linkear una cuenta con ese facebook, lo que termina
* pasando es que para la cuenta tambien se termina asociando)
*
* En conclusion el problema es debido a que esta aplicacion esta permitiendo
* asociar una misma cuenta (de Facebook, Twitter, Google) a n cuentas, lo cual
* lleva a irregularidades al momento de iniciar sesion desde Facebook, Twitter, Google,
* al momento de desvincular cuentas y al momento de volver a vincularlas.
*
**/


var express = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    flash = require('connect-flash'),
    configDB = require('./config/database'),
    app = express();

mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// configuration of express app
app.configure(function() {
  // setup express application
  app.use(express.logger('dev')); // log every request to the console
  // read cookies, adding support for signed cookies by passing a secret (needed for auth)
  app.use(express.cookieParser('ilovescotchscotchyscotchscotch'));
  app.use(express.bodyParser()); // get information from html forms

  // PORT 8080 used in the register of the app in Twitter, Facebook, Google
  app.set('port', process.env.PORT || 8080);
  app.set('view engine', 'ejs'); // set up ejs for templating

  // required for passport
  app.use(express.session({
    key: 'auth-sid', // cookie name
    secret: 'ilovescotchscotchyscotchscotch' // session secret, cookie is signed with this secret to prevent tampering
  }));
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions
  app.use(flash()); // use connect-flash for flash messages stored in session
});

// routes
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

app.listen(app.get('port'));

console.log('Express server listening on port ' + app.get('port'));
