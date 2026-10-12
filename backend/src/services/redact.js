// Log va xatolik matnlaridan bot tokenini yashirish
const redact = (text) => String(text ?? '').replace(/(bot)?\d{6,}:[\w-]{30,}/g, 'bot***');

const errText = (err) => redact(err?.description || err?.message || err);

module.exports = { redact, errText };
