import { PostModel } from '../models/index.js';

class PostServices {
  async create(user, text, images) {
    if (!user) {
      throw ApiError.UnauthorizedError();
    }

    const data = {
      text,
      images,
      author: user._id,
    };

    const post = await PostModel.create(data);
    // console.log(user);
    // user.posts.push(post._id);
    // user.save();
    return post;
  }

  async getAllPosts(page, limit) {
    const posts = await PostModel.find()
      .sort({ createdAt: '-1' })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user');

    return posts;
  }

  async postsTotalCount() {
    const totalCount = await PostModel.countDocuments();
    return totalCount;
  }

  async getPostById(postId) {
    if (!isValidObjectId(postId)) {
      throw ApiError.BadRequest();
    }

    const post = await PostModel.findById(postId).populate('user').exec();

    if (!post) {
      throw ApiError.NotFound('Пост не найден');
    }

    return post;
  }
  async getUserPosts(userId) {
    const posts = await PostModel.find({ user: userId })
      .populate('user')
      .exec();

    return posts;
  }
}
const postServices = new PostServices();

export default postServices;
