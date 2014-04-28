'use strict';

var LocalStrategy = require('passport-local').Strategy,
    User = require('../app/models/user');

module.exports = function(passport) {
  /* Passport session setup */
  // required for persistent login sessions
  // passports needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // used to unserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  /* Local Signup */
  // we are using name strategies since we have one for login and one for
  // signup by defaut, if there was no name, it would just be called 'local'

  passport.use('local-signup', new LocalStrategy({
    // by default local strategy uses username and password, we will override
    // with email
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
  function(req, email, password, done) {
    // asynchronous
    // User.findOne wont fire until data is sent back
    process.nextTick(function() {
      User.findOne({ 'local.email': email }, function(err, user) {
        // if there are any errors, return the error
        if (err) {
          return done(err);
        }

        // check to see if there is already a user with that email
        if (user) {
          // return fail signup with a message (flash-message)
          return done(null, false, {
            // previous req.flash('signupMessage', 'That email is already taken.')
            message: 'That email is already taken.'
          });
        }

        // if there is no user with that email
        // create the user
        var newUser = new User();
        // set the user's local credentials
        newUser.local.email = email;
        newUser.local.password = newUser.generateHash(password);

        // save the user
        newUser.save(function(err) {
          if (err) {
            return done(err);
          }

          // set expiration to one hour
          req.session.cookie.maxAge = 3600000;
          return done(null, newUser);
        });
      });
    });
  }));

  /* Local Login */
  // we are using named strategies since we have one for login and one for
  // signup. by default, if there was no name, it would just be called 'local'

  passport.use('local-login', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
  },
  function(req, email, password, done) { // callback with email and password from our form
    // find a user whose email is the same as the forms email
    // we are checking to see if the user trying to login already exists
    User.findOne({ 'local.email' :  email }, function(err, user) {
      // if there are any errors, return the error before anything else
      if (err) {
        return done(err);
      }

      // if no user is found, return the message
      if (!user) {
        // req.flash('loginMessage', 'No user found.')
        return done(null, false, {
          message: 'No user found.'
        });
      }

      // if the user is found but the password is wrong
      if (!user.validPassword(password)) {
        // req.flash('loginMessage', 'Oops! Wrong password.')
        return done(null, false, {
          message: 'Oops! Wrong password.'
        });
      }

      // set expiration to one hour
      req.session.cookie.maxAge = 3600000;
      return done(null, user);
    });
  }));
};
