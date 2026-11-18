// Optional: npm run seed  -> creates demo users (password: password123)
const bcrypt = require('bcryptjs');
const pool = require('./db');

(async () => {
  const demo = [
    ['admin', 'admin@blog.local', 'admin'],
    ['author1', 'author1@blog.local', 'author'],
    ['reader1', 'reader1@blog.local', 'reader'],
  ];
  const hash = await bcrypt.hash('password123', 10);
  for (const [username, email, role] of demo) {
    const [r] = await pool.query('SELECT id FROM roles WHERE role = ?', [role]);
    await pool.query(
      'INSERT IGNORE INTO users (email, username, password_hash, role_id) VALUES (?, ?, ?, ?)',
      [email, username, hash, r[0].id]
    );
  }
  console.log('Seeded: admin, author1, reader1 (password: password123)');
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
