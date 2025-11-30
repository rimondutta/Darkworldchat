import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    admin: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
  },
  { timestamps: true }
);

groupSchema.pre('save', function (next) {
  if (!this.admin || this.admin.length === 0) {
    this.admin = [this.createdBy];
  }

  if (!this.members.includes(this.createdBy)) {
    this.members.push(this.createdBy);
  }

  next();
});

const Group = mongoose.model('Group', groupSchema);

export default Group;
