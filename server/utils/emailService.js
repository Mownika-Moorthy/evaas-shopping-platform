import nodemailer from 'nodemailer';

/**
 * Send an OTP verification email to the administrator.
 * Gracefully falls back to console logging if SMTP is not yet configured in .env.
 */
export const sendAdminOtpEmail = async (toEmail, otp) => {
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);

  // Always log to console for development visibility
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔐 [ADMIN 2FA OTP] Email: ${toEmail}`);
  console.log(`👉 Verification Code: ${otp}`);
  console.log(`⏰ Valid for: 5 minutes`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // If SMTP credentials are not configured, return fallback status
  if (!emailUser || !emailPass) {
    console.log('ℹ️  SMTP credentials (EMAIL_USER / EMAIL_PASS) not configured in .env. OTP logged to console above.');
    return {
      success: true,
      sentViaSmtp: false,
      message: 'OTP generated and logged to server console (SMTP not configured).'
    };
  }

  try {
    // Clean password (users often copy 16-character Google App Passwords with spaces like 'abcd efgh ijkl mnop')
    const cleanPass = emailPass ? emailPass.replace(/\s+/g, '') : '';

    const transportConfig = emailHost.includes('gmail') || emailUser.endsWith('@gmail.com')
      ? {
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: cleanPass
          }
        }
      : {
          host: emailHost,
          port: emailPort,
          secure: emailPort === 465,
          auth: {
            user: emailUser,
            pass: cleanPass
          }
        };

    const transporter = nodemailer.createTransport(transportConfig);

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #160D33; border: 1px solid #3B246B; border-radius: 16px; overflow: hidden; color: #ffffff;">
        <div style="background: linear-gradient(135deg, #2D1B69 0%, #1E1238 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #3B246B;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">EVAAS WOMEN'S WEAR</h1>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #C79AF0; font-weight: 600; letter-spacing: 0.5px;">ADMIN SECURITY VERIFICATION</p>
        </div>
        
        <div style="padding: 32px 28px; background-color: #1E1238;">
          <p style="margin: 0 0 16px 0; font-size: 15px; color: #E5E7EB; line-height: 1.5;">
            Hello Administrator,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 14px; color: #AFA3BF; line-height: 1.6;">
            A sign-in request was initiated for your Evaas Admin & Seller Central account. Use the following One-Time Password (OTP) to complete verification:
          </p>

          <div style="background-color: #160D33; border: 2px dashed #9B59D6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #9B59D6; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #9CA3AF;">This code will expire in <strong style="color: #F87171;">5 minutes</strong>.</p>
          </div>

          <div style="background-color: rgba(239, 68, 68, 0.1); border-left: 3px solid #EF4444; padding: 12px 16px; border-radius: 6px; margin: 24px 0 16px 0;">
            <p style="margin: 0; font-size: 12px; color: #FCA5A5; line-height: 1.5;">
              ⚠️ <strong>Security Note:</strong> Never share this code with anyone. Evaas administrators or support will never ask for your verification code.
            </p>
          </div>

          <p style="margin: 24px 0 0 0; font-size: 12px; color: #6B7280; line-height: 1.5; text-align: center;">
            If you did not attempt to sign in to the Admin Dashboard, please immediately change your password.
          </p>
        </div>

        <div style="background-color: #110B24; padding: 16px; text-align: center; border-top: 1px solid #2D1B69;">
          <p style="margin: 0; font-size: 11px; color: #6B7280;">
            &copy; ${new Date().getFullYear()} Evaas Shopping Platform. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Evaas Admin Security" <${emailUser}>`,
      to: toEmail,
      subject: `🔐 ${otp} is your Evaas Admin Verification Code`,
      text: `Your Evaas Admin OTP is: ${otp}. It expires in 5 minutes. Do not share this code.`,
      html: htmlContent
    });

    console.log(`✅ Admin OTP successfully sent via SMTP to ${toEmail}`);
    return {
      success: true,
      sentViaSmtp: true,
      message: 'OTP has been dispatched to your email address.'
    };
  } catch (error) {
    console.error('❌ Failed to send OTP email via SMTP:', error.message);
    return {
      success: true,
      sentViaSmtp: false,
      message: 'SMTP delivery failed; OTP logged to server console.'
    };
  }
};
