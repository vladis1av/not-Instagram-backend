import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';

import {
  registerValidations,
  createPostsValidations,
} from '../utils/validations/index.js';
import {
  errorMiddleware,
  updateLastSeen,
  authMiddleware,
} from '../middlewares/index.js';
import {
  UserCtrl,
  PostCtrl,
  DialogCtrl,
  MessageCtrl,
  UploadFileCtrl,
  CommentCtrl,
} from '../controllers/index.js';

const createRoutes = (app, io) => {
  const UserController = new UserCtrl();
  const PostController = new PostCtrl();
  const DialogController = new DialogCtrl(io);
  const CommentController = new CommentCtrl();
  const MessageController = new MessageCtrl(io);
  const UploadFileController = new UploadFileCtrl();

  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  app.use(cookieParser());
  app.use(
    cors({
      credentials: true,
      origin: process.env.CLIENT_URL,
    }),
  );
  app.use(authMiddleware);
  app.use(updateLastSeen);
  app.use(errorMiddleware);

  app.post('/registration', registerValidations, UserController.registration);
  app.post('/login', UserController.login);
  app.post('/logout', UserController.logout);
  app.get('/refresh', UserController.refresh);
  app.get('/activate', UserController.activate);

  app.get('/users', UserController.getUsers);
  app.get('/users/suggested/:max?', UserController.getSuggestedUsers);
  app.put('/users/update', UserController.updateUser);
  app.get('/users/find', UserController.findUsers);
  app.get('/users/:username', UserController.getUser);
  app.put('/users/:userId/toggleFollow', UserController.toggleFollow);

  app.get('/posts', PostController.getAllPosts);
  app.get('/posts/feed/:offset', PostController.postFeed);
  app.post('/posts/create', createPostsValidations, PostController.create);
  app.get('/posts/user/:id', PostController.getUserPosts);
  app.get('/posts/:id', PostController.getPostById);
  app.delete('/posts/:id', PostController.delete);
  app.post('/posts/:id/toggleLike', PostController.toggleLike);

  app.post('/comment/:postId', CommentController.createComment);

  app.get('/dialogs', DialogController.index);
  app.post('/dialogs', DialogController.create);
  app.get('/dialogs/unreadCount', DialogController.unreadDialogsCount);
  app.delete('/dialogs/:id', DialogController.delete);

  app.get('/messages', MessageController.index);
  app.post('/messages', MessageController.create);
  app.delete('/messages', MessageController.delete);

  app.post('/upload', upload.single('image'), UploadFileController.upload);
};

export default createRoutes;
