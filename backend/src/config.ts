import path from 'path';

export const PORT = Number(process.env.PORT) || 3001;

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '..', '..', 'data');

export const FRONTEND_DIST = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
