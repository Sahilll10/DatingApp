const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { uploadPhoto, deletePhoto, uploadKyc } = require('./media.controller');

// all routes require login
router.use(protect);

// single file upload for photo
router.post('/upload-photo', upload.single('photo'), uploadPhoto);

// delete a photo
router.delete('/delete-photo', deletePhoto);

// single file upload for KYC
router.post('/upload-kyc', upload.single('kyc'), uploadKyc);

module.exports = router;