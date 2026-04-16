import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173';

const PENDING_SIGNUPS_KEY = 'smartcampus_pending_signups';
const VERIFIED_USERS_KEY = 'smartcampus_verified_users';
const RESET_TOKENS_KEY = 'smartcampus_reset_tokens';
const SIGNUP_CODES_KEY = 'smartcampus_signup_codes';
const RESET_CODES_KEY = 'smartcampus_reset_codes';
const SIGNUP_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const RESET_TOKEN_TTL_MS = 1000 * 60 * 20; // 20 minutes
const CODE_TTL_MS = 1000 * 60 * 10; // 10 minutes

const readStorage = (key, fallbackValue) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

const generateToken = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now()}${Math.random().toString(36).slice(2)}`;
};

const ensureEmailJsConfigured = () => {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error('Email service is not configured. Please set EmailJS environment variables.');
  }
};

const sendEmail = async ({ toEmail, itNumber, title, message }) => {
  ensureEmailJsConfigured();
  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: toEmail,
        it_number: itNumber,
        title,
        message,
      },
      EMAILJS_PUBLIC_KEY
    );
  } catch (error) {
    const status = error?.status;
    const text = error?.text || error?.message || '';
    const normalized = String(text).toLowerCase();
    if (status === 400 && normalized.includes('service id not found')) {
      throw new Error(
        'EmailJS service ID is invalid. Update VITE_EMAILJS_SERVICE_ID in frontend/.env from your EmailJS dashboard.'
      );
    }
    if (status === 403 || normalized.includes('origin')) {
      throw new Error('EmailJS blocked this request. Add http://localhost:5173 in EmailJS allowed origins.');
    }
    throw new Error(`Failed to send email (${status || 'unknown'}): ${text || 'Unknown EmailJS error'}`);
  }
};

const cleanupExpiredEntries = (key) => {
  const now = Date.now();
  const items = readStorage(key, []);
  const active = items.filter((item) => Number(item.expiresAt) > now);
  if (active.length !== items.length) {
    writeStorage(key, active);
  }
  return active;
};

const getVerifiedUsers = () => readStorage(VERIFIED_USERS_KEY, []);
const setVerifiedUsers = (users) => writeStorage(VERIFIED_USERS_KEY, users);

export const sendVerificationEmail = async ({ toEmail, itNumber, fullName, token }) => {
  const verificationLink = `${APP_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const message = `Hello ${fullName || itNumber},\n\nClick this link to verify your email:\n${verificationLink}\n\nThis link expires in 24 hours.\n\nRegards,\nCRMS Team\n\nRegards,\nStudyNest Team`;
  await sendEmail({
    toEmail: normalizeEmail(toEmail),
    itNumber,
    title: 'StudyNest Account Verification',
    message,
  });
};

