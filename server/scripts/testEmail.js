import dotenv from "dotenv";
import { sendTestEmail } from "../services/emailService.js";

dotenv.config();

const to = process.argv[2];

if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
  console.error("Usage: node scripts/testEmail.js your-email@example.com");
  process.exit(1);
}

try {
  await sendTestEmail({ to });
  console.log("Test email sent successfully.");
} catch (error) {
  console.error(`Test email failed: ${error.message}`);
  process.exit(1);
}
