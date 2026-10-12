const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const config = require('../config/default');
const h = require('../middlewares/asyncHandler');
const { adminAuth, loginLimiter } = require('../middlewares/auth.middleware');
const admin = require('../controllers/adminController');

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: config.paths.uploads,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, Boolean(EXT[file.mimetype])),
});

const router = express.Router();

router.post('/login', loginLimiter, h(admin.login));

router.use(adminAuth);
router.get('/orders', h(admin.listOrders));
router.patch('/orders/:id/status', h(admin.updateOrderStatus));

router.get('/products', h(admin.listProducts));
router.post('/products', h(admin.createProduct));
router.put('/products/:id', h(admin.updateProduct));
router.delete('/products/:id', h(admin.deleteProduct));
router.post('/upload', upload.single('image'), h(admin.uploadImage));

router.get('/settings', h(admin.getSettings));
router.put('/settings', h(admin.updateSettings));

module.exports = router;
