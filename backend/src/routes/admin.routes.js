const express = require('express');
const multer = require('multer');
const Upload = require('../models/Upload');
const h = require('../middlewares/asyncHandler');
const { adminAuth, loginLimiter } = require('../middlewares/auth.middleware');
const admin = require('../controllers/adminController');

// Rasm xotirada qabul qilinib, bazaga yoziladi
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(null, Boolean(Upload.EXT[file.mimetype])),
});

const router = express.Router();

router.post('/login', loginLimiter, h(admin.login));

router.use(adminAuth);
router.get('/orders', h(admin.listOrders));
router.get('/orders/:id/receipt', h(admin.getReceipt));
router.post('/orders/:id/receipt/confirm', h(admin.confirmReceipt));
router.post('/orders/:id/receipt/reject', h(admin.rejectReceipt));
router.patch('/orders/:id/status', h(admin.updateOrderStatus));
router.get('/print-queue', h(admin.getPrintQueue));
router.post('/orders/:id/print-claim', h(admin.claimPrint));
router.post('/orders/:id/print', h(admin.printOrderNow));
router.post('/print-test', h(admin.printTest));

router.get('/products', h(admin.listProducts));
router.post('/products', h(admin.createProduct));
router.put('/products/:id', h(admin.updateProduct));
router.delete('/products/:id', h(admin.deleteProduct));
router.get('/categories', h(admin.listCategories));
router.post('/categories', h(admin.createCategory));
router.put('/categories/:id', h(admin.updateCategory));
router.delete('/categories/:id', h(admin.deleteCategory));
router.get('/branches', h(admin.listBranches));
router.post('/branches', h(admin.createBranch));
router.put('/branches/:id', h(admin.updateBranch));
router.delete('/branches/:id', h(admin.deleteBranch));
router.get('/reviews', h(admin.listReviews));
router.post('/upload', upload.single('image'), h(admin.uploadImage));

router.get('/settings', h(admin.getSettings));
router.put('/settings', h(admin.updateSettings));

module.exports = router;
