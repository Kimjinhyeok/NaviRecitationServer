require('dotenv').config();

const { sendEmail } = require('../config/stms');
const {readFile} = require('fs/promises');
const {privateKey} = require('../secretPrivateKey');
const path = require('path');
const jwt = require('jsonwebtoken');

const sendChangeEmail = async function(req, res, next) {
 
  const {email} = req.body;

  if(!email) throw new Error("이메일을 입력해주세요.");

  const html = await readFile(path.join(__dirname, '../htmlTemplate/change_password.html'), 'utf-8');

  const token = jwt.sign({
    email : email,
  }, privateKey, {
    expiresIn : "10m"
  }); 
  const WEB_URL = process.env.WEB_URL;
  
  const PwdChangeUrl = `http://${WEB_URL}/reset/password?token=${token}`;

  const convertedHtml = html.replace("#URL", PwdChangeUrl);
  const emailResult = await sendEmail("비밀번호 변경 안내", {html : convertedHtml}, email);

  return emailResult
}

module.exports = {
  sendChangeEmail,
}