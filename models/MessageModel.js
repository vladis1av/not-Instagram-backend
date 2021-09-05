import mongoose from 'mongoose';
const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    text: { type: String, require: Boolean },
    dialog: { type: Schema.Types.ObjectId, ref: 'Dialog', require: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', require: true },
    read: {
      type: Boolean,
      default: false,
    },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'UploadFile' }],
  },
  {
    timestamps: true,
    usePushEach: true,
  },
);

const MessageModel = mongoose.model('Message', MessageSchema);

export default MessageModel;
