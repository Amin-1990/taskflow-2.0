function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET est obligatoire');
  }
  return secret;
}

function getSessionMaxCount() {
  const raw = process.env.MAX_SESSIONS || '5';
  const parsed = parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 5;
}

function getSessionDurationDays() {
  const raw = process.env.SESSION_DURATION_DAYS || '7';
  const parsed = parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 7;
}

module.exports = {
  getJwtSecret,
  getSessionMaxCount,
  getSessionDurationDays
};
