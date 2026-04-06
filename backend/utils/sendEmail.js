const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();
    console.log('SMTP connected successfully');

    await transporter.sendMail({
      from: `"LeaveMS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log('Email sent to:', to);
  } catch (err) {
    console.log('Email error details:', err.message);
  }
};

module.exports = sendEmail;