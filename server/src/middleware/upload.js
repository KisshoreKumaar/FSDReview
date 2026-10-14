import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const fileFilter = (req, file, cb) => {
  if (env.uploads.allowedMimes.includes(file.mimetype)) return cb(null, true);
  return cb(ApiError.badRequest(`Unsupported file type ${file.mimetype}. Allowed: PDF, JPEG, PNG`));
};

/** Memory storage — the storage service decides where bytes finally land. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.uploads.maxBytes, files: 1 },
  fileFilter,
});

export const singleDocument = upload.single('file');
export default upload;
