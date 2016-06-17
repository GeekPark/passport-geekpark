passport-geekpark
------------

[![Build Status](https://api.travis-ci.org/GeekPark/passport-geekpark.svg)](https://travis-ci.org/GeekPark/passport-geekpark) [![Npm Status](https://img.shields.io/npm/v/passport-geekpark.svg)](https://www.npmjs.com/package/passport-geekpark) [![dependencies](https://david-dm.org/geekpark/passport-geekpark.svg)](https://david-dm.org/geekpark/passport-geekpark)

Official passport strategy for authenticating to GeekPark, base on [passportjs](http://passportjs.org/).

# Usage
1. register an application at geekpark.net
2. `npm i passport-geekpark --save`
3. config passport (id, secret, callback url)

# Example
```javascript
const passport = require('koa-passport');
const config = require('./index');

const GeekParkStrategy = require('../passport-geekpark');

module.exports = () => {
  const User = require('../models/user');

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findOne({ id }).then(d => done(null, d));
  });

  passport.use(
    new GeekParkStrategy({
      clientID: config.oauth.id,
      clientSecret: config.oauth.secret,
      callbackURL: config.oauth.callback,
    }, (token, tokenSecret, profile, done) => {
      done(null, profile);
    })
  );
};
```

### License ([MIT](http://opensource.org/licenses/MIT))
