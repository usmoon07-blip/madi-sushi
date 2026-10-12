const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('ru-RU').replace(/ /g, ' ')} so'm`;

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// +998 90 123 45 67 ko'rinishiga keltiradi, noto'g'ri bo'lsa null
function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.length === 9) digits = `998${digits}`;
  if (!/^998\d{9}$/.test(digits)) return null;
  return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
}

const STATUS_LABELS = {
  NEW: 'Yangi',
  ACCEPTED: 'Tayyorlanmoqda',
  ON_WAY: "Yo'lda",
  DONE: 'Yakunlandi',
  CANCELLED: 'Bekor qilindi',
};

module.exports = { money, escapeHtml, normalizePhone, STATUS_LABELS };
