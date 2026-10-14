import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder = 'Select…', className = '', children, ...props },
  ref,
) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={props.id || props.name}>
          {label}
          {props.required && <span className="text-rose-500"> *</span>}
        </label>
      )}
      <select
        ref={ref}
        id={props.id || props.name}
        {...props}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800
          focus:outline-none focus:ring-2 focus:ring-brand-500/40
          ${error ? 'border-rose-400' : 'border-slate-300'}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const value = opt.value ?? opt;
          const label2 = opt.label ?? opt;
          return (
            <option key={value} value={value}>
              {label2}
            </option>
          );
        })}
        {children}
      </select>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
});

export default Select;
