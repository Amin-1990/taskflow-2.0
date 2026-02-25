// backend/src/utils/datetime.js
const TIMEZONE_OFFSET = process.env.DB_TIMEZONE || '+00:00';

/**
 * Parse le timezone configuré en heures
 * Ex: '+01:00' -> 1, '-05:00' -> -5
 */
function parseTimezoneOffset(tz) {
  const match = tz.match(/^([+-])(\d{2}):?(\d{2})$/);
  if (!match) return 0;
  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  return sign * (hours + minutes / 60);
}

const TIMEZONE_HOURS = parseTimezoneOffset(TIMEZONE_OFFSET);

/**
 * Retourne la date/heure actuelle dans le timezone configuré
 */
function getLocalDateTime() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (TIMEZONE_HOURS * 3600000));
}

/**
 * Formate une date pour MySQL (YYYY-MM-DD HH:mm:ss)
 */
function formatDateTimeForDB(date) {
  const d = date || getLocalDateTime();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

/**
 * Formate une date pour l'API (YYYY-MM-DD)
 */
function formatDateForAPI(date) {
  const d = date || getLocalDateTime();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formate l'heure actuelle (HH:mm:ss)
 */
function formatTimeForDB(date) {
  const d = date || getLocalDateTime();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mi}:${ss}`;
}

/**
 * Convertit une date UTC en date locale
 */
function utcToLocal(utcDate) {
  const utc = new Date(utcDate);
  const local = new Date(utc.getTime() + (TIMEZONE_HOURS * 3600000));
  return local;
}

/**
 * Convertit une date locale en UTC
 */
function localToUtc(localDate) {
  const local = new Date(localDate);
  const utc = new Date(local.getTime() - (TIMEZONE_HOURS * 3600000));
  return utc;
}

module.exports = {
  TIMEZONE_OFFSET,
  TIMEZONE_HOURS,
  getLocalDateTime,
  formatDateTimeForDB,
  formatDateForAPI,
  formatTimeForDB,
  utcToLocal,
  localToUtc
};
