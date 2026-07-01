import nodemailer from "nodemailer";

const isProduction = () => process.env.NODE_ENV === "production";
const configured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

const purposeLabel = (purpose) => {
  if (purpose === "password_reset") return "password reset";
  if (purpose === "login_verification") return "login";
  return "verification";
};

export const sendOtpEmail = async ({ to, otp, purpose }) => {
  const ttl = Number.parseInt(process.env.OTP_TTL_MINUTES || "10", 10);
  const from = process.env.OTP_EMAIL_FROM || "ClutchQ <no-reply@example.com>";

  if (!configured()) {
    if (isProduction()) {
      console.error("OTP email send failed: SMTP is not configured.");
      throw new Error("SMTP is not configured.");
    }
    console.log(`DEV OTP for ${to}: ${otp}`);
    return { skipped: true, reason: "smtp_not_configured" };
  }

  const label = purposeLabel(purpose);
  try {
    await createTransport().sendMail({
      from,
      to,
      subject: "ClutchQ verification code",
      text: [
        `Your ClutchQ ${label} code is:`,
        "",
        otp,
        "",
        `This code expires in ${ttl} minutes.`,
        "If you did not request this, ignore this email."
      ].join("\n")
    });
    if (!isProduction()) console.log(`OTP email queued for ${to}`);
  } catch (error) {
    console.error(`OTP email send failed: ${error.code || error.message || "smtp_error"}`);
    throw error;
  }

  return { skipped: false };
};

export const sendTestEmail = async ({ to }) => {
  const from = process.env.OTP_EMAIL_FROM || "ClutchQ <no-reply@example.com>";

  if (!configured()) {
    throw new Error("SMTP is not configured.");
  }

  await createTransport().sendMail({
    from,
    to,
    subject: "ClutchQ email test",
    text: "If you received this, SMTP is working."
  });

  return { success: true };
};
