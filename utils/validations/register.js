import { body } from 'express-validator';

const registerValidations = [
  body('email', 'Введите E-Mail')
    .isEmail()
    .withMessage('Неверный E-Mail')
    .isLength({
      max: 50,
    })
    .withMessage('Допустимое кол-во символов в почте до 50'),
  body('fullname', 'Введите ваше имя')
    .isString()
    .isLength({
      max: 40,
    })
    .withMessage('Допустимое кол-во символов в полном имени  40'),
  body('username', 'Укажите логин')
    .isString()
    .isLength({
      min: 3,
      max: 20,
    })
    .withMessage('Допустимое кол-во символов в имени пользователя от 3 до 20'),
  body('password', 'Укажите пароль')
    .isString()
    .isLength({
      min: 8,
    })
    .withMessage('Пароль должен состоять минимум из 8 символов'),
];

export default registerValidations;
