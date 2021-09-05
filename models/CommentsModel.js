import mongoose from 'mongoose';
const { Schema } = mongoose;

const CommentSchema = new Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  message: String,
  author: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  post: {
    type: Schema.ObjectId,
    ref: 'Post',
  },
});

const CommentModel = mongoose.model('Comment', CommentSchema);

export default CommentModel;
