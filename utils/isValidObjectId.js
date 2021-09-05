import { mongoose } from '../core/db.js';

export const isValidObjectId = mongoose.Types.ObjectId.isValid;