export const sendSignupVerificationCode = async ({ itNumber, fullName, email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const code = generateCode();
  const now = Date.now();

  const pendingCodes = cleanupExpiredEntries(SIGNUP_CODES_KEY).filter((item) => item.email !== normalizedEmail);
  pendingCodes.push({
    code,
    itNumber,
    fullName: String(fullName || '').trim(),
    email: normalizedEmail,
    password,
    createdAt: now,
    expiresAt: now + CODE_TTL_MS,
  });
  writeStorage(SIGNUP_CODES_KEY, pendingCodes);

  try {
    await sendEmail({
      toEmail: normalizedEmail,
      itNumber,
      title: 'StudyNest Email Verification Code',
      message: `Hello ${fullName || itNumber},\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nRegards,\nCRMS Team\n\nRegards,\nStudyNest Team`,
    });
  } catch (error) {
    writeStorage(
      SIGNUP_CODES_KEY,
      pendingCodes.filter((item) => item.email !== normalizedEmail)
    );
    throw error;
  }
};

export const verifySignupCode = ({ email, code }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = String(code || '').trim();
  const pendingCodes = cleanupExpiredEntries(SIGNUP_CODES_KEY);
  const pending = pendingCodes.find((item) => item.email === normalizedEmail);

  if (!pending) {
    throw new Error('Verification code expired or not found. Please resend code.');
  }
  if (pending.code !== normalizedCode) {
    throw new Error('Invalid verification code.');
  }

  const verifiedUsers = getVerifiedUsers().filter((user) => user.email !== pending.email);
  verifiedUsers.push({
    itNumber: pending.itNumber,
    fullName: pending.fullName,
    email: pending.email,
    password: pending.password,
    verifiedAt: Date.now(),
  });
  setVerifiedUsers(verifiedUsers);

  return pending;
};

export const clearSignupPending = (email) => {
  const normalizedEmail = normalizeEmail(email);
  writeStorage(
    SIGNUP_CODES_KEY,
    cleanupExpiredEntries(SIGNUP_CODES_KEY).filter((item) => item.email !== normalizedEmail)
  );
};

export const sendResetPasswordEmail = async ({ toEmail, itNumber, token }) => {
  const resetLink = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const message = `Hello ${itNumber},\n\nClick this link to reset your password:\n${resetLink}\n\nThis link expires in 20 minutes.\n\nRegards,\nCRMS Team\n\nRegards,\nStudyNest Team`;
  await sendEmail({
    toEmail: normalizeEmail(toEmail),
    itNumber,
    title: 'StudyNest Password Reset',
    message,
  });
};

export const sendResetPasswordCode = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);
  const verifiedUser = getVerifiedUsers().find((user) => user.email === normalizedEmail);
  if (!verifiedUser) {
    throw new Error('This email is not verified yet. Please verify your account first.');
  }

  const code = generateCode();
  const now = Date.now();
  const resetCodes = cleanupExpiredEntries(RESET_CODES_KEY).filter((item) => item.email !== normalizedEmail);
  resetCodes.push({
    email: normalizedEmail,
    code,
    createdAt: now,
    expiresAt: now + CODE_TTL_MS,
  });
  writeStorage(RESET_CODES_KEY, resetCodes);

  try {
    await sendEmail({
      toEmail: normalizedEmail,
      itNumber: verifiedUser.itNumber || normalizedEmail.split('@')[0].toUpperCase(),
      title: 'StudyNest Password Reset Code',
      message: `Hello ${verifiedUser.itNumber || normalizedEmail.split('@')[0].toUpperCase()},\n\nYour password reset code is: ${code}\n\nThis code expires in 10 minutes.\n\nRegards,\nCRMS Team\n\nRegards,\nStudyNest Team`,
    });
  } catch (error) {
    writeStorage(
      RESET_CODES_KEY,
      resetCodes.filter((item) => item.email !== normalizedEmail)
    );
    throw error;
  }
};

export const verifyResetPasswordCode = ({ email, code }) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = String(code || '').trim();
  const resetCodes = cleanupExpiredEntries(RESET_CODES_KEY);
  const pending = resetCodes.find((item) => item.email === normalizedEmail);

  if (!pending) {
    throw new Error('Reset code expired or not found. Please resend code.');
  }
  if (pending.code !== normalizedCode) {
    throw new Error('Invalid reset code.');
  }
  return true;
};

export const completePasswordResetByCode = ({ email, code, newPassword }) => {
  verifyResetPasswordCode({ email, code });
  const normalizedEmail = normalizeEmail(email);
  const verifiedUsers = getVerifiedUsers();
  const userIndex = verifiedUsers.findIndex((user) => user.email === normalizedEmail);
  if (userIndex === -1) {
    throw new Error('Verified user account not found.');
  }

  verifiedUsers[userIndex] = {
    ...verifiedUsers[userIndex],
    password: newPassword,
    passwordUpdatedAt: Date.now(),
  };
  setVerifiedUsers(verifiedUsers);

  writeStorage(
    RESET_CODES_KEY,
    cleanupExpiredEntries(RESET_CODES_KEY).filter((item) => item.email !== normalizedEmail)
  );
  return true;
};

