import { validationResult } from 'express-validator';

import ApiError from '../exceptions/apiError.js';
import { PostModel, PostLikeModel, FollowingModel } from '../models/index.js';
import { postServices } from '../services/index.js';

class PostController {
  async getAllPosts(req, res, next) {
    try {
      const { page = 1, limit = 6 } = req.query;
      res.set('x-total-count', await postServices.postsTotalCount());

      const posts = await postServices.getAllPosts(page, limit);

      res.json({
        status: 'success',
        data: posts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req, res, next) {
    try {
      const postId = req.params.id;

      const post = await postServices.getPostById(postId);

      res.json(post);
    } catch (error) {
      next(error);
    }
  }

  async getUserPosts(req, res, next) {
    try {
      const userId = req.params.id;
      const posts = await postServices.getUserPosts(userId);

      res.json(posts);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const user = req.user;

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return next(
          ApiError.BadRequest('Ошибка при валидации', errors.array()),
        );
      }

      const post = await postServices.create(
        user,
        req.body.text,
        req.body.images,
      );

      const postLike = new PostLikeModel({
        post: post._id,
      });
      postLike.save();

      res.json({
        ...post.toObject(),
        author: { avatar: user.avatar, username: user.username },
        comments: [],
        postLikes: [],
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res) {
    const user = req.user;

    try {
      if (user) {
        const postId = req.params.id;

        const post = await PostModel.findById(postId);

        if (post) {
          if (post.user._id === user._id) {
            post.remove();
            res.send();
          } else {
            res.status(403).send();
          }
        } else {
          res.status(404).send();
        }
      }
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  async toggleLike(req, res) {
    try {
      const postId = req.params.id;
      const user = req.user;

      const postLikeUpdate = await PostLikeModel.updateOne(
        { post: postId, 'likes.author': { $ne: user._id } },
        {
          $push: { likes: { author: user._id } },
        },
      );

      if (!postLikeUpdate.nModified) {
        if (!postLikeUpdate.ok) {
          return res.status(500).send({ error: 'Не удалось поставить лайк.' });
        }
        const postDislikeUpdate = await PostLikeModel.updateOne(
          { post: postId },
          { $pull: { likes: { author: user._id } } },
        );

        if (!postDislikeUpdate.nModified) {
          return res.status(500).send({ error: 'Не удалось убрать лайк.' });
        }
      }
      return res.send({ success: true });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error,
      });
    }
  }

  postFeed = async (req, res, next) => {
    const user = req.user;
    const { offset } = req.params;

    try {
      const followingDocument = await FollowingModel.findOne({
        user: user._id,
      });

      if (!followingDocument) {
        return res
          .status(404)
          .send({ error: 'Не удалось найти ни одной записи.' });
      }

      const following = followingDocument.following.map(
        (following) => following.user,
      );

      const unwantedUserFields = [
        'author.password',
        'author.private',
        'author.confirmed',
        'author.bookmarks',
        'author.email',
        'author.website',
        'author.bio',
        'author.githubId',
      ];

      const posts = await PostModel.aggregate([
        {
          $match: {
            $or: [{ author: { $in: following } }],
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: Number(offset) },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
          },
        },
        {
          $lookup: {
            from: 'postlikes',
            localField: '_id',
            foreignField: 'post',
            as: 'postLikes',
          },
        },
        {
          $lookup: {
            from: 'comments',
            let: { postId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$post', '$$postId'],
                  },
                },
              },
              { $sort: { date: -1 } },
              { $limit: 3 },
              {
                $lookup: {
                  from: 'users',
                  localField: 'author',
                  foreignField: '_id',
                  as: 'author',
                },
              },

              {
                $unwind: '$author',
              },

              {
                $unset: unwantedUserFields,
              },
            ],
            as: 'comments',
          },
        },
        {
          $lookup: {
            from: 'comments',
            let: { postId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$post', '$$postId'],
                  },
                },
              },
              {
                $group: { _id: null, count: { $sum: 1 } },
              },
              {
                $project: {
                  _id: false,
                },
              },
            ],
            as: 'commentCount',
          },
        },
        {
          $unwind: {
            path: '$commentCount',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: '$postLikes',
        },
        {
          $unwind: '$author',
        },
        {
          $addFields: {
            postLikes: '$postLikes.likes',
            commentData: {
              comments: '$comments',
              commentCount: '$commentCount.count',
            },
          },
        },
        {
          $unset: [...unwantedUserFields, 'comments', 'commentCount'],
        },
      ]);
      return res.send(posts);
    } catch (err) {
      next(err);
    }
  };
}

export default PostController;
