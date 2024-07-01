
const pgClient = require('../../utils/pgClient');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createSalt, createHashPwd } = require('../../utils/encode');

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
    throw new Error("올바른 접근의 사용자가 아닙니다.");
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
  
  if(result instanceof Error) {
    throw result;
  }
  return result == user.password;
}
const getLoggedInUserCondition = async (req) => {
  
  const { cookies } = req;
  const {authtoken = ''} = cookies;
  
  if(!cookies || !authtoken) {
    throw new Error("로그인 정보를 찾을 수 없습니다.");
  }
  
  const decoded = jwt.decode(authtoken);

  const userId = decoded.i;

  if(!userId) {
    throw new Error("올바른 접근의 사용자가 아닙니다.");
  }

  return `obj_id = '${userId}'`
}
const getLostPwdUserCondition = async (req) => {
  const {
    token
  } = req.body;

  try {
    const decoded = jwt.decode(token);
  
    const email = decoded.email;
  
    if(!email) {
      throw new Error("올바른 접근의 사용자가 아닙니다.");
    }

    return `email = '${email}'`
  } catch (error) {
    throw error;
  }
}
const changePassword = async (req, res, next) => {
  const {
    password, passwordRepeat, token
  } = req.body;

  if(!password || !passwordRepeat) {
    throw new Error("비밀번호가 정확하지 않습니다.");
  }

  if(!password) {
    throw new Error("비밀번호를 입력해주세요.");
  }
  
  try {
    const condition = await (token ? getLostPwdUserCondition(req) : getLoggedInUserCondition(req));
    
    const newSalt = await createSalt();
    const encodedPassword = await createHashPwd(password, newSalt);

    const result = await pgClient.query(`
      UPDATE users 
      SET password = '${encodedPassword}', salt = '${newSalt}'
      WHERE ${condition}
    `);

    return result.rowCount > 0;
    
  } catch (error) {
    return error;
  }
}

module.exports = {
  comparePassword,
  changePassword,
}