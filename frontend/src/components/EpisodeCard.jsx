import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MaterialIcon } from '../utils/icons';
import { formatSecondsToMMSS } from '../utils/formatters';
import { Button } from './Button';

export const EpisodeCard = ({
  episode,
  subthemeTitle = '',
  showSubthemeBadge = false,
  playLabel = 'Putar Video',
  index = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const durationText = formatSecondsToMMSS(episode.durasi_detik || 180);
  const cueCount = Array.isArray(episode.cue_points) ? episode.cue_points.length : 0;
  const thumbUrl = episode.youtube_video_id
    ? `https://img.youtube.com/vi/${episode.youtube_video_id}/hqdefault.jpg`
    : null;
  const videoTitle = episode.judul_video || episode.judul_subtema || `Video ${index + 1}`;

  const handleOpenVideo = () => {
    navigate(`/tonton/${encodeURIComponent(episode.id)}`, {
      state: { from: location.pathname, fromLabel: 'Kembali ke Tema' }
    });
  };

  return (
    <div
      onClick={handleOpenVideo}
      className="duo-tile p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row items-stretch gap-5 group bg-white rounded-[20px] border border-[#E7E5E4] shadow-xs hover:border-[#D6D3D1] hover:shadow-md transition-all duration-200"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenVideo();
        }
      }}
    >
      {/* Thumbnail Video Preview yang Bersih & Sinematik */}
      <div className="relative w-full sm:w-64 md:w-72 lg:w-80 aspect-video rounded-xl overflow-hidden bg-stone-900 border border-[#E7E5E4] shrink-0">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={videoTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-800 text-white">
            <MaterialIcon name="smart_display" className="text-4xl text-white/50" />
          </div>
        )}

        {/* Minimalist Frosted Play Icon */}
        <div className="absolute inset-0 bg-stone-900/25 group-hover:bg-stone-900/10 transition-colors flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-white/95 text-[#1C1917] flex items-center justify-center shadow-md transform transition-all duration-200 group-hover:scale-110 group-hover:bg-[#D97706] group-hover:text-white">
            <MaterialIcon name="play_arrow" className="text-2xl" />
          </div>
        </div>

        {/* Badge Label Video di Sudut Kiri Atas */}
        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold">
          {episode.label_episode || `Video ${index + 1}`}
        </span>

        {/* Badge Durasi Video di Sudut Kanan Bawah */}
        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[11px] font-mono tabular-nums font-semibold">
          {durationText}
        </span>
      </div>

      {/* Kolom Informasi & Aksi */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          {showSubthemeBadge && subthemeTitle && (
            <span className="text-xs font-semibold text-[#B45309] block mb-1">
              Subtema: {subthemeTitle}
            </span>
          )}

          <h3 className="font-duo-display text-xl sm:text-2xl font-bold text-[#1C1917] group-hover:text-[#2D6A4F] transition-colors leading-tight">
            {videoTitle}
          </h3>

          {episode.deskripsi_singkat && (
            <p className="text-xs sm:text-sm font-medium text-[#57534E] mt-2 line-clamp-2 leading-relaxed">
              {episode.deskripsi_singkat}
            </p>
          )}
        </div>

        {/* Baris Bawah: Metadata Bersih & Tombol Putar Video */}
        <div className="mt-4 pt-3.5 border-t border-[#F5F5F4] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#78716C]">
            <span>{cueCount} Kuis Interaktif</span>
            {episode.closing_game?.enabled !== false && (
              <>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">Permainan Penutup</span>
              </>
            )}
            {episode.is_pjj_enabled && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                  Mode PJJ
                </span>
              </>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenVideo();
            }}
            icon={<MaterialIcon name="smart_display" className="text-base text-[#2D6A4F]" />}
          >
            {playLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
