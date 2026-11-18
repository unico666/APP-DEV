const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const ctrl = require('../controllers/postController');

router.get('/posts', authenticate, ctrl.myPosts);

module.exports = router;
