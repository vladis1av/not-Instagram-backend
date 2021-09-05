import mongoose from 'mongoose';
import differenceInMinutes from 'date-fns/differenceInMinutes/index.js';

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    confirmHash: {
      type: String,
      required: true,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    profileAvatar: {
      type: String,
      default:
        'https://res.cloudinary.com/social-clone/image/upload/v1625373082/44884218_345707102882519_2446069589734326272_n.jpg_mjnpza.jpg',
    },
    bio: {
      type: String,
      maxlength: 130,
    },
    website: {
      type: String,
      maxlength: 65,
    },
    lastSeen: {
      type: Date,
      default: new Date(),
    },
    bookmarks: [
      {
        post: {
          type: Schema.ObjectId,
          ref: 'Post',
        },
      },
    ],
  },
  { timestamps: true },
);

UserSchema.virtual('isOnline').get(function () {
  return differenceInMinutes(new Date(), new Date(this.lastSeen)) < 5;
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (_, obj) {
    delete obj.password;
    delete obj.confirmHash;
    return obj;
  },
});

UserSchema.pre('save', async function (next) {
  try {
    const document = await UserModel.findOne({
      $or: [{ email: this.email }, { username: this.username }],
    });
    if (document)
      return next(
        new RequestError(
          'A user with that email or username already exists.',
          400,
        ),
      );
    await mongoose.model('Followers').create({ user: this._id });
    await mongoose.model('Following').create({ user: this._id });
  } catch (err) {
    return next((err.statusCode = 400));
  }
});

const UserModel = mongoose.model('User', UserSchema);

export default UserModel;
