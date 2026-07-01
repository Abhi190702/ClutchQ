import api from "./api";

export const requestOtp = ({ email, purpose = "email_verification", turnstileToken }) =>
  api.post("/auth/otp/request", { email, purpose, turnstileToken });

export const verifyOtp = ({ email, purpose = "email_verification", otp }) =>
  api.post("/auth/otp/verify", { email, purpose, otp });

export const forgotPassword = ({ email, turnstileToken }) =>
  api.post("/auth/password/forgot", { email, turnstileToken });

export const resetPassword = ({ email, otp, newPassword }) =>
  api.post("/auth/password/reset", { email, otp, newPassword });
