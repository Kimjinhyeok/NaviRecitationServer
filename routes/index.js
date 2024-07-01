var express = require('express');
var router = express.Router();
var rc = require('./recitation');
var auth = require('./auth');
var user = require('./users');
var resource = require('./resource');
var exam = require('./exam');

/* GET home page. */

router.use('/RC', rc);
router.use('/auth', auth);
router.use('/user', user);
router.use('/resource', resource);
router.use('/exam', exam);

module.exports = router;
