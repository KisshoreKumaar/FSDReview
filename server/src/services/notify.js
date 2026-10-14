import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { sendMail } from './mailer.js';
import { notificationEmail } from './emailTemplates.js';
import { emitToUser } from '../sockets/emitStatusChange.js';
import { logger } from '../utils/logger.js';

/**
 * The single fan-out point for user-facing events:
 * persist → push over the socket → queue an email.
 */
export const notify = async (userId, { title, body, link, email = true }) => {
  try {
    const notification = await Notification.create({ user: userId, title, body, link });
    emitToUser(userId, 'notification:new', {
      id: notification._id,
      title,
      body,
      link,
      createdAt: notification.createdAt,
    });

    if (email) {
      const user = await User.findById(userId).select('name email');
      if (user) {
        await sendMail({
          to: user.email,
          ...notificationEmail({ name: user.name, title, body, link }),
        });
      }
    }
    return notification;
  } catch (err) {
    logger.error(`notify() failed for user ${userId}: ${err.message}`);
    return null;
  }
};

export const notifyMany = async (userIds, payload) =>
  Promise.all([...new Set(userIds.map(String))].map((id) => notify(id, payload)));

export default notify;
