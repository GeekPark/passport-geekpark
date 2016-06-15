const parseProfile = require('./profile').parse;
const OAuth2Strategy = require('passport-oauth2');

const baseURL = path => `https://account.geekpark.net/${path}`;

const defaultOptions = {
  scopeSeparator: ',',
  tokenURL: baseURL('oauth2/token'),
  userProfileURL: baseURL('api/v1/user'),
  authorizationURL: baseURL('oauth2/authorize'),
};

class Strategy extends OAuth2Strategy {
  constructor(userOptions = {}, verify) {
    const options = Object.assign({}, defaultOptions, userOptions);
    super(options, verify);

    this.name = 'geekpark';
    this._userProfileURL = options.userProfileURL;
    this._oauth2.useAuthorizationHeaderforGET(true);

    const getOauthAccessToken = this._oauth2.getOauthAccessToken;

    this._oauth2.getOauthAccessToken = (code, params, callback) => {
      getOauthAccessToken.call(this._oauth2, code, params,
        (err, accessToken, refreshToken, param) => {
          if (err) return callback(err);

          if (!accessToken) {
            return callback({
              statusCode: 400,
              data: JSON.stringify(param),
            });
          }

          callback(null, accessToken, refreshToken, param);
        });
    };
  }

  userProfile(accessToken, done) {
    this._oauth2.get(this._userProfileURL, accessToken, (err, body) => {
      let json;

      if (err) {
        return done(new Error(err.data));
      }

      try {
        json = JSON.parse(body);
      } catch (e) {
        return done(new Error('Failed to parse user profile'));
      }

      const profile = parseProfile(json);
      profile.provider = 'geekpark';
      profile._raw = body;
      profile._json = json;

      done(null, profile);
    });
  }
}

module.exports = Strategy;
