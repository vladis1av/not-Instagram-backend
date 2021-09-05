import mongoose from 'mongoose';
const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    text: {
      type: String,
      maxlength: 280,
    },
    author: {
      type: Schema.ObjectId,
      required: true,
      ref: 'User',
    },
    images: {
      type: [String],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
  },
  { timestamps: true },
);

PostSchema.pre('deleteOne', async function (next) {
  const postId = this.getQuery()['_id'];
  try {
    await mongoose.model('PostLike').deleteOne({ post: postId });
    await mongoose.model('Comment').deleteMany({ post: postId });
    next();
  } catch (err) {
    next(err);
  }
});

const PostModel = mongoose.model('Post', PostSchema);

export default PostModel;
