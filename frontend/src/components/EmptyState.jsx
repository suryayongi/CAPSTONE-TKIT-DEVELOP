import React from 'react';
import { Icon, MaterialIcon } from '../utils/icons';

/**
 * Reusable EmptyState Component
 * Menstandarkan tampilan kondisi data kosong di seluruh halaman aplikasi
 *
 * @param {string} icon - Nama ikon vektor Al Madani (e.g. 'mascot', 'teacher')
 * @param {string} materialIcon - Nama ikon Material Symbols (e.g. 'inbox', 'error_outline')
 * @param {string} title - Judul pesan kondisi kosong
 * @param {string} description - Deskripsi atau petunjuk tambahan
 * @param {React.ReactNode} action - Tombol aksi opsional (e.g. Button)
 * @param {boolean} compact - Mode ringkas untuk di dalam tabel atau baris section
 * @param {string} className
 */
export const EmptyState = ({
  icon,
  materialIcon = 'inbox',
  title,
  description,
  action = null,
  compact = false,
  className = ''
}) => {
  if (compact) {
    return (
      <div
        className={`p-6 sm:p-8 text-center rounded-2xl bg-[#F7F7F7] border-2 border-dashed border-[#E5E5E5] ${className}`}
      >
        {materialIcon && (
          <MaterialIcon
            name={materialIcon}
            className="text-4xl text-[#777777] mb-2 block mx-auto"
          />
        )}
        {title && (
          <h4 className="font-duo-display text-base font-bold text-[#4B4B4B] mb-1">
            {title}
          </h4>
        )}
        {description && (
          <p className="text-xs sm:text-sm font-bold text-[#777777] max-w-md mx-auto">
            {description}
          </p>
        )}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={`duo-card p-8 sm:p-12 text-center bg-white max-w-md mx-auto my-8 space-y-3 ${className}`}
    >
      {icon ? (
        <div className="flex justify-center mb-2">
          <Icon name={icon} className="w-20 h-20" />
        </div>
      ) : materialIcon ? (
        <div className="w-16 h-16 rounded-2xl bg-[#F7F7F7] border-2 border-[#E5E5E5] flex items-center justify-center mx-auto mb-2 text-[#777777]">
          <MaterialIcon name={materialIcon} className="text-4xl" />
        </div>
      ) : null}

      {title && (
        <h3 className="font-duo-display text-2xl font-bold text-[#1E293B]">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-xs sm:text-sm font-bold text-[#64748B] leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="pt-3 flex justify-center">{action}</div>}
    </div>
  );
};
