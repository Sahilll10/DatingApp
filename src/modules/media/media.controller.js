const mediaService = require('./media.service');

// POST /media/upload-photo
const uploadPhoto = async (req, res) => {
  try {
    // multer puts the file on req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please attach an image.'
      });
    }

    const result = await mediaService.uploadPhoto(req.user._id, req.file);

    return res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE /media/delete-photo
const deletePhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'photoUrl is required'
      });
    }

    const result = await mediaService.deletePhoto(req.user._id, photoUrl);

    return res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// POST /media/upload-kyc
const uploadKyc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please attach a KYC document image.'
      });
    }

    const result = await mediaService.uploadKyc(req.user._id, req.file);

    return res.status(200).json({
      success: true,
      message: 'KYC uploaded successfully',
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { uploadPhoto, deletePhoto, uploadKyc };