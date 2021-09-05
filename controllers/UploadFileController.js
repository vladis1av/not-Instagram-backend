import { cloudinary } from '../core/index.js';

class UploadFileController {
  async upload(req, res) {
    try {
      const file = req.file;
      cloudinary.v2.uploader
        .upload_stream({ resource_type: 'auto' }, (error, result) => {
          if (error || !result) {
            return res.status(500).json({
              status: 'error',
              message: error || 'upload error',
            });
          }

          res.status(201).json({
            url: result.url,
            size: Math.round(result.bytes / 1024),
            height: result.height,
            width: result.width,
          });
        })
        .end(file.buffer);
    } catch (error) {
      console.log(error);
    }
  }
}

export default UploadFileController;
