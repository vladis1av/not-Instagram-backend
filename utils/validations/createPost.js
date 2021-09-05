import { body } from 'express-validator';

const createPostsValidations = [
  body('text', 'Введите текст поста')
    .isString()
    .isLength({
      max: 280,
    })
    .withMessage('Максимальная длина поста 280 символов'),
];

export default createPostsValidations;
