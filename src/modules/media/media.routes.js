const express              = require('express');
const router               = express.Router();
const { protect }          = require('../../middleware/auth');
const upload               = require('../../middleware/upload');
const { uploadLimiter }    = require('../../middleware/rateLimit');
const { uploadPhoto, deletePhoto, uploadKyc } = require('./media.controller');

router.use(protect);

router.post('/upload-photo', uploadLimiter, upload.single('photo'), uploadPhoto);
router.delete('/delete-photo',                                       deletePhoto);
router.post('/upload-kyc',   uploadLimiter, upload.single('kyc'),   uploadKyc);

module.exports = router;