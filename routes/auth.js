const pgClient = require('../utils/pgClient');
var router = require('express').Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const {privateKey} = require('../src/secretPrivateKey');

router.post('/password', (req, res, next) => {
  try {
    
  } catch (error) {
    res.status(error.code).send(error.message)
  }
});
router.post('/', async (req, res, next) => {
  try {
    passport.authenticate('local', async (error, user, info) => {
      if(error || !user) {
        res.status(400).send(info);
        return;
      }
      req.login(user, {session : false}, (loginError) => {
        if(loginError) {
          res.send(loginError);
          return;
        }
        const token = jwt.sign({
          u_n : user.name,
          i : user.obj_id
        }, privateKey, {
          expiresIn : "7"
        });
        res.cookie('authtoken', token, {
          expires : new Date(Date.now() + (1000 * 60 * 60 * 24 * 30))
        })
        res.status(200).send(user.name);
      })
    })(req, res, next);
  } catch (error) {
    console.error(error);
    res.status(error.code).send(error.message)
  }
})
router.delete('/', (req, res, next) => {
  try {
    
  } catch (error) {
    res.status(error.code).send(error.message)
  }
})



function returnErrorMessage(code, message) {
  return (
    code,
    message
  )
}
module.exports = router;