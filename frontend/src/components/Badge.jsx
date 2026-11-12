import React from 'react';

export const Badge = ({
  children,
  variant = 'emerald',
  size = 'md',
  icon,
  className = ''
}) => {
  const variantClasses = {
    yellow: 'bg-[#FFF5D6] text-[#B45309] border-[#FDE68A]',
    emerald: 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]',
    sky: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
    purple: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]',
    red: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
    gray: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]'
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 rounded-lg border',
    md: 'text-xs px-3 py-1 rounded-xl border-2',
    lg: 'text-sm px-3.5 py-1.5 rounded-2xl border-2'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider select-none shrink-0 ${
        variantClasses[variant] || variantClasses.emerald
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
