'use strict';

var LocalStrategy = require('passport-local').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    TwitterStrategy = require('passport-twitter').Strategy,
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    User = require('../app/models/user'),
    configAuth = require('./auth');

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
    if (email) {
      // Use lower-case e-mails to avoid case-sensitive e-mail matching
      email = email.toLowerCase();
    }

    // if the user is not already logged in
    if (!req.user) {
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
    // if the user is logged in but has no local account...
    } else if (!req.user.local.email) {
      // ...presumably they're trying to connect a local account
      var user = req.user;
      user.local.email = email;
      user.local.password = user.generateHash(password);
      user.save(function(err) {
        if (err) {
          return done(err);
        }

        return done(null, user);
      });
    } else {
      // user is logged in and already has a local account. Ignore signup.
      // (You should log out before trying to create a new account, user!)
      return done(null, req.user);
    }
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
    if (email) {
      // Use lower-case e-mails to avoid case-sensitive e-mail matching
      email = email.toLowerCase();
    }
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

  /* Facebook Login - Signup */
  passport.use(new FacebookStrategy({
    // pull in our app id and secret from our auth.js file
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret,
    callbackURL: configAuth.facebookAuth.callbackURL,
    passReqToCallback: true
  },
  // facebook will send back the token and profile
  function(req, token, refreshToken, profile, done) {
    if (!req.user) {
      // find the user in the database based on their facebook id
      User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (user) {
          // if there is a user id already but no token (user was linked at one point and then removed)
          // just add our token and profile information (Relinking)
          if (!user.facebook.token) {
            user.facebook.token = token;
            user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
            user.facebook.email = (profile.emails[0].value || '').toLowerCase();

            user.save(function(err) {
              if (err) {
                return done(err);
              }

              return done(null, user);
            });
          }

          return done(null, user);
        }

        // if there is no user found with that facebook id, create them
        var newUser = new User();
        // set all of the facebook information in our user model
        newUser.facebook.id    = profile.id; // set the users facebook id
        newUser.facebook.token = token; // we will save the token that facebook provides to the user
        newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
        newUser.facebook.email = (profile.emails[0].value || '').toLowerCase(); // facebook can return multiple emails so we'll take the first

        // save our user to the database
        newUser.save(function(err) {
          if (err) {
            return done(err);
          }

          // set expiration to one hour
          req.session.cookie.maxAge = 3600000;
          return done(null, newUser);
        });
      });
    } else {
      // user already exists and is logged in, we have to link accounts
      var user = req.user; // pull the user out of the session
      // update the current user's facebook credentials
      user.facebook.id = profile.id;
      user.facebook.token = token;
      user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
      user.facebook.email = (profile.emails[0].value || '').toLowerCase();

      user.save(function(err){
        if (err) {
          return done(err);
        }

        return done(null, user);
      });
    }
  }));

  /* Twitter Login - Signup */
  passport.use(new TwitterStrategy({
    consumerKey: configAuth.twitterAuth.consumerKey,
    consumerSecret: configAuth.twitterAuth.consumerSecret,
    callbackURL: configAuth.twitterAuth.callbackURL,
    passReqToCallback: true
  },
  function(req, token, tokenSecret, profile, done) {
    if (!req.user) {
      // find the user in the database based on their twitter id
      User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (user) {
          // if there is a user id already but no token (user was linked at one point and then removed)
          // just add our token and profile information (Relinking)
          if (!user.twitter.token) {
            user.twitter.token = token;
            user.twitter.username = profile.username;
            user.twitter.displayName = profile.displayName;

            user.save(function(err) {
              if (err) {
                return done(err);
              }

              return done(null, user);
            });
          }

          return done(null, user);
        }

        // if there is no user found with that facebook id, create them
        var newUser = new User();
        // set all of the user data that we need
        newUser.twitter.id = profile.id;
        newUser.twitter.token = token;
        newUser.twitter.username = profile.username;
        newUser.twitter.displayName = profile.displayName;

        // save our user into the database
        newUser.save(function(err){
          if (err) {
            return done(err);
          }

          // set expiration to one hour
          req.session.cookie.maxAge = 3600000;
          return done(null, newUser);
        });
      });
    } else {
      // user already exists and is logged in, we have to link accounts
      var user = req.user; // pull the user out of the session
      // update the current user's twitter credentials
      user.twitter.id = profile.id;
      user.twitter.token = token;
      user.twitter.username = profile.username;
      user.twitter.displayName = profile.displayName;

      user.save(function(err) {
        if (err) {
          return done(err);
        }

        return done(null, user);
      });
    }
  }));

  /* Google Login - Signup */
  passport.use(new GoogleStrategy({
    clientID: configAuth.googleAuth.clientID,
    clientSecret: configAuth.googleAuth.clientSecret,
    callbackURL: configAuth.googleAuth.callbackURL,
    passReqToCallback: true
  },
  function(req, token, refreshToken, profile, done) {
    if (!req.user) {
      User.findOne({ 'google.id': profile.id }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (user) {
          // if there is a user id already but no token (user was linked at one point and then removed)
          // just add our token and profile information (Relinking)
          if (!user.google.token) {
            user.google.token = token;
            user.google.name = profile.displayName;
            user.google.email = (profile.emails[0].value || '').toLowerCase();

            user.save(function(err) {
              if (err) {
                return done(err);
              }

              return done(null, user);
            });
          }

          return done(null, user);
        }

        var newUser = new User();
        // set all of the relevant information
        newUser.google.id = profile.id;
        newUser.google.token = token;
        newUser.google.name = profile.displayName;
        newUser.google.email = (profile.emails[0].value || '').toLowerCase();

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
    } else {
      var user = req.user;
      // update the current user's google credentials
      user.google.id = profile.id;
      user.google.token = token;
      user.google.name = profile.displayName;
      user.google.email = (profile.emails[0].value || '').toLowerCase();

      user.save(function(err) {
        if (err) {
          return done(err);
        }

        return done(null, user);
      });
    }
  }));
};
