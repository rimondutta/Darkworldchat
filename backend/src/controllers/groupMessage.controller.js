import Message from '../models/message.model.js';
import Group from '../models/group.model.js';
import { getReceiverSocketId, io } from '../lib/socket.js';
import cloudinary from '../lib/cloudinary.js';

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image, encryptedText, isEncrypted } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(senderId))
      return res.status(401).json({ message: 'You are not in this group' });

    let imageUrl = null;
    if (image) {
      // If image is an external URL (e.g., GIPHY), store as-is; otherwise upload base64 to Cloudinary
      if (
        typeof image === 'string' &&
        (image.startsWith('http://') || image.startsWith('https://'))
      ) {
        imageUrl = image;
      } else {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
      }
    }

    const newMessage = await Message.create({
      senderId,
      groupId,
      text: isEncrypted ? null : text,
      encryptedText: isEncrypted ? encryptedText : null,
      isEncrypted: !!isEncrypted,
      image: imageUrl,
    });

    const populatedMessage = await newMessage.populate('senderId', 'fullName profilePic');

    group.updatedAt = new Date();
    await group.save();

    group.members.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId.toString());
      if (socketId) io.to(socketId).emit('newGroupMessage', populatedMessage);
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error in sendGroupMessage:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.includes(senderId))
      return res.status(401).json({ message: 'You are not in this group' });

    const messages = await Message.find({ groupId })
      .populate('senderId', 'fullName profilePic')
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error in getGroupMessages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
