import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, MaterialIcon } from '../utils/icons';
import { Button } from './Button';

export const ThemeCard = ({ theme, index = 0 }) => {
  const navigate = useNavigate();
  const bgHex = theme.warna_tema || theme.warna_hex || '#2D6A4F';
  const subGroups = theme.subthemes || [];

  const allPublishedVideos = subGroups.flatMap((g) =>
    (g.videos || []).filter((v) => !v.status_publikasi || v.status_publikasi === 'PUBLISHED')
  );

  const totalQuizzes = allPublishedVideos.reduce(
    (acc, v) => acc + ((v.cue_points && v.cue_points.length) || 0),
    0
  );

  const categoryLabel = `Tema ${theme.urutan || index + 1}`;
  const cardBtnText = theme.teks_tombol_kartu || 'Mulai Belajar';

  const handleOpenTheme = () => {
    navigate(`/tema/${encodeURIComponent(theme.slug || theme.id)}`);
  };

  return (
    <div
      onClick={handleOpenTheme}
      className="duo-tile overflow-hidden cursor-pointer flex flex-col justify-between group bg-white rounded-[20px] border border-[#E7E5E4] shadow-xs hover:shadow-md hover:border-[#D6D3D1] transition-all duration-200"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenTheme();
        }
      }}
    >
      <div>
        {/* Banner Atas Terintegrasi Mulus (Seamless Top Sleeve) */}
        <div
          className="p-6 text-white flex items-center justify-between gap-4 min-h-[120px] relative overflow-hidden"
          style={{ backgroundColor: bgHex }}
        >
          <div className="relative z-10 min-w-0 pr-2 flex-1">
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider block mb-1">
              {categoryLabel}
            </span>
            <h3 className="font-duo-display text-xl sm:text-2xl font-bold leading-snug line-clamp-2">
              {theme.judul_tema}
            </h3>
            {theme.rentang_usia && (
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-black/15 text-[11px] font-semibold text-white/95">
                {theme.rentang_usia}
              </span>
            )}
          </div>

          <div className="relative z-10 shrink-0 flex items-center justify-center">
            <Icon
              name={theme.ikon_emoji || 'star'}
              className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>

        {/* Deskripsi Tema di Area Body */}
        <div className="p-6 pb-2">
          <p className="text-sm font-medium text-[#57534E] leading-relaxed line-clamp-2">
            {theme.deskripsi}
          </p>
        </div>
      </div>

      <div className="p-6 pt-3">
        {/* Metadata Tenang (Quiet Chrome) & Tombol Aksi Sleek */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#F5F5F4]">
          <div className="flex items-center gap-2 text-xs font-medium text-[#78716C]">
            <span><strong className="font-mono tabular-nums text-[#292524]">{allPublishedVideos.length}</strong> Video</span>
            <span>•</span>
            <span><strong className="font-mono tabular-nums text-[#292524]">{totalQuizzes}</strong> Kuis Interaktif</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenTheme();
            }}
            icon={<MaterialIcon name="arrow_forward" className="text-lg text-[#2D6A4F]" />}
          >
            {cardBtnText}
          </Button>
        </div>
      </div>
    </div>
  );
};
