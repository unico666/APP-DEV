const jwt = require('jsonwebtoken');

// Verifies "Authorization: Bearer <token>" with the shared secret.
// Never calls the Auth Server. Sets req.user, otherwise 401.
module.exports = function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (payload.type === 'refresh') {
      return res.status(401).json({ error: 'Refresh tokens are not accepted here' });
    }
    req.user = { id: Number(payload.sub), username: payload.username, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
