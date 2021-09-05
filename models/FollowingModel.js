import mongoose from 'mongoose';
const { Schema } = mongoose;

const FollowingSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  following: [
    {
      user: {
        type: Schema.ObjectId,
        ref: 'User',
      },
    },
  ],
});

const FollowingModel = mongoose.model('Following', FollowingSchema);

export default FollowingModel;
