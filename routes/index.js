var express = require('express');
var router = express.Router();
var rc = require('./recitation');
var auth = require('./auth');
var user = require('./users');

/* GET home page. */

router.use('/RC', rc);
router.use('/auth', auth);
router.use('/user', user)

module.exports = router;