export const requestEmailVerification = async ({ itNumber, fullName, email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const token = generateToken();
  const now = Date.now();

  const pending = cleanupExpiredEntries(PENDING_SIGNUPS_KEY).filter((item) => item.email !== normalizedEmail);
  pending.push({
    token,
    itNumber,
    fullName: String(fullName || '').trim(),
    email: normalizedEmail,
    password,
    createdAt: now,
    expiresAt: now + SIGNUP_TOKEN_TTL_MS,
  });
  writeStorage(PENDING_SIGNUPS_KEY, pending);

  try {
    await sendVerificationEmail({
      toEmail: normalizedEmail,
      itNumber,
      fullName,
      token,
    });
  } catch (error) {
    writeStorage(
      PENDING_SIGNUPS_KEY,
      pending.filter((item) => item.email !== normalizedEmail)
    );
    throw error;
  }

  return token;
};

export const verifyEmailToken = (token) => {
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken) {
    throw new Error('Verification token is missing.');
  }

  const pending = cleanupExpiredEntries(PENDING_SIGNUPS_KEY);
  const matched = pending.find((item) => item.token === normalizedToken);
  if (!matched) {
    throw new Error('Invalid or expired verification link.');
  }

  const remaining = pending.filter((item) => item.token !== normalizedToken);
  writeStorage(PENDING_SIGNUPS_KEY, remaining);

  const verifiedUsers = getVerifiedUsers().filter((user) => user.email !== matched.email);
  const verifiedUser = {
    itNumber: matched.itNumber,
    fullName: matched.fullName,
    email: matched.email,
    password: matched.password,
    verifiedAt: Date.now(),
  };
  verifiedUsers.push(verifiedUser);
  setVerifiedUsers(verifiedUsers);

  return verifiedUser;
};

export const isEmailPendingVerification = (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;
  const pendingByToken = cleanupExpiredEntries(PENDING_SIGNUPS_KEY);
  const pendingByCode = cleanupExpiredEntries(SIGNUP_CODES_KEY);
  return (
    pendingByToken.some((item) => item.email === normalizedEmail) ||
    pendingByCode.some((item) => item.email === normalizedEmail)
  );
};

export const isEmailVerified = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return getVerifiedUsers().some((user) => user.email === normalizedEmail);
};

export const requestResetPassword = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const verifiedUser = getVerifiedUsers().find((user) => user.email === normalizedEmail);
  if (!verifiedUser) {
    throw new Error('This email is not verified yet. Please verify your account first.');
  }

  const token = generateToken();
  const now = Date.now();
  const resetTokens = cleanupExpiredEntries(RESET_TOKENS_KEY).filter((item) => item.email !== normalizedEmail);
  resetTokens.push({
    token,
    email: normalizedEmail,
    createdAt: now,
    expiresAt: now + RESET_TOKEN_TTL_MS,
  });
  writeStorage(RESET_TOKENS_KEY, resetTokens);

  try {
    await sendResetPasswordEmail({
      toEmail: normalizedEmail,
      itNumber: verifiedUser.itNumber || normalizedEmail.split('@')[0].toUpperCase(),
      token,
    });
  } catch (error) {
    writeStorage(
      RESET_TOKENS_KEY,
      resetTokens.filter((item) => item.email !== normalizedEmail)
    );
    throw error;
  }

  return token;
};

export const validateResetToken = (token) => {
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken) {
    throw new Error('Reset token is missing.');
  }
  const tokens = cleanupExpiredEntries(RESET_TOKENS_KEY);
  const matched = tokens.find((item) => item.token === normalizedToken);
  if (!matched) {
    throw new Error('Invalid or expired password reset link.');
  }
  return matched;
};

export const completePasswordReset = ({ token, newPassword }) => {
  const resetEntry = validateResetToken(token);
  const verifiedUsers = getVerifiedUsers();
  const userIndex = verifiedUsers.findIndex((user) => user.email === resetEntry.email);
  if (userIndex === -1) {
    throw new Error('Verified user account not found.');
  }

  verifiedUsers[userIndex] = {
    ...verifiedUsers[userIndex],
    password: newPassword,
    passwordUpdatedAt: Date.now(),
  };
  setVerifiedUsers(verifiedUsers);

  const remainingTokens = cleanupExpiredEntries(RESET_TOKENS_KEY).filter((item) => item.token !== resetEntry.token);
  writeStorage(RESET_TOKENS_KEY, remainingTokens);

  return true;
};
