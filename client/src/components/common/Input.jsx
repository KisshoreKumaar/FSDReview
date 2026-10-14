import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, hint, className = '', ...props }, ref) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={props.id || props.name}>
          {label}
          {props.required && <span className="text-rose-500"> *</span>}
        </label>
      )}
      <input
        ref={ref}
        id={props.id || props.name}
        {...props}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:bg-slate-50
          ${error ? 'border-rose-400' : 'border-slate-300'}`}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});

export default Input;
