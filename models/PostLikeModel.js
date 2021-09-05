import mongoose from 'mongoose';
const { Schema } = mongoose;

const PostLikeSchema = new Schema({
  post: {
    type: Schema.ObjectId,
    ref: 'Post',
  },
  likes: [{ author: { type: Schema.ObjectId, ref: 'User' } }],
});

const PostLikeModel = mongoose.model('PostLike', PostLikeSchema);

export default PostLikeModel;
