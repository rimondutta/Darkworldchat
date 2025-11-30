import express from 'express';
import { uploadVoiceMessage, getVoiceMessage } from '../controllers/voice.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Ensure temp directory exists
const tempDir = './temp';
if (!fs.existsSync(tempDir)) {
  console.log('Creating temp directory for voice uploads');
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir); // Temporary storage before cloudinary upload
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

// Filter to only accept audio files
const fileFilter = (req, file, cb) => {
  // Accept only audio files
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Route to upload voice message for direct messages
router.post('/:recipientId', protectRoute, upload.single('audio'), uploadVoiceMessage);

// Route to upload voice message for group chat
router.post('/group/:groupId', protectRoute, upload.single('audio'), uploadVoiceMessage);

// Route to get voice message details
router.get('/:messageId', protectRoute, getVoiceMessage);

export default router;
