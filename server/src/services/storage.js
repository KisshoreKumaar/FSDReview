import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { logger } from '../utils/logger.js';

const localDriver = {
  name: 'local',
  async upload(file, { folder = 'documents' } = {}) {
    const dir = path.join(env.uploads.dir, folder);
    await fs.mkdir(dir, { recursive: true });

    const ext = path.extname(file.originalname) || '';
    const key = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    await fs.writeFile(path.join(dir, key), file.buffer);

    return {
      url: `/uploads/${folder}/${key}`,
      publicId: `${folder}/${key}`,
      driver: 'local',
    };
  },
  async remove(publicId) {
    if (!publicId) return;
    await fs.rm(path.join(env.uploads.dir, publicId), { force: true });
  },
};

const cloudinaryDriver = {
  name: 'cloudinary',
  upload(file, { folder = 'documents' } = {}) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `admissions/${folder}`, resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);
          return resolve({ url: result.secure_url, publicId: result.public_id, driver: 'cloudinary' });
        },
      );
      stream.end(file.buffer);
    });
  },
  async remove(publicId) {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  },
};

/** Cloudinary when credentials exist, local disk otherwise. */
export const storage = isCloudinaryConfigured ? cloudinaryDriver : localDriver;

if (!isCloudinaryConfigured) {
  logger.warn(`Cloudinary not configured — uploads go to ${env.uploads.dir}`);
}

export const uploadFile = (file, options) => storage.upload(file, options);
export const removeFile = (publicId) => storage.remove(publicId);
export default storage;
