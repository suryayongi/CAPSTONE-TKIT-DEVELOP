import React from 'react';
import { MaterialIcon } from '../utils/icons';

export const SubthemeFilterTabs = ({
  subGroups = [],
  selectedSubthemeId = 'ALL',
  onSelectSubtheme,
  totalVideos = 0,
  className = ''
}) => {
  if (!subGroups || subGroups.length === 0) return null;

  return (
    <div className={`mb-8 ${className}`}>
      {/* Header Koleksi */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <h2 className="font-duo-display text-xl sm:text-2xl font-bold text-[#1C1917]">
          Koleksi Subtema Pembelajaran
        </h2>
        <span className="text-xs font-medium text-[#78716C]">
          {subGroups.length} Subtema • {totalVideos} Video
        </span>
      </div>

      {/* Daftar Tab Taktil Bergaya Editorial Architectural */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectSubtheme('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedSubthemeId === 'ALL'
              ? 'bg-[#1C1917] text-white shadow-xs'
              : 'bg-white text-[#57534E] border border-[#E7E5E4] hover:bg-[#F5F5F4] hover:text-[#1C1917]'
          }`}
        >
          Semua Subtema ({subGroups.length})
        </button>

        {subGroups.map((group, idx) => {
          const isSelected = selectedSubthemeId === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelectSubtheme(group.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'bg-white text-[#57534E] border border-[#E7E5E4] hover:bg-[#F5F5F4] hover:text-[#1C1917]'
              }`}
            >
              Subtema {idx + 1}: {group.judul_subtema}
            </button>
          );
        })}
      </div>
    </div>
  );
};
