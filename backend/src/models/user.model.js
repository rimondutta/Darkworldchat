import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === 'email'; // only required for email signups
      },
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: '',
    },
    pinnedChats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    archivedChats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    publicKey: {
      type: String,
      default: '',
    },
    // privateKey: {
    //   type: String,
    //   default: '',
    // },
    isVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    provider: {
      type: String,
      enum: ['email', 'google'],
      default: 'email',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
