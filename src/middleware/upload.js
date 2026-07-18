const multer = require('multer');

// store file in memory (not disk) before uploading to S3
const storage = multer.memoryStorage();

// file filter — only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // accept file
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WEBP allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB max per file
  }
});

module.exports = upload;