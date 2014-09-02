
// expose our config directly to our application using module.exports
module.exports = {
  'facebookAuth': {
    'clientID': '394505474024747', // App ID
    'clientSecret': 'bb426764807afe23ca747802e69e7c91', // App secret
    'callbackURL': 'http://localhost:8080/auth/facebook/callback'
  },
  'twitterAuth': {
    'consumerKey': 'aFRcGJiNP6sq3Al0O0O3Z1hdL', // API Key
    'consumerSecret': 'rz3asM6fbB0otKFVfgS81W45ZrKt2MhDXdq6bXGat7gsKWOpjD', // API Secret
    'callbackURL': 'http://localhost:8080/auth/twitter/callback'
  },
  'googleAuth': {
    'clientID': '708276537111-ihqd4jh7ms6g9vrcq8vsvq00jh7imcob.apps.googleusercontent.com', //
    'clientSecret': 'BGLnm-_J7ZgCU8xWUAgSz5A9', //
    'callbackURL': 'http://localhost:8080/auth/google/callback'
  }
};
