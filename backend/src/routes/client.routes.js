const express = require('express');
const h = require('../middlewares/asyncHandler');
const { telegramAuth } = require('../middlewares/auth.middleware');
const cart = require('../controllers/cartController');

const router = express.Router();

router.use(telegramAuth);
router.get('/bootstrap', h(cart.bootstrap));
router.get('/me', h(cart.me));
router.post('/me/phone', h(cart.savePhone));
router.post('/me/lang', h(cart.setLang));
router.post('/me/location', h(cart.saveLocation));
router.post('/favorites/:id', h(cart.toggleFavorite));
router.post('/reviews', h(cart.createReview));
router.post('/geocode', h(cart.geocode));
router.get('/orders', h(cart.myOrders));
router.post('/orders', h(cart.createOrder));

module.exports = router;
