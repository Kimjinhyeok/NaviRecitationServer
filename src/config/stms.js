require('dotenv').config();
const nodemailer = require('nodemailer');

const transper = nodemailer.createTransport({
  service: 'Naver',
  host : 'smtp.naver.com',
  port : '587',
  auth : {
    user : process.env.EMAIL_USER,
    pass : process.env.EMAIL_PASS,
  }
})


const sendEmail = async function(subject, content, target, ...otp) {
  try {
    const result = await transper.sendMail({
      from : process.env.EMAIL_USER,
      to : target,
      subject : subject,
      text : content,
    });
    return true;
  } catch (error) {
    return error;
  }
}


module.exports = {
  sendEmail,
}