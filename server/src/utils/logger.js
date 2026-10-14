/* eslint-disable no-console */
import { env } from '../config/env.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = env.isTest ? LEVELS.error : LEVELS.debug;

const stamp = () => new Date().toISOString();

const write = (level, args) => {
  if (LEVELS[level] > threshold) return;
  const sink = level === 'error' ? console.error : console.log;
  sink(`[${stamp()}] ${level.toUpperCase()}`, ...args);
};

export const logger = {
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
  debug: (...args) => write('debug', args),
};

export default logger;
