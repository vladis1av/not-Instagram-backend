import mongoose from 'mongoose';
const { Schema } = mongoose;

const FollowersSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  followers: [
    {
      user: {
        type: Schema.ObjectId,
        ref: 'User',
      },
    },
  ],
});

const FollowersModel = mongoose.model('Followers', FollowersSchema);

export default FollowersModel;
