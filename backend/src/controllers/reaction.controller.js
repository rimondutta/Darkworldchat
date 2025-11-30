import Message from '../models/message.model.js';
import { getReceiverSocketId, io } from '../lib/socket.js';

// Add a reaction to a message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    // Find the message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user already has a reaction on this message
    const existingReactionIndex = message.reactions.findIndex(
      (reaction) => reaction.userId.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
      // If reaction exists with same emoji, remove it (toggle)
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // If reaction exists with different emoji, update it
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({ emoji, userId });
    }

    await message.save();

    // Populate user details for the reactions
    await message.populate({
      path: 'reactions.userId',
      select: 'fullName profilePic',
    });

    // Emit socket event
    const receiverId =
      message.senderId.toString() === userId.toString() ? message.receiverId : message.senderId;

    // If it's a group message
    if (message.groupId) {
      // For group messages, emit to the entire group room and to all users in the room
      const groupId = message.groupId.toString();
      io.to(groupId).emit('messageReactionAdded', message);

      // Also emit directly to each user's personal room to ensure they receive the update
      const senderSocketId = getReceiverSocketId(userId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit('messageReactionAdded', message);
      }
    } else {
      // For direct messages
      const receiverSocketId = getReceiverSocketId(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('messageReactionAdded', message);
      }

      // Also emit to sender's socket for real-time updates
      const senderSocketId = getReceiverSocketId(userId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit('messageReactionAdded', message);
      }
    }

    res.status(200).json({ message });
  } catch (error) {
    console.log('Error in addReaction controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all reactions for a message
export const getReactions = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId).populate({
      path: 'reactions.userId',
      select: 'fullName profilePic',
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.log('Error in getReactions controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove a reaction from a message
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Filter out the user's reaction
    message.reactions = message.reactions.filter(
      (reaction) => reaction.userId.toString() !== userId.toString()
    );

    await message.save();

    // Emit socket event
    const receiverId =
      message.senderId.toString() === userId.toString() ? message.receiverId : message.senderId;

    if (message.groupId) {
      // For group messages, emit to the entire group room and to all users in the room
      const groupId = message.groupId.toString();
      io.to(groupId).emit('messageReactionRemoved', message);

      // Also emit directly to each user's personal room to ensure they receive the update
      const senderSocketId = getReceiverSocketId(userId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit('messageReactionRemoved', message);
      }
    } else {
      const receiverSocketId = getReceiverSocketId(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('messageReactionRemoved', message);
      }

      // Also emit to sender's socket for real-time updates
      const senderSocketId = getReceiverSocketId(userId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit('messageReactionRemoved', message);
      }
    }

    res.status(200).json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.log('Error in removeReaction controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
