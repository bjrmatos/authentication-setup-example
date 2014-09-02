'use strict';

module.exports = function(app, passport) {
  /* Home page (with login links) */
  app.get('/', function(req, res) {
    // if the user is alredy loged in
    if (req.user) {
      return res.redirect('/profile');
    }

    res.render('index.ejs');
  });

  /* Login (show the login form) */
  app.get('/login', function(req, res) {
    res.render('login.ejs', { message: req.flash('error') });
  });

  /* Process the login form */
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true // allow flash messages with a key named 'error'
  }));

  /* Signup (show the signup form) */
  app.get('/signup', function(req, res) {
    res.render('signup.ejs', { message: req.flash('error') });
  });

  /* Process the signup form */
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is no error
    failureFlash: true // allow flash messages with a key named 'error'
  }));

  /* Profile Section (we will want this protected so you have to be logged in to visit) */
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', isLoggedIn, function(req, res) {
    res.render('profile.ejs', {
      user: req.user // get the user out of session and pass to template
    });
  });

  /**
  *
  * Facebook Routes
  *
  **/

  // route for facebook authentication and login
  // By default, Facebook will provide you with user information,
  // but not the email address. We will add this by specifying the scope.
  // You can also add in more scopes to access more information,
  // but try to use the fewest permissions that you need.
  // You want your users to feel comfortable about their privacy
  // when logging into and using your application.
  app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: 'email' }));

  // handle the callback after facebook has authenticated the user
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }));

  /**
  *
  * Twitter Routes
  *
  **/

  // route for twitter authentication and login
  app.get('/auth/twitter', passport.authenticate('twitter'));

  // handle the callback after twitter has authenticated the user
  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      successRedirect : '/profile',
      failureRedirect : '/'
    }));

  /**
  *
  * Google Routes
  *
  **/

  // send to google to do the authentication
  // profile gets us their basic information including their name
  // email gets their emails
  app.get('/auth/google',
    passport.authenticate('google', { scope : ['profile', 'email'] }));

  // the callback after google has authenticated the user
  app.get('/auth/google/callback',
    passport.authenticate('google', {
      successRedirect : '/profile',
      failureRedirect : '/'
    }));

  /**
  *
  * Authorize (Alredy logged in / connecting other social account)
  *
  **/

  /* Locally */
  app.get('/connect/local', function(req, res){
    res.render('connect-local.ejs', { message: req.flash('loginMessage') });
  });

  app.post('/connect/local', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/connect/local',
    failureFlash: true
  }));

  /* Facebook */
  // send to facebook to do the authentication
  app.get('/connect/facebook',
    passport.authorize('facebook', { scope : 'email' }));

  // handle the callback after facebook has authorized the user
  app.get('/connect/facebook/callback',
    passport.authorize('facebook', {
      successRedirect : '/profile',
      failureRedirect : '/'
    }));

  /* Twitter */
  // send to twitter to do the authentication
  app.get('/connect/twitter',
    passport.authorize('twitter', { scope : 'email' }));

  // handle the callback after twitter has authorized the user
  app.get('/connect/twitter/callback',
    passport.authorize('twitter', {
      successRedirect : '/profile',
      failureRedirect : '/'
    }));

  /* Google */
  // send to google to do the authentication
  app.get('/connect/google',
    passport.authorize('google', { scope : ['profile', 'email'] }));

  // the callback after google has authorized the user
  app.get('/connect/google/callback',
    passport.authorize('google', {
      successRedirect : '/profile',
      failureRedirect : '/'
    }));

  /**
  *
  * Unlink Accounts
  *
  **/
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  /* Local */
  app.get('/unlink/local', isLoggedIn, function(req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function(err) {
      res.redirect('/profile');
    });
  });

  /* Facebook */
  app.get('/unlink/facebook', isLoggedIn, function(req, res) {
    var user = req.user;
    user.facebook.id = undefined;
    user.facebook.token = undefined;
    user.save(function(err) {
      res.redirect('/profile');
    });
  });

  /* Twitter */
  app.get('/unlink/twitter', isLoggedIn, function(req, res) {
    var user = req.user;
    user.twitter.id = undefined;
    user.twitter.token = undefined;
    user.save(function(err) {
      res.redirect('/profile');
    });
  });

  /* Google */
  app.get('/unlink/google', isLoggedIn, function(req, res) {
    var user = req.user;
    user.google.id = undefined;
    user.google.token = undefined;
    user.save(function(err) {
      res.redirect('/profile');
    });
  });

  /* Logout */
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  /* Show content of cookies and req.user */
  app.get('/example', function(req, res) {
    var foo = {
      cookies: req.cookies,
      signedCookies: req.signedCookies,
      user: req.user
    };

    res.end(JSON.stringify(foo));
  });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    return next();
  }

  // if they aren't, redirect them to the home page
  res.redirect('/');
}
