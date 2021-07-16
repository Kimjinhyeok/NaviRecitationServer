const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { ExtractJwt, Strategy: JWTStrategy } = require('passport-jwt');
const pgClient = require('../../utils/pgClient');
const crypto = require('crypto');
const { privateKey } = require('../secretPrivateKey');

const passportConfig = {
  usernameField : 'id',
  passwordField : 'pwd'
}
const passportVerify = async (userId, password, done) => {
  try {

    var queryRes = await pgClient.query(`SELECT * FROM users WHERE id = '${userId}'`);
    if (queryRes.rowCount <= 0) {
      done(null, false, { message: "존재하지 않는 사용자 입니다." });
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

const JWTConfig = {
  jwtFromRequest: ExtractJwt.fromHeader('authToken'),
  secretOrKey: privateKey,
};
const JWTVerify = async (jwtPayload, done) => {
  try {
    const existUser = (await pgClient.query(`SELECT COUNT(id) FROM users WHERE obj_id = ${jwtPayload.i}`)).rows[0] > 0;
    if(existUser) {
      done(null, jwtPayload.i);
      return;
    }
    done(null, false, {message : "올바르지 않은 인증정보 입니다."});
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
  passport.use('jwt', new JWTStrategy(JWTConfig, JWTVerify))
}