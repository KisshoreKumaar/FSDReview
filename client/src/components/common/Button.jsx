const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 disabled:bg-brand-300',
  secondary:
    'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 focus:ring-brand-500 disabled:text-slate-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 disabled:bg-rose-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 disabled:bg-emerald-300',
  ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition
        focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
