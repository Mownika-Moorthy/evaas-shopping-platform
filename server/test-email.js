import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();

const emailUser = process.env.EMAIL_USER;
const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

console.log('Testing email configuration:');
console.log('EMAIL_USER:', emailUser);
console.log('EMAIL_PASS length:', emailPass ? emailPass.length : 0);

if (!emailUser || !emailPass) {
  console.error('❌ EMAIL_USER or EMAIL_PASS missing in .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

transporter.verify((err, success) => {
  if (err) {
    console.error('\n❌ SMTP Verification Failed:');
    console.error(err.message);
    if (err.message.includes('535') || err.message.includes('BadCredentials')) {
      console.error('\n👉 CAUSE: Google rejected your regular account password.');
      console.error('👉 SOLUTION: You must use a 16-character Google "App Password", not your normal login password.');
      console.error('👉 Generate one at: https://myaccount.google.com/apppasswords');
    }
    process.exit(1);
  } else {
    console.log('\n✅ Gmail SMTP Connected Successfully!');
    console.log('Sending a test email to:', emailUser);

    transporter.sendMail({
      from: `"Evaas Admin" <${emailUser}>`,
      to: emailUser,
      subject: 'Evaas Admin Email Setup - Verification Success!',
      text: 'Congratulations! Real email delivery is working for Evaas Admin 2FA.'
    }, (sendErr, info) => {
      if (sendErr) {
        console.error('Send error:', sendErr.message);
        process.exit(1);
      } else {
        console.log('✅ Test email delivered successfully! Message ID:', info.messageId);
        process.exit(0);
      }
    });
  }
});
