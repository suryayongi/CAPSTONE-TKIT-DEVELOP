import React from 'react';

/**
 * DuniaMadani 3D Tactile Button
 *
 * Sizing (Strict Height):
 * - sm: 36px (aksi tabel admin, kontrol player video, badge aksi)
 * - md: 44px (standar: modal, kartu tema, navigasi)
 * - lg: 54px (hero CTA, tombol kuis anak, submit form utama)
 *
 * Width is dynamic based on content + horizontal padding, or fullWidth=true.
 */
export const Button = ({
  children,
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  themeColor,
  themeLip,
  icon,
  iconRight,
  style = {},
  ...props
}) => {
  const sizeClasses = {
    sm: 'duo-btn-sm',
    md: 'duo-btn-md',
    lg: 'duo-btn-lg'
  };

  const variantClasses = {
    primary: 'duo-btn-primary',
    yellow: 'duo-btn-primary',
    secondary: 'duo-btn-secondary',
    emerald: 'duo-btn-emerald',
    blue: 'duo-btn-blue',
    sky: 'duo-btn-blue',
    purple: 'duo-btn-purple',
    danger: 'duo-btn-danger',
    red: 'duo-btn-danger',
    outline: 'duo-btn-outline',
    white: 'duo-btn-white',
    'theme-white': 'duo-btn-theme-white'
  };

  const dynamicStyles = { ...style };
  if (variant === 'theme-white') {
    if (themeColor) dynamicStyles['--btn-theme-color'] = themeColor;
    if (themeLip) dynamicStyles['--btn-theme-lip'] = themeLip;
  }

  const hasChildren = children !== undefined && children !== null && children !== '';
  const isIconOnly = !hasChildren && Boolean(icon || iconRight);

  const combinedClass = [
    'duo-btn',
    sizeClasses[size] || sizeClasses.md,
    variantClasses[variant] || variantClasses.primary,
    isIconOnly ? 'duo-btn-icon-only' : '',
    fullWidth ? 'w-full' : '',
    loading ? 'cursor-wait opacity-85' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={combinedClass}
      style={dynamicStyles}
      {...props}
    >
      {loading ? (
        <svg
          className={`animate-spin h-4 w-4 text-current ${hasChildren ? '-ml-1 mr-2' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="inline-flex shrink-0 items-center justify-center leading-none">{icon}</span>
      ) : null}

      {hasChildren && <span>{children}</span>}

      {!loading && iconRight ? (
        <span className="inline-flex shrink-0 items-center justify-center leading-none">{iconRight}</span>
      ) : null}
    </button>
  );
};
