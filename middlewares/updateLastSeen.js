import { UserModel } from '../models/index.js';

export default async function (req, res, next) {
  if (req.user) {
    await UserModel.findOneAndUpdate(
      { _id: req.user._id },
      {
        lastSeen: new Date(),
      },
      { new: true },
    );
  }
  next();
}
