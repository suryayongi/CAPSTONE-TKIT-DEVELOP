import React from 'react';
import { Icon } from '../utils/icons';

export const PageBanner = ({
  title,
  subtitle,
  categoryLabel,
  iconName = 'police',
  color = '#0EA5E9',
  iconPosition = 'right', // 'left' atau 'right'
  actionButton,
  className = ''
}) => {
  const bgHex = color || '#0EA5E9';

  if (iconPosition === 'left') {
    return (
      <div
        className={`duo-unit-banner mb-6 p-5 sm:p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${className}`}
        style={{ backgroundColor: bgHex }}
      >
        {/* Kiri: Ikon Tema (Serong Kanan, Rotate 10deg, Rata Tengah Vertikal) & Teks */}
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          <div className="relative shrink-0 flex items-center justify-center self-center my-auto pointer-events-auto">
            <div
              className="relative flex items-center justify-center transition-transform duration-300 hover:scale-105 cursor-pointer"
              style={{ transform: 'rotate(10deg)', transformOrigin: 'center center' }}
              title={title}
            >
              {/* Outer circle: ~1.23x icon, bg-white/20, blur-3xl */}
              <div className="absolute inset-0 m-auto w-[138px] h-[138px] sm:w-[138px] sm:h-[138px] rounded-full bg-white/20 blur-3xl pointer-events-none -z-10" />
              {/* Inner circle: ~0.82x icon, bg-white/20, blur-xl */}
              <div className="absolute inset-0 m-auto w-[92px] h-[92px] sm:w-[92px] sm:h-[92px] rounded-full bg-white/20 blur-xl pointer-events-none -z-10" />

              <div style={{ filter: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 32px rgba(255, 255, 255, 0.2))' }}>
                <Icon name={iconName} className="w-28 h-28 sm:w-28 sm:h-28" />
              </div>
            </div>
          </div>

          <div className="max-w-xl py-1">
            {categoryLabel && (
              <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-black/15 text-white text-xs font-black uppercase tracking-wider mb-2">
                <span>{categoryLabel}</span>
              </div>
            )}
            <h1 className="font-duo-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm font-bold text-white/95 mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Kanan: Tombol Aksi */}
        {actionButton && (
          <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
            {actionButton}
          </div>
        )}
      </div>
    );
  }

  // Default: iconPosition === 'right' (Tema Siswa)
  return (
    <div
      className={`duo-unit-banner mb-6 p-5 sm:p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${className}`}
      style={{ backgroundColor: bgHex }}
    >
      {/* Kiri: Teks Informasi Tema Sentra */}
      <div className="relative z-10 max-w-xl text-center md:text-left py-1">
        {categoryLabel && (
          <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-black/15 text-white text-xs font-black uppercase tracking-wider mb-2">
            <span>{categoryLabel}</span>
          </div>
        )}
        <h1 className="font-duo-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm font-bold text-white/95 mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Kanan: Ikon Vektor Proporsional di Kanan (Rata Tengah Vertikal, Rotate -10deg) */}
      <div className="relative z-10 shrink-0 self-center my-auto flex items-center justify-center pointer-events-none">
        <div
          className="relative flex items-center justify-center transition-transform duration-300 hover:scale-105 cursor-pointer pointer-events-auto"
          style={{ transform: 'rotate(-10deg)', transformOrigin: 'center center' }}
          title={title}
        >
          {/* Outer circle: ~1.23x icon, bg-white/20, blur-3xl */}
          <div className="absolute inset-0 m-auto w-[138px] h-[138px] sm:w-[138px] sm:h-[138px] rounded-full bg-white/20 blur-3xl pointer-events-none -z-10" />
          {/* Inner circle: ~0.82x icon, bg-white/20, blur-xl */}
          <div className="absolute inset-0 m-auto w-[92px] h-[92px] sm:w-[92px] sm:h-[92px] rounded-full bg-white/20 blur-xl pointer-events-none -z-10" />

          <div style={{ filter: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 32px rgba(255, 255, 255, 0.2))' }}>
            <Icon name={iconName} className="w-28 h-28 sm:w-28 sm:h-28" />
          </div>
        </div>
      </div>
    </div>
  );
};
