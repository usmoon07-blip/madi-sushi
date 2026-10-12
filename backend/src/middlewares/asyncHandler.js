// Express 4 da async xatolarni ushlash uchun
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
