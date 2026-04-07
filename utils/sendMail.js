const nodemailer = require("nodemailer");

const sendMail = async (email, otp, type = "signup") => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password
    },
  });

  // Dynamic Content Variables
  let subjectText = "";
  let headingText = "";
  let bodyText = "";

  if (type === "signup") {
    subjectText = "Welcome to Replicus - Verification Code";
    headingText = "Verify your email address";
    bodyText = "Welcome to Replicus! To complete your registration and access your secure collaborative terminal, please enter the following verification code:";
  } else if (type === "reset") {
    subjectText = "Replicus Password Reset Request";
    headingText = "Reset your password";
    bodyText = "We received a request to reset the password for your Replicus account. Please enter the following code to proceed. If you didn't request this, you can safely ignore this email.";
  }

  // Replicus Branded HTML Email Template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Replicus System</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #333333;">
      
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 0;">
        <tr>
          <td align="center">
            
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
              
              <tr>
                <td style="background: linear-gradient(90deg, #d8d8d8, #cfc7de); padding: 30px 40px; text-align: center;">
                  <img src="https://drive.google.com/uc?export=view&id=1UKXhK8YGSXH-9DWmjINn--zEj7AMTWd1" alt="Replicus Logo" style="max-height: 150px; display: block; margin: 0 auto;">
                </td>
              </tr>

              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 15px; font-size: 24px; color: #1e293b;">${headingText}</h2>
                  <p style="margin: 0 0 25px; font-size: 16px; color: #64748b; line-height: 1.5;">
                    ${bodyText}
                  </p>

                  <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
                    <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb; font-family: monospace;">
                      ${otp}
                    </span>
                  </div>

                  <p style="margin: 0 0 15px; font-size: 14px; color: #64748b; line-height: 1.5;">
                    This code will expire in <strong>5 minutes</strong>.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

                  <p style="margin: 0; font-size: 13px; color: #94a3b8; text-align: center;">
                    System Alert • Replicus Security Protocol
                  </p>
                </td>
              </tr>

            </table>

            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 20px;">
              <tr>
                <td align="center" style="font-size: 12px; color: #94a3b8;">
                  <p style="margin: 0 0 5px;">&copy; ${new Date().getFullYear()} Replicus Platform. All rights reserved.</p>
                  <p style="margin: 0;">Secure Collaborative Environment</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Replicus Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subjectText, // 🔥 Uses the dynamic subject
    html: htmlTemplate,
  });
};

module.exports = sendMail;