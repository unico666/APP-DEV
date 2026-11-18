const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../db');

const VALID_ROLES = ['reader', 'author', 'admin'];
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), username: user.username, role: user.role, type: 'access' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
  );
}

function signRefreshToken(user, days) {
  // jti makes every refresh token unique (token_hash is UNIQUE)
  return jwt.sign(
    { sub: String(user.id), type: 'refresh', jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${days}d` }
  );
}

// POST /register  -> 201 | 400 | 409
exports.register = async (req, res, next) => {
  try {
    const { username, password, role, email } = req.body || {};
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'username, password and role are required' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'role must be reader, author or admin' });
    }

    const [dupe] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (dupe.length) return res.status(409).json({ error: 'Username already taken' });

    const userEmail = email || `${username}@blog.local`;
    const [dupeEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [userEmail]);
    if (dupeEmail.length) return res.status(409).json({ error: 'Email already taken' });

    const [roleRows] = await pool.query('SELECT id FROM roles WHERE role = ?', [role]);
    if (!roleRows.length) return res.status(400).json({ error: 'role is not configured in the database' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, username, password_hash, role_id) VALUES (?, ?, ?, ?)',
      [userEmail, username, hash, roleRows[0].id]
    );

    res.status(201).json({ id: result.insertId, username, role });
  } catch (err) {
    next(err);
  }
};

// POST /login -> 200 | 400 | 401
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.password_hash, u.is_active, r.role
         FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.username = ?`,
      [username]
    );
    const user = rows[0];
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Wrong credentials' });
    }

    const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 7;
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user, days);

    // Store only the hash of the refresh token
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [user.id, sha256(refreshToken), days]
    );

    res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

// POST /refresh -> 200 | 400 | 401
exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = (req.body && req.body.refreshToken) || (req.cookies && req.cookies.refreshToken);
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    if (payload.type !== 'refresh') return res.status(401).json({ error: 'Invalid token type' });

    const [rows] = await pool.query(
      `SELECT rt.id, u.id AS user_id, u.username, u.is_active, r.role
         FROM refresh_tokens rt
         JOIN users u ON u.id = rt.user_id
         JOIN roles r ON r.id = u.role_id
        WHERE rt.token_hash = ? AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
      [sha256(refreshToken)]
    );
    const row = rows[0];
    if (!row || !row.is_active) {
      return res.status(401).json({ error: 'Refresh token revoked or expired' });
    }

    const accessToken = signAccessToken({ id: row.user_id, username: row.username, role: row.role });
    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
};

// POST /logout -> 200 | 400
exports.logout = async (req, res, next) => {
  try {
    const refreshToken = (req.body && req.body.refreshToken) || (req.cookies && req.cookies.refreshToken);
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

    // Set revoked_at and overwrite token_hash so the stored reference to the
    // token is cleared (the column is NOT NULL, so we replace it with a random hash).
    await pool.query(
      `UPDATE refresh_tokens
          SET revoked_at = NOW(), token_hash = ?
        WHERE token_hash = ? AND revoked_at IS NULL`,
      [sha256(crypto.randomUUID()), sha256(refreshToken)]
    );

    res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};
