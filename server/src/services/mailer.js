import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter = null;

/** Real SMTP when configured, otherwise a console/JSON transport for dev. */
const getTransporter = () => {
  if (transporter) return transporter;

  if (env.smtp.host && env.smtp.user) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    logger.warn('SMTP not configured — emails are logged, not delivered');
  }
  return transporter;
};

export const sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await getTransporter().sendMail({
      from: env.smtp.from,
      to,
      subject,
      html,
      text: text || String(html || '').replace(/<[^>]+>/g, ' '),
    });
    if (info.message) logger.info(`[mail:dev] to=${to} subject="${subject}"`);
    return info;
  } catch (err) {
    logger.error(`Email to ${to} failed: ${err.message}`);
    return null;
  }
};

export default sendMail;
