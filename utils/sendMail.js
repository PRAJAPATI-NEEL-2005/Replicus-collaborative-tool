const nodemailer = require("nodemailer");

const sendMail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Replicus OTP Verification",
    html: `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes</p>`
  });
};

module.exports = sendMail;