'use strict';

module.exports = function(app, passport) {
  /* Home page (with login links) */
  app.get('/', function(req, res) {
    // if the user is alredy loged in
    if (req.user) {
      return res.redirect('/profile'); // redirect to the profile page
    }

    res.render('index.ejs'); // load the index.ejs file
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
