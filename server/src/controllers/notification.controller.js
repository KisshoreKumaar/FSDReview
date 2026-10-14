import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, paginated } from '../utils/apiResponse.js';
import { parsePagination } from '../utils/pagination.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return paginated(res, { items: { items, unreadCount }, total, page, limit }, 'Notifications fetched');
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true },
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  return ok(res, { notification }, 'Marked as read');
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  return ok(res, { updated: result.modifiedCount }, 'All notifications marked as read');
});
