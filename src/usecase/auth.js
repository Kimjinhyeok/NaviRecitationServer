
const pgClient = require('../../utils/pgClient');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')

const comparePassword = async (req, res, next) => {

  const { cookies } = req;
  const { password } = req.body;
  const {authtoken = ''} = cookies;

  if(!cookies || !authtoken) {
    return new Error("로그인 정보를 찾을 수 없습니다.");
  } else if(!password) {
    return new Error("비밀번호를 입력해주세요.");
  }

  const decoded = jwt.decode(authtoken);

  const userId = decoded.i;

  if(!userId) {
    return new Error("올바른 접근의 사용자가 아닙니다.");
  }
  
  const queryRes = await pgClient.query(`SELECT * FROM users WHERE obj_id = '${userId}'`);
  if (queryRes.rowCount <= 0) {
    throw new Error("ID 또는 비밀번호가 일치하지 않습니다.");
  }

  const user = queryRes.rows[0];
  const userSalt = user.salt;

  const result = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, userSalt, 9999, 64, 'sha512', (err, buf) => {
      if (err) {
        reject(err);
      } else {
        resolve(buf.toString('base64'));
      }
    })
  })
  
  return result == user.password;
}

module.exports = {
  comparePassword
}