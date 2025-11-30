import mongoose from 'mongoose';

// Define the reaction schema as a subdocument
const reactionSchema = new mongoose.Schema(
  {
    emoji: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return !this.groupId;
      },
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },

    text: {
      type: String,
      required: false,
    },

    encryptedText: {
      type: Object,
      default: null,
    },

    isEncrypted: {
      type: Boolean,
      default: false,
    },

    image: {
      type: String,
    },

    voiceMessage: {
      type: String,
    },

    voiceDuration: {
      type: Number,
      default: 0,
    },

    voiceWaveform: {
      type: [Number],
      default: [],
    },

    reactions: {
      type: [reactionSchema],
      default: [],
    },

    // Delivery/read receipts
    delivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
