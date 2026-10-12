const path = require('path');
const crypto = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const env = (key, fallback = '') => (process.env[key] ?? fallback).toString().trim();

const botToken = env('BOT_TOKEN');
const adminPassword = env('ADMIN_PASSWORD');

const config = {
  port: Number(env('PORT', '3000')) || 3000,
  botToken,
  adminIds: env('ADMIN_IDS')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
  adminPassword,
  // Parol yoki token o'zgarsa, eski admin sessiyalari avtomatik bekor bo'ladi
  appSecret: crypto
    .createHash('sha256')
    .update(`${env('APP_SECRET', 'madi-sushi')}:${adminPassword}:${botToken}`)
    .digest('hex'),
  webappUrl: env('WEBAPP_URL').replace(/\/+$/, ''),
  yandexGeocoderKey: env('YANDEX_GEOCODER_KEY'),
  allowDevUser: env('ALLOW_DEV_USER') === 'true',
  brand: {
    name: 'Madi Sushi',
  },
  initDataMaxAgeSec: 7 * 24 * 60 * 60,
  adminTokenTtlSec: 7 * 24 * 60 * 60,
  paths: {
    public: path.join(__dirname, '../../public'),
    uploads: path.join(__dirname, '../../uploads'),
    miniappDist: path.join(__dirname, '../../../miniapp/dist'),
    adminDist: path.join(__dirname, '../../../admin/dist'),
  },
};

module.exports = config;
