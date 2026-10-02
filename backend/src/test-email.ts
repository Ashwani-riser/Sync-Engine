import "dotenv/config";
import { sendVerificationEmail } from "./services/email.service";

const test = async () => {
  try {
    await sendVerificationEmail(
      "ashwanikr22222@gmail.com",
      "Ashwani",
      "test-token-123"
    );

    console.log("✅ Test email sent successfully");
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
};

test();