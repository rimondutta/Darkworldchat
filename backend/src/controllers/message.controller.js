import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId, io } from '../lib/socket.js';
import {
  generateEncryptionKey,
  encryptMessage,
  decryptMessage,
  encryptWithPublicKey,
} from '../lib/encryption.js';

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { q } = req.query;
    const baseFilter = { _id: { $ne: loggedInUserId } };

    const nameFilter = q
      ? { fullName: { $regex: q, $options: 'i' } } // case-insensitive search
      : {};

    const filteredUsers = await User.find({
      ...baseFilter,
      ...nameFilter,
    }).select('-password -privateKey -lastSeen');
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log('Error in getUsersForSidebar: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params; // destructure + rename
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    console.log('Error in getMessages controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, encryptedText, isEncrypted } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Validation
    if (!text && !image) {
      return res.status(400).json({ error: 'Message must have text or image' });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Create message with BOTH plaintext (for sender) and encrypted (for receiver)
    const newMessage = new Message({
      senderId,
      receiverId,
      text, 
      encryptedText, 
      image: imageUrl,
      isEncrypted: isEncrypted || false,
    });

    await newMessage.save();

    // Send via socket to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log('Error in sendMessage controller', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getUserPublicKey = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const user = await User.findById(userId).select('publicKey');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ publicKey: user.publicKey });
  } catch (error) {
    console.log('Error in getUserPublicKey: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const pinChat = async (req, res) => {
  try {
    const { id: userToPinId } = req.params;
    const userId = req.user._id;

    // Check if user exists
    const userToPin = await User.findById(userToPinId);
    if (!userToPin) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if chat is already pinned
    const user = await User.findById(userId);
    if (user.pinnedChats.includes(userToPinId)) {
      return res.status(400).json({ error: 'Chat is already pinned' });
    }

    // Add to pinned chats
    await User.findByIdAndUpdate(userId, { $push: { pinnedChats: userToPinId } }, { new: true });

    res.status(200).json({ message: 'Chat pinned successfully' });
  } catch (error) {
    console.log('Error in pinChat controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unpinChat = async (req, res) => {
  try {
    const { id: userToUnpinId } = req.params;
    const userId = req.user._id;

    // Remove from pinned chats
    await User.findByIdAndUpdate(userId, { $pull: { pinnedChats: userToUnpinId } }, { new: true });

    res.status(200).json({ message: 'Chat unpinned successfully' });
  } catch (error) {
    console.log('Error in unpinChat controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPinnedChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .populate('pinnedChats', '-password -privateKey -lastSeen')
      .select('pinnedChats');

    res.status(200).json(user.pinnedChats || []);
  } catch (error) {
    console.log('Error in getPinnedChats controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /messages/archive/:id
export const archiveChat = async (req, res) => {
  try {
    const { id: chatUserId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.archivedChats?.includes(chatUserId)) {
      return res.status(400).json({ error: 'Chat is already archived' });
    }

    await User.findByIdAndUpdate(userId, { $push: { archivedChats: chatUserId } }, { new: true });

    res.status(200).json({ message: 'Chat archived successfully' });
  } catch (error) {
    console.log('Error in archiveChat:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /messages/unarchive/:id
export const unarchiveChat = async (req, res) => {
  try {
    const { id: chatUserId } = req.params;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { $pull: { archivedChats: chatUserId } }, { new: true });

    res.status(200).json({ message: 'Chat unarchived successfully' });
  } catch (error) {
    console.log('Error in unarchiveChat:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /messages/archived/chats
export const getArchivedChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId)
      .populate('archivedChats', '-password -privateKey -lastSeen')
      .select('archivedChats');

    res.status(200).json(user.archivedChats || []);
  } catch (error) {
    console.log('Error in getArchivedChats:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /messages/edit/:messageId
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id.toString();

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    // Only allow editing non-encrypted text messages
    if (message.isEncrypted || !message.text) {
      return res.status(400).json({ error: 'Only plain text messages can be edited' });
    }

    // Within 2 minutes
    const twoMinutesMs = 2 * 60 * 1000;
    if (Date.now() - new Date(message.createdAt).getTime() > twoMinutesMs) {
      return res.status(400).json({ error: 'Edit window expired' });
    }

    // Must be last message sent by me in this conversation
    const lastMyMsg = await Message.findOne({
      senderId: userId,
      receiverId: message.receiverId,
    })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!lastMyMsg || lastMyMsg._id.toString() !== messageId) {
      return res.status(400).json({ error: 'Only the last message can be edited' });
    }

    message.text = text.trim();
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('messageUpdated', message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log('Error in editMessage:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /messages/delete/:messageId
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id.toString();

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    // Within 2 minutes
    const twoMinutesMs = 2 * 60 * 1000;
    if (Date.now() - new Date(message.createdAt).getTime() > twoMinutesMs) {
      return res.status(400).json({ error: 'Delete window expired' });
    }

    // Must be last message sent by me in this conversation
    const lastMyMsg = await Message.findOne({
      senderId: userId,
      receiverId: message.receiverId,
    })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!lastMyMsg || lastMyMsg._id.toString() !== messageId) {
      return res.status(400).json({ error: 'Only the last message can be deleted' });
    }

    await Message.findByIdAndDelete(messageId);

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('messageDeleted', { _id: messageId });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log('Error in deleteMessage:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
