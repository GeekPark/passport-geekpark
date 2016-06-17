const chai = require('chai');
const util = require('util');
const $require = require('proxyquire');
const GeekParkStrategy = require('../lib/');

describe('Strategy', function() {
  describe('constructed', function() {
    var strategy = new GeekParkStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
    }, function() {});

    it('should be named geekpark', function() {
      expect(strategy.name).to.equal('geekpark');
    });
  })

  describe('constructed with undefined options', function() {
    it('should throw', function() {
      expect(function() {
        new GeekParkStrategy(undefined, function(){});
      }).to.throw(Error);
    });
  })

  describe('constructed with customHeaders option, including User-Agent field', function() {
    var strategy = new GeekParkStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
      customHeaders: { 'User-Agent': 'example.test' },
    }, function() {});

    it('should set user agent as custom header in underlying OAuth 2.0 implementation', function() {
      expect(strategy._oauth2._customHeaders['User-Agent']).to.equal('example.test');
    });
  });

  describe('handling a response with an authorization code', function() {
    const OAuth2Strategy = require('passport-oauth2').Strategy;
    const OAuth2 = require('oauth').OAuth2;

    const MockOAuth2Strategy = function(options, verify) {
      OAuth2Strategy.call(this, options, verify);

      this._oauth2 = new OAuth2(options.clientID,  options.clientSecret,
        '', options.authorizationURL, options.tokenURL, options.customHeaders);

      this._oauth2.getOAuthAccessToken = function(code, options, callback) {
        if (code != 'SplxlOBeZQQYbYS6WxSbIA+ALT1') { return callback(new Error('wrong code argument')); }

        return callback(null, 's3cr1t-t0k3n', undefined, {});
      };
      this._oauth2.get = function(url, accessToken, callback) {
        if (url != 'https://account.geekpark.net/api/v1/user') { return callback(new Error('wrong url argument')); }
        if (accessToken != 's3cr1t-t0k3n') { return callback(new Error('wrong token argument')); }

        const body = require('./fakeuser.json');
        callback(null, JSON.stringify(body), undefined);
      };
    };

    util.inherits(MockOAuth2Strategy, OAuth2Strategy);

    const GeekParkStrategy = $require('../lib/strategy', {
      'passport-oauth2': MockOAuth2Strategy,
    });

    const strategy = new GeekParkStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
    }, function verify(accessToken, refreshToken, profile, done) {
      process.nextTick(function() {
        return done(null, profile);
      })
    });

    let user;

    before(function(done) {
      chai.passport.use(strategy)
        .success(function(u) {
          user = u;
          done();
        })
        .req(function(req) {
          req.query = {};
          req.query.code = 'SplxlOBeZQQYbYS6WxSbIA+ALT1';
        })
        .authenticate({ display: 'mobile' });
    });

    it('should authenticate user', function() {
      expect(user.id).to.equal('1');
      expect(user.nickname).to.equal('geekpark');
    });
  });

  describe('error caused by invalid code sent to token endpoint, with response erroneously indicating success', function() {
    const OAuth2Strategy = require('passport-oauth2').Strategy;
    const OAuth2 = require('oauth').OAuth2;

    var MockOAuth2Strategy = function(options, verify) {
      OAuth2Strategy.call(this, options, verify);

      this._oauth2 = new OAuth2(options.clientID,  options.clientSecret,
        '', options.authorizationURL, options.tokenURL, options.customHeaders);

      this._oauth2.getOAuthAccessToken = function(code, options, callback) {
        return callback(null, undefined, undefined, {
          error: 'Invalid token' });
      };
    }

    util.inherits(MockOAuth2Strategy, OAuth2Strategy);

    const GeekParkStrategy = $require('../lib/strategy', {
      'passport-oauth2': MockOAuth2Strategy,
    });

    var strategy = new GeekParkStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
    }, function() {});


    var err;

    before(function(done) {
      chai.passport.use(strategy)
        .error(function(e) {
          err = e;
          done();
        })
        .req(function(req) {
          req.query = {};
          req.query.code = 'SplxlOBeZQQYbYS6WxSbIA+ALT1';
        })
        .authenticate();
    });

    it('should error', function() {
      expect(err.message).to.equal(JSON.stringify({ error: 'Invalid token' }));
    });
  });
});
