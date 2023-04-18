const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const postCtrl = require('../controllers/posts');

router.post('/posts', auth, multer, postCtrl.createPost);
router.put('/posts/:id', auth, multer, postCtrl.modifyPost);
router.delete('/posts/:id', auth, postCtrl.deletePost);
router.get('/posts/:id', auth, postCtrl.getOnePost);
router.get('/posts/', auth, postCtrl.getAllPosts);
router.get('/posts/from/:country', auth, postCtrl.getPostsCountry);
router.get('/posts/by/:userId', auth, postCtrl.getPostsUser);
router.post('/posts/:id/like', auth, postCtrl.ratingPost);

module.exports = router;