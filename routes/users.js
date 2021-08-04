var express = require('express');
var router = express.Router();
const crypto = require('crypto');
const v1 = require('uuid').v1;
const pgClient = require('../utils/pgClient');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signup', async function(req, res, next) {
  try {
    
    const { pwd, id, name, email, mobile } = req.body;

    const {hashPwd, salt} = await createHashPwd(pwd);

    const query = `INSERT INTO users(name, id, password, salt, email${mobile ? ", mobile" : ""}, obj_id)
    VALUES('${name}','${id}','${hashPwd}','${salt}','${email}' ${mobile ? ",\'" + mobile + "\'" : ''},'${v1()}')`;

    await pgClient.query(query);

    res.status(200).send(true);
  } catch (error) {
    res.status(500).send(error);
  }
})

async function createSalt() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(64, (err, buf) => {
      if(err) {
        reject(err);
      } else {
        resolve(buf.toString('base64'));
      }
    })
  }) 
}
function createHashPwd(password) {
  return new Promise(async (resolve, reject) => {
    let salt = await createSalt();
    crypto.pbkdf2(password, salt, 9999, 64, 'sha512', (err, buf)=> {
      if(err) {
        reject(err);
      } else {
        resolve({salt : salt, hashPwd : buf.toString('base64')});
      }
    })
  })
}

module.exports = router;
