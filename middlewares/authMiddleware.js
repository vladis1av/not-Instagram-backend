import ApiError from '../exceptions/apiError.js';
import { tokenService } from '../services/index.js';

export default function (req, res, next) {
  try {
    if (
      req.path === '/login' ||
      req.path === '/registration' ||
      req.path === '/activate' ||
      req.path === '/refresh'
    ) {
      return next();
    }

    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      return next(ApiError.UnauthorizedError());
    }

    const accessToken = authorizationHeader.split(' ')[1];
    if (!accessToken) {
      return next(ApiError.UnauthorizedError());
    }

    const userData = tokenService.validateAccessToken(accessToken);
    if (!userData) {
      return next(ApiError.UnauthorizedError());
    }
    req.user = userData._doc;
    next();
  } catch (e) {
    return next(ApiError.UnauthorizedError());
  }
}
