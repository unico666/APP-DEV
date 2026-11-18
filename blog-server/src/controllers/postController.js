const pool = require('../../db');

const SELECT_POST = `
  SELECT p.id, p.title, p.content, p.author_id AS authorId, u.username AS author,
         p.created_at AS createdAt, p.updated_at AS updatedAt
    FROM posts p JOIN users u ON u.id = p.author_id`;

// GET /api/posts (public)
exports.listPosts = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${SELECT_POST} ORDER BY p.created_at DESC, p.id DESC`);
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/:id (public) -> 200 | 404
exports.getPost = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${SELECT_POST} WHERE p.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Post not found' });
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// POST /api/posts (author, admin) -> 201 | 400 | 401 | 403
exports.createPost = async (req, res, next) => {
  try {
    const { title, content } = req.body || {};
    if (!title || !content) return res.status(400).json({ error: 'title and content are required' });

    // authorId always comes from the token, never from the body
    const [result] = await pool.query(
      'INSERT INTO posts (author_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title, content]
    );
    const [rows] = await pool.query(`${SELECT_POST} WHERE p.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// PUT /api/posts/:id (owner or admin) -> 200 | 400 | 401 | 403 | 404
exports.updatePost = async (req, res, next) => {
  try {
    const [found] = await pool.query('SELECT id, author_id FROM posts WHERE id = ?', [req.params.id]);
    if (!found.length) return res.status(404).json({ error: 'Post not found' });

    // Ownership check: post author or admin
    const isOwner = found[0].author_id === req.user.id;
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: you do not own this post' });
    }

    const { title, content } = req.body || {};
    if (title === undefined && content === undefined) {
      return res.status(400).json({ error: 'Provide title or content to update' });
    }
    if ((title !== undefined && !String(title).trim()) || (content !== undefined && !String(content).trim())) {
      return res.status(400).json({ error: 'title and content cannot be empty' });
    }

    await pool.query('UPDATE posts SET title = COALESCE(?, title), content = COALESCE(?, content) WHERE id = ?', [
      title ?? null,
      content ?? null,
      req.params.id,
    ]);
    const [rows] = await pool.query(`${SELECT_POST} WHERE p.id = ?`, [req.params.id]);
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/posts/:id (admin) -> 200 | 401 | 403 | 404
exports.deletePost = async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Post not found' });
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/me/posts (any logged-in user) -> 200 | 401
exports.myPosts = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${SELECT_POST} WHERE p.author_id = ? ORDER BY p.created_at DESC, p.id DESC`, [
      req.user.id,
    ]);
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};
