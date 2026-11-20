import React from 'react';
import { Icon } from '../utils/icons';

export const HeroBanner = ({
  headline = 'Ayo Mulai Petualangan Belajar Hari Ini!',
  subheadline = 'Pilih tema dan subtema belajar, tonton video seru bersama Ibu Guru, dan jawab pertanyaan kuisnya!',
  mascotGreeting = 'Halo Sahabat Madani! Siap bermain?'
}) => {
  const activeGreeting = mascotGreeting || 'Halo Sahabat Madani! Siap bermain?';

  return (
    <section className="duo-unit-banner bg-gradient-to-br from-[#FFD324] via-[#FFC800] to-[#F59E0B] rounded-3xl mb-8 p-5 sm:p-8 lg:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 shadow-sm">
      {/* 1. Halo Putih Utama (Spotlight Backdrop) Melingkar Presisi di Belakang Maskot */}
      <div className="hidden sm:block absolute -right-16 -bottom-20 lg:-right-24 lg:-bottom-28 w-[340px] h-[340px] lg:w-[480px] lg:h-[480px] rounded-full bg-white/20 pointer-events-none" />
      {/* 2. Piringan Lembut Konsentris (Warm Cream Disc) */}
      <div className="hidden sm:block absolute -right-8 -bottom-12 lg:-right-14 lg:-bottom-20 w-[260px] h-[260px] lg:w-[380px] lg:h-[380px] rounded-full bg-[#FFFBEB]/30 pointer-events-none" />
      {/* 3. Lingkaran Penyeimbang Komposisi di Kiri Atas */}
      <div className="absolute -left-16 -top-16 w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-white/15 pointer-events-none" />

      {/* Kiri: Tipografi Elegan & Bebas Tabrakan Teks di Tablet maupun HP */}
      <div className="relative z-10 flex-1 min-w-0 max-w-xl text-center md:text-left">
        <h1 className="font-duo-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E293B] leading-tight tracking-tight">
          {headline}
        </h1>
        <p className="text-[#334155] text-xs sm:text-sm lg:text-base font-bold mt-2.5 leading-relaxed">
          {subheadline}
        </p>
      </div>

      {/* Kanan: Maskot Burung Hantu Skalabel HP / Tablet / Laptop */}
      <div className="relative z-10 flex flex-col items-center md:items-end shrink-0 pointer-events-auto">
        {activeGreeting && (
          <div className="duo-speech-bubble mb-2 text-xs sm:text-sm font-black text-[#1E293B] flex items-center gap-1.5 shadow-md animate-bubble-float max-w-[260px] sm:max-w-xs text-center md:text-right">
            <span>{activeGreeting}</span>
            <Icon name="star" className="w-4 h-4 text-[#F59E0B] shrink-0" />
          </div>
        )}

        <div
          className="relative flex items-center justify-center cursor-pointer animate-mascot-waddle"
          title="Maskot DuniaMadani"
        >
          {/* Diffuse White Radial Glow di Belakang Maskot */}
          <div className="absolute inset-0 m-auto w-44 h-44 sm:w-56 sm:h-56 lg:w-72 lg:h-72 rounded-full bg-white/25 blur-2xl pointer-events-none -z-10" />

          {/* Maskot Vector SVG */}
          <div style={{ filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.15))' }}>
            <Icon name="mascot" className="w-40 h-40 sm:w-52 sm:h-52 md:w-56 md:h-56 lg:w-72 lg:h-72" />
          </div>
        </div>
      </div>
    </section>
  );
};
