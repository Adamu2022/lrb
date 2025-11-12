const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: 'alamindabo@naub.edu.ng', // e.g., smtp.gmail.com
  port: 465,
  secure: false, // true for port 465, false for 587
  auth: {
    user: 'abumaryamalbarwi@gmail.com',
    pass: 'auipmcwuaxuzozra',
  },
});

// Email options
const mailOptions = {
  from: '"Lecture Reminder System" <noreply@university.edu>',
  to: 'abumaryamalbarwi@gmail.com',
  subject: 'Test Email',
  text: 'Hello, this is a test email sent using Nodemailer!',
};

// Send email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log('Error:', error);
  }
  console.log('Email sent:', info.response);
});
