import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

config();

// Check if Cloudinary environment variables are set
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Check if all required Cloudinary credentials are available
const hasCloudinaryConfig = cloudName && apiKey && apiSecret;

if (hasCloudinaryConfig) {
  console.log('Configuring Cloudinary with cloud name:', cloudName);
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.error(
    'Cloudinary environment variables are not set properly. Voice message functionality will be disabled.'
  );
  console.error(
    'To enable voice messages, please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.'
  );
}

export default cloudinary;
