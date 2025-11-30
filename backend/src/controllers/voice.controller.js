import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { extractAudioWaveform } from '../utils/audioProcessor.js';

// Controller to upload a voice message
export const uploadVoiceMessage = async (req, res) => {
  try {
    console.log('Voice upload request received:', {
      params: req.params,
      body: req.body,
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
    });

    // Extract recipient or group ID from the route parameters
    const recipientId = req.params.recipientId;
    const groupId = req.params.groupId;
    const senderId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ error: 'Voice file is required' });
    }

    // Verify that either recipientId or groupId is provided
    if (!recipientId && !groupId) {
      return res.status(400).json({ error: 'Recipient ID or Group ID is required' });
    }

    // If it's a direct message, verify the user exists
    if (recipientId) {
      const receiver = await User.findById(recipientId);
      if (!receiver) {
        return res.status(404).json({ error: 'Recipient not found' });
      }
    }

    // Get audio file info
    const audioFile = req.file;
    const tempFilePath = audioFile.path;
    const fileExtension = path.extname(audioFile.originalname);

    // Generate a waveform for visualization
    const waveformData = await extractAudioWaveform(tempFilePath);

    // Check if Cloudinary is configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      // Remove temp file
      fs.unlinkSync(tempFilePath);
      return res.status(500).json({
        error: 'Cloudinary configuration missing',
        message: 'Voice messages require Cloudinary to be properly configured',
      });
    }

    // Upload to Cloudinary
    let voiceMessageUrl;
    try {
      const cloudinaryResponse = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: 'auto',
        folder: 'voice_messages',
      });

      voiceMessageUrl = cloudinaryResponse.secure_url;
      console.log('Cloudinary upload successful:', voiceMessageUrl);
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed:', cloudinaryError);
      // Remove temp file
      fs.unlinkSync(tempFilePath);
      return res.status(500).json({
        error: 'Voice message upload failed',
        message: 'Failed to upload voice message to Cloudinary',
      });
    }

    // Remove the temporary file after upload
    fs.unlinkSync(tempFilePath);

    // Create a new message
    const newMessage = new Message({
      senderId,
      receiverId: recipientId || null,
      groupId: groupId || null,
      voiceMessage: voiceMessageUrl,
      voiceDuration: req.body.duration || 0,
      voiceWaveform: waveformData,
    });

    // Save message to DB
    await newMessage.save();

    // Populate sender info for the response
    const populatedMessage = await Message.findById(newMessage._id).populate(
      'senderId',
      'fullName profilePic'
    );

    // Emit socket event for real-time updates
    if (recipientId) {
      // Import the getReceiverSocketId function and io
      const { getReceiverSocketId, io } = await import('../lib/socket.js');
      const receiverSocketId = getReceiverSocketId(recipientId);

      if (receiverSocketId) {
        console.log('Emitting voice message to recipient:', recipientId);
        io.to(receiverSocketId).emit('newMessage', populatedMessage);
      }
    } else if (groupId) {
      // For group messages
      const { io } = await import('../lib/socket.js');
      console.log('Emitting voice message to group:', groupId);
      io.to(groupId).emit('newGroupMessage', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error in uploadVoiceMessage:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Error uploading voice message', message: error.message });
  }
};

// Controller to get voice message details
export const getVoiceMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message || !message.voiceMessage) {
      return res.status(404).json({ error: 'Voice message not found' });
    }

    res.status(200).json({
      url: message.voiceMessage,
      duration: message.voiceDuration,
      waveform: message.voiceWaveform,
    });
  } catch (error) {
    console.error('Error in getVoiceMessage:', error);
    res.status(500).json({ error: 'Error retrieving voice message' });
  }
};
