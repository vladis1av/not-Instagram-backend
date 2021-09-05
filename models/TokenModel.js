import mongoose from 'mongoose';
const { Schema } = mongoose;

const TokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  refreshToken: { type: String, required: true },
});

const TokenModel = mongoose.model('Token', TokenSchema);

export default TokenModel;
