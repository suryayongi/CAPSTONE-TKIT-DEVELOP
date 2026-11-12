import React from 'react';

export const Textarea = ({
  label,
  id,
  required = false,
  error,
  helperText,
  rows = 3,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div className={`space-y-1 w-full min-w-0 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-extrabold uppercase tracking-wider text-[#64748B] truncate"
          title={typeof label === 'string' ? label : undefined}
        >
          {label} {required && <span className="text-rose-500 font-extrabold">*</span>}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        required={required}
        className={`duo-input w-full min-w-0 ${error ? 'duo-input-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs font-bold text-rose-500 mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-xs font-medium text-[#94A3B8] mt-1">{helperText}</p>
      )}
    </div>
  );
};
