export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const formatRupees = (paise) =>
  `₹${((paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export const formatBytes = (bytes) => {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
};

export const titleCase = (value = '') =>
  value
    .toLowerCase()
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const percent = (value) => `${Number(value || 0).toFixed(2)}%`;
