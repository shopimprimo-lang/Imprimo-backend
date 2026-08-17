const passport = require('passport');

const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication error' });
    }

    if (!user) {
      // info carries the real reason ("jwt expired", "No auth token", ...) — surface it
      // so an expired session is distinguishable from a genuinely bad token.
      const reason = info && info.message ? info.message : 'You are not authorized';
      return res.status(401).json({ error: reason, expired: reason === 'jwt expired' });
    }

    req.user = user;
    next();
  })(req, res, next);
};

module.exports = auth;
