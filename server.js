'use strict';

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
