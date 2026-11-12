import React from 'react';
import { MaterialIcon } from '../utils/icons';

/**
 * Reusable Alert / Notification Component
 * Mendukung tampilan inline di form, card, maupun melayang (floating) di atas video saat mode fullscreen.
 *
 * @param {string} variant - 'warning' | 'info' | 'error' | 'success' (default: 'warning')
 * @param {string|React.ReactNode} message - Pesan notifikasi
 * @param {string} title - Judul tebal opsional
 * @param {string} icon - Nama MaterialIcon kustom (opsional)
 * @param {function} onClose - Callback saat tombol tutup diklik (opsional)
 * @param {boolean} floating - Tampilan melayang dengan bayangan tebal (cocok untuk fullscreen video)
 * @param {boolean} compact - Padding lebih ringkas untuk ruang sempit
 * @param {string} className - Kelas CSS tambahan
 * @param {React.ReactNode} children - Konten alternatif jika tidak memakai message
 */
export const Alert = ({
  variant = 'warning',
  message,
  title,
  icon,
  onClose,
  floating = false,
  compact = false,
  className = '',
  children
}) => {
  const content = message || children;
  if (!content && !title) return null;

  // Skema warna taktil Al Madani Design System
  const styles = {
    warning: {
      container: 'bg-[#FFF5D6] border-[#FFC800] text-[#92400E] shadow-[0_3px_0_#D99B00]',
      iconName: 'warning',
      iconColor: 'text-[#D97706]'
    },
    error: {
      container: 'bg-[#FEF2F2] border-[#EF4444] text-[#B91C1C] shadow-[0_3px_0_#B91C1C]',
      iconName: 'error',
      iconColor: 'text-[#EF4444]'
    },
    success: {
      container: 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] shadow-[0_3px_0_#059669]',
      iconName: 'check_circle',
      iconColor: 'text-[#10B981]'
    },
    info: {
      container: 'bg-[#E0F2FE] border-[#38BDF8] text-[#0369A1] shadow-[0_3px_0_#0284C7]',
      iconName: 'info',
      iconColor: 'text-[#0284C7]'
    }
  };

  const currentStyle = styles[variant] || styles.warning;
  const currentIcon = icon || currentStyle.iconName;

  return (
    <div
      role="alert"
      className={`relative rounded-2xl border-2 flex items-start justify-between gap-3 animate-pop-in transition-all ${
        currentStyle.container
      } ${
        compact ? 'p-2.5 text-xs' : 'p-3.5 text-xs sm:text-sm'
      } ${
        floating
          ? 'shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-md'
          : ''
      } ${className}`.trim()}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <MaterialIcon
          name={currentIcon}
          className={`${compact ? 'text-lg mt-0.5' : 'text-xl mt-0.5'} shrink-0 ${currentStyle.iconColor}`}
        />
        <div className="min-w-0 flex-1">
          {title && (
            <h5 className="font-extrabold uppercase tracking-wide leading-tight mb-0.5">
              {title}
            </h5>
          )}
          <div className="font-bold leading-snug break-words">
            {content}
          </div>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 -mr-1 -mt-1 rounded-xl opacity-75 hover:opacity-100 hover:bg-black/5 active:scale-95 transition cursor-pointer"
          title="Tutup Notifikasi"
        >
          <MaterialIcon name="close" className="text-base" />
        </button>
      )}
    </div>
  );
};
