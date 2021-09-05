import { CommentsModel, PostModel } from '../models/index.js';

class CommentController {
  async createComment(req, res) {
    try {
      const { postId } = req.params;
      const { message } = req.body;
      const user = req.user;

      if (!message) {
        return res
          .status(400)
          .send({ error: 'Please provide a message with your comment.' });
      }

      if (!postId) {
        return res.status(400).send({
          error:
            'Please provide the id of the post you would like to comment on.',
        });
      }

      const post = await PostModel.findById(postId);

      if (!post) {
        return res
          .status(404)
          .send({ error: 'Could not find a post with that post id.' });
      }

      const comment = new CommentsModel({
        message,
        author: user._id,
        post: postId,
      });

      await comment.save();

      res.status(201).send({
        ...comment.toObject(),
        author: { username: user.username, avatar: user.avatar },
        commentVotes: [],
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default CommentController;
