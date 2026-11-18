const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const ctrl = require('../controllers/postController');

// Public (no authenticate)
router.get('/', ctrl.listPosts);
router.get('/:id', ctrl.getPost);

// Protected (authenticate applied per route)
router.post('/', authenticate, authorize('author', 'admin'), ctrl.createPost);
router.put('/:id', authenticate, ctrl.updatePost); // owner-or-admin check is in the controller
router.delete('/:id', authenticate, authorize('admin'), ctrl.deletePost);

module.exports = router;
