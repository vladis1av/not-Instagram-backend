import dotenv from 'dotenv';
dotenv.config();

import cloudinary from 'cloudinary';

if (!process.env.CLOUDINARY_NAME) {
  throw new Error('Отсутствуют конфигурации для Cloudinary');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
