const s3 = require('../../config/s3');
const User = require('../../models/User');
const { v4: uuidv4 } = require('uuid');

// helper: upload a single file buffer to S3
const uploadToS3 = async (fileBuffer, mimetype, folder) => {
  const extension = mimetype.split('/')[1];  // e.g. 'jpeg'
  const fileName = `${folder}/${uuidv4()}.${extension}`;  // unique file name

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimetype,
  };

  const result = await s3.upload(params).promise();
  return result.Location;  // returns the public S3 URL
};

// helper: delete a file from S3
const deleteFromS3 = async (fileUrl) => {
  // extract the key from the full URL
  const key = fileUrl.split('.amazonaws.com/')[1];

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key
  };

  await s3.deleteObject(params).promise();
};

// POST /media/upload-photo
const uploadPhoto = async (userId, file) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // max 9 photos
  if (user.photos.length >= 9) {
    throw new Error('Maximum 9 photos allowed. Delete one to upload more.');
  }

  // upload to S3 under photos/userId folder for organisation
  const photoUrl = await uploadToS3(
    file.buffer,
    file.mimetype,
    `photos/${userId}`
  );

  // add URL to user's photos array
  user.photos.push(photoUrl);

  // check if profile is now complete
  user.is_profile_complete = checkProfileComplete(user);

  // if user just uploaded first photo, move to UNDER_REVIEW if KYC already uploaded
  if (user.kyc_url && user.photos.length === 1) {
    user.status = 'UNDER_REVIEW';
  }

  await user.save();

  return {
    photos: user.photos,
    is_profile_complete: user.is_profile_complete,
    status: user.status
  };
};

// DELETE /media/delete-photo
const deletePhoto = async (userId, photoUrl) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // check photo belongs to this user
  if (!user.photos.includes(photoUrl)) {
    throw new Error('Photo not found in your profile');
  }

  // delete from S3
  await deleteFromS3(photoUrl);

  // remove from DB array
  user.photos = user.photos.filter(p => p !== photoUrl);

  // re-check profile completeness
  user.is_profile_complete = checkProfileComplete(user);

  await user.save();

  return { photos: user.photos };
};

// POST /media/upload-kyc
const uploadKyc = async (userId, file) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // if KYC already uploaded, delete old one from S3 first
  if (user.kyc_url) {
    await deleteFromS3(user.kyc_url);
  }

  // upload new KYC to S3 under kyc/userId folder
  const kycUrl = await uploadToS3(
    file.buffer,
    file.mimetype,
    `kyc/${userId}`
  );

  user.kyc_url = kycUrl;

  // move to UNDER_REVIEW only if they also have at least 1 photo
  if (user.photos.length > 0) {
    user.status = 'UNDER_REVIEW';
  }

  await user.save();

  return {
    kyc_url: user.kyc_url,
    status: user.status,
    message: 'KYC uploaded. Under admin review.'
  };
};

// helper: is profile complete?
const checkProfileComplete = (user) => {
  return !!(
    user.name &&
    user.dob &&
    user.photos.length > 0 &&
    user.interests.length > 0
  );
};

module.exports = { uploadPhoto, deletePhoto, uploadKyc };