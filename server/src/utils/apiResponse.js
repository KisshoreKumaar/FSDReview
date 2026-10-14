export const ok = (res, data = null, message = 'OK', statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, message });

export const created = (res, data = null, message = 'Created') => ok(res, data, message, 201);

export const paginated = (res, { items, total, page, limit }, message = 'OK') =>
  ok(res, {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  }, message);

export default ok;
