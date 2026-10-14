const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const parsePagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requested = Number.parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, requested));
  return { page, limit, skip: (page - 1) * limit };
};

export { DEFAULT_LIMIT, MAX_LIMIT };
export default parsePagination;
