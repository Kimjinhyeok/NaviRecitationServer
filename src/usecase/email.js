const { sendEmail } = require('../config/stms');
const {readFile} = require('fs/promises');
const path = require('path');

const sendChangeEmail = async function(req, res, next) {
 
  const {email} = req.body;

  if(!email) throw new Error("이메일을 입력해주세요.");

  const result = await readFile(path.join(__dirname, '../htmlTemplate/change_password.html'), 'utf-8');

  // console.log(result.find("%URL%"));
  const emailResult = await sendEmail("비밀번호 변경 안내", {html : result}, email);

  return emailResult
}

module.exports = {
  sendChangeEmail,
}