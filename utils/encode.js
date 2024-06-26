const crypto = require('crypto');

const createSalt = async () => {
  const result = await new Promise((resolve, reject) => {
    crypto.randomBytes(64, (err, buf) => {
      if(err) {
        reject(err);
      } else {
        resolve(buf);
      }
    })
  });

  if(result instanceof Error) {
    throw result;
  } else {
    return result.toString('base64')
  }
}

const createHashPwd = async (password = "", salt = ()=>{throw new Error("[Error] SALT must be existed!")}) => {
  const result = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 9999, 64, 'sha512', (err, buf)=> {
      if(err) {
        reject(err);
      } else {
        resolve(buf);
      }
    })
  });

  if(result instanceof Error) {
    throw result;
  }
  return result.toString('base64');
}
module.exports = {
  createSalt,
  createHashPwd
}