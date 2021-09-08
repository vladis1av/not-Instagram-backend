import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import ApiError from '../exceptions/apiError.js';
import { UserModel } from '../models/index.js';
import { mailService, tokenService } from './index.js';

class UserService {
  async registration(email, password, fullname, username) {
    const candidate = await UserModel.findOne({ email });

    if (candidate) {
      throw ApiError.BadRequest(`Пользователь уже сущевствует`);
    }

    const hashPassword = await bcrypt.hash(password, 3);
    const userConfirmLink = uuidv4();

    const user = await UserModel.create({
      email,
      password: hashPassword,
      fullname,
      username,
      confirmHash: userConfirmLink,
    });

    const tokens = tokenService.generateTokens({ ...user });

    await tokenService.saveToken(user._id, tokens.refreshToken);

    await mailService.sendActivationMail(
      email,
      `${process.env.CLIENT_URL}/activate/${userConfirmLink}`,
    );

    return {
      ...tokens,
      user,
    };
  }

  async activate(confirmHash) {
    const user = await UserModel.findOneAndUpdate(
      { confirmHash },
      { confirmed: true },
    );

    if (!user) {
      throw ApiError.BadRequest('Некорректная ссылка активации');
    }

    return user;
  }

  async login(login, password) {
    const user = await UserModel.findOne({
      $or: [{ email: login }, { username: login }],
    });

    if (!user) {
      throw ApiError.BadRequest('Неверный логин или пароль');
    }

    const isPassEquals = await bcrypt.compare(password, user.password);

    if (!isPassEquals) {
      throw ApiError.BadRequest('Неверный логин или пароль');
    }

    const tokens = tokenService.generateTokens({ ...user });

    await tokenService.saveToken(user._id, tokens.refreshToken);

    return { ...tokens, user: user };
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }

    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);

    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }

    const user = await UserModel.findById(userData._doc._id);
    const tokens = tokenService.generateTokens({ ...user });

    await tokenService.saveToken(user._id, tokens.refreshToken);

    return { ...tokens, user: user };
  }

  async getUserByUsername(username) {
    const user = await UserModel.findOne({ username: username });

    if (!user) {
      throw ApiError.NotFound('Пользователь не найден');
    }

    return user;
  }

  async getAllUsers() {
    const users = await UserModel.find();
    return users;
  }

  async findUsers(query) {
    const users = await UserModel.find().or([
      { username: new RegExp(query, 'i') },
      { fullname: new RegExp(query, 'i') },
    ]);
    return users;
  }
}

const userService = new UserService();

export default userService;
