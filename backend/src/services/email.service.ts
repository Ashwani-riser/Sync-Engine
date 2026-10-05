import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
) => {
  console.log("📧 SMTP_USER:", process.env.SMTP_USER);
  console.log(
    "📧 SMTP_PASSWORD exists:",
    !!process.env.SMTP_PASSWORD
  );

  const verificationUrl =
    `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  console.log("🔗 Verification URL:", verificationUrl);

  try {
    const info = await transporter.sendMail({
      from: `"CollabFlow" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify your CollabFlow email",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 40px auto;
          padding: 30px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        ">

          <h1 style="color: #2563eb;">
            Welcome to CollabFlow
          </h1>

          <p>Hi ${name},</p>

          <p>
            Thanks for creating your CollabFlow account.
            Please verify your email address to activate your account.
          </p>

          <div style="margin: 30px 0;">
            <a
              href="${verificationUrl}"
              style="
                display: inline-block;
                padding: 12px 24px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              "
            >
              Verify Email
            </a>
          </div>

          <p style="color: #64748b; font-size: 14px;">
            This verification link expires in 30 minutes.
          </p>

          <p style="color: #64748b; font-size: 14px;">
            If you did not create this account, you can safely ignore this email.
          </p>

        </div>
      `,
    });

    console.log("✅ Email sent:", info.messageId);

  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};