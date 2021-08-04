const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy : CustomStrategy } = require('passport-custom');
const pgClient = require('../../utils/pgClient');
const crypto = require('crypto');
const { privateKey } = require('../secretPrivateKey');
const jwt = require('jsonwebtoken');

const passportConfig = {
  usernameField : 'id',
  passwordField : 'pwd'
}
const passportVerify = async (userId, password, done) => {
  try {

    var queryRes = await pgClient.query(`SELECT * FROM users WHERE id = '${userId}'`);
    if (queryRes.rowCount <= 0) {
      done(null, false, { message: "ID 또는 비밀번호가 일치하지 않습니다." });
      return;
    }

    const user = queryRes.rows[0];

    var decodedPassword = await decodePassword(password, user.salt);
    
    if (user.password === decodedPassword) {
      done(null, user);
    } else {
      done(null, false, {message : "ID 또는 비밀번호가 일치하지 않습니다."})
    }
    return;

  } catch (error) {
    console.error(error);
    done(error);
  }
}

const CustomVerify = async (req, done) => {
  try {
    var {authtoken} = req.cookies;
    if(!authtoken) {
      done(null, false, {message : "로그인이 필요한 기능입니다."});
      return;
    }
    var decoded = jwt.decode(authtoken);
    done(null, decoded);
  } catch (error) {
    console.error(error);
    done(error);
  }
}
function decodePassword(inputPassword, userSalt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(inputPassword, userSalt, 9999, 64, 'sha512', (err, buf) => {
      if (err) {
        reject(err);
      } else {
        resolve(buf.toString('base64'));
      }
    })
  })
}

module.exports = () => {
  passport.use('local', new LocalStrategy(passportConfig, passportVerify));
  passport.use('custom', new CustomStrategy(CustomVerify))
}