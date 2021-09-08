import { validationResult } from 'express-validator';

import ApiError from '../exceptions/apiError.js';
import FollowersModel from '../models/FollowersModel.js';
import FollowingModel from '../models/FollowingModel.js';
import PostModel from '../models/PostModel.js';
import UserModel from '../models/UserModel.js';
import { userService } from '../services/index.js';
import { ObjectId } from '../utils/ObjectId.js';

class UserController {
  async registration(req, res, next) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return next(
          ApiError.BadRequest('Ошибка при валидации', errors.array()),
        );
      }

      const { email, password, fullname, username } = req.body;
      const userData = await userService.registration(
        email,
        password,
        fullname,
        username,
      );

      return res.json(userData);
    } catch (e) {
      next(e);
    }
  }

  async activate(req, res, next) {
    try {
      const confirmHash = req.query.hash;
      await userService.activate(confirmHash);

      return res.status(200).send();
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { login, password } = req.body;
      const userData = await userService.login(login, password);

      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });

      return res.json(userData);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const token = await userService.logout(refreshToken);

      res.clearCookie('refreshToken');

      return res.json(token);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const userData = await userService.refresh(refreshToken);

      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });

      return res.json(userData);
    } catch (error) {
      next(error);
    }
  }

  async getUserByUsername(req, res, next) {
    try {
      const username = req.params.id;

      const user = await userService.getUserByUsername(username);

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(_, res, next) {
    try {
      const users = await userService.getAllUsers();
      return res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async findUsers(req, res, next) {
    try {
      const query = req.query.user;
      const users = await userService.findUsers(query);

      return res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const userId = req.user._id;
      const { fullname, username, website, bio } = req.body.data;

      await UserModel.findOneAndUpdate(
        { _id: userId },
        { fullname, username, website, bio },
      );

      return res.send();
    } catch (e) {
      next(e);
    }
  }

  toggleFollow = async (req, res, next) => {
    const { userId } = req.params;
    const user = req.user;

    try {
      const userToFollow = await UserModel.findById(userId);
      if (!userToFollow) {
        return res.status(400).send({
          error: 'Не удалось найти пользователя с таким идентификатором.',
        });
      }

      const followerUpdate = await FollowersModel.updateOne(
        { user: userId, 'followers.user': { $ne: user._id } },
        { $push: { followers: { user: user._id } } },
      );

      const followingUpdate = await FollowingModel.updateOne(
        { user: user._id, 'following.user': { $ne: userId } },
        { $push: { following: { user: userId } } },
      );

      if (!followerUpdate.nModified || !followingUpdate.nModified) {
        if (!followerUpdate.ok || !followingUpdate.ok) {
          return res.status(500).send({
            error:
              'Не удалось подписаться на пользователя, попробуйте еще раз позже',
          });
        }

        const followerUnfollowUpdate = await FollowersModel.updateOne(
          {
            user: userId,
          },
          { $pull: { followers: { user: user._id } } },
        );

        const followingUnfollowUpdate = await FollowingModel.updateOne(
          { user: user._id },
          { $pull: { following: { user: userId } } },
        );
        if (!followerUnfollowUpdate.ok || !followingUnfollowUpdate.ok) {
          return res.status(500).send({
            error:
              'Не удалось подписаться на пользователя, попробуйте еще раз позже.',
          });
        }
        return res.send({ success: true, operation: 'unfollow' });
      }

      res.send({ success: true, operation: 'follow' });
    } catch (err) {
      next(err);
    }
  };

  getUser = async (req, res, next) => {
    const { username } = req.params;
    const requestingUser = req.user;

    try {
      const user = await UserModel.findOne(
        { username },
        'username fullname profileAvatar bio bookmarks _id website',
      );

      if (!user) {
        return res.status(404).send({
          error: 'Не удалось найти пользователя с таким именем пользователя.',
        });
      }

      const posts = await PostModel.aggregate([
        {
          $facet: {
            data: [
              { $match: { author: ObjectId(user._id) } },
              { $sort: { createdAt: -1 } },
              { $limit: 12 },
              {
                $lookup: {
                  from: 'postlikes',
                  localField: '_id',
                  foreignField: 'post',
                  as: 'postlikes',
                },
              },
              {
                $lookup: {
                  from: 'comments',
                  localField: '_id',
                  foreignField: 'post',
                  as: 'comments',
                },
              },
              {
                $unwind: '$postlikes',
              },
              {
                $project: {
                  user: true,
                  followers: true,
                  following: true,
                  comments: {
                    $sum: { $size: '$comments' },
                  },
                  images: true,
                  author: true,
                  postLikes: { $size: '$postlikes.likes' },
                },
              },
            ],
            postCount: [
              { $match: { author: ObjectId(user._id) } },
              { $count: 'postCount' },
            ],
          },
        },
        { $unwind: '$postCount' },
        {
          $project: {
            data: true,
            postCount: '$postCount.postCount',
          },
        },
      ]);

      const followersDocument = await FollowersModel.findOne({
        user: ObjectId(user._id),
      });

      const followingDocument = await FollowingModel.findOne({
        user: ObjectId(user._id),
      });

      return res.send({
        user,
        posts: posts[0],
        followers: followersDocument.followers.length,
        following: followingDocument.following.length,
        isFollowing: requestingUser
          ? !!followersDocument.followers.find(
              (follower) =>
                String(follower.user) === String(requestingUser._id),
            )
          : false,
      });
    } catch (err) {
      next(err);
    }
  };

  getSuggestedUsers = async (req, res, next) => {
    const { max } = req.params;
    const user = req.user;
    try {
      const users = await UserModel.aggregate([
        {
          $match: { _id: { $ne: ObjectId(user._id) } },
        },
        {
          $lookup: {
            from: 'followers',
            localField: '_id',
            foreignField: 'user',
            as: 'followers',
          },
        },
        {
          $lookup: {
            from: 'posts',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$author', '$$userId'],
                  },
                },
              },
              {
                $sort: { date: -1 },
              },
              {
                $limit: 3,
              },
            ],
            as: 'posts',
          },
        },
        {
          $unwind: '$followers',
        },
        {
          $project: {
            username: true,
            fullname: true,
            email: true,
            profileAvatar: true,
            posts: true,
            isFollowing: {
              $in: [ObjectId(user._id), '$followers.followers.user'],
            },
          },
        },
        {
          $match: { isFollowing: false },
        },
        {
          $sample: { size: max ? Number(max) : 20 },
        },
        {
          $sort: { posts: -1 },
        },
        {
          $unset: ['isFollowing'],
        },
      ]);
      res.send(users);
    } catch (err) {
      next(err);
    }
  };
}

export default UserController;
