var express = require('express');
var router = express.Router();
const crypto = require('crypto');
const v1 = require('uuid').v1;
const pgClient = require('../utils/pgClient');
const {
  createSalt,
  createHashPwd,
}  = require('../utils/encode');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', async function(req, res, next) {
  try {
    
    const { password : pwd, id, name, email, mobile } = req.body;

    const salt = await createSalt();
    const hashPwd = await createHashPwd(pwd, salt);

    const query = `INSERT INTO users(name, id, password, salt, email${mobile ? ", mobile" : ""}, obj_id)
    VALUES('${name}','${id}','${hashPwd}','${salt}','${email}' ${mobile ? ",\'" + mobile + "\'" : ''},'${v1()}')`;

    await pgClient.query(query);

    res.status(200).send(true);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
})

module.exports = router;
