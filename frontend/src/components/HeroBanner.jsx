import React from 'react';
import { Icon } from '../utils/icons';

export const HeroBanner = ({
  headline = 'Ayo Mulai Petualangan Belajar Hari Ini!',
  subheadline = 'Pilih tema dan subtema belajar, tonton video seru bersama Ibu Guru, dan jawab pertanyaan kuisnya!',
  mascotGreeting = 'Halo Sahabat Madani! Siap bermain?'
}) => {
  const activeGreeting = mascotGreeting || 'Halo Sahabat Madani! Siap bermain?';

  return (
    <section className="duo-unit-banner bg-gradient-to-br from-[#FFD324] via-[#FFC800] to-[#F59E0B] rounded-3xl mb-8 p-6 sm:p-8 lg:p-10 relative overflow-hidden flex flex-col md:flex-row items-center md:items-end justify-between gap-6 md:min-h-[280px] lg:min-h-[300px] shadow-sm">
      {/* 1. Halo Putih Utama (Spotlight Backdrop) Melingkar Presisi di Belakang Maskot */}
      <div className="absolute -right-16 -bottom-20 sm:-right-20 sm:-bottom-24 lg:-right-24 lg:-bottom-28 w-[380px] h-[380px] sm:w-[440px] sm:h-[440px] lg:w-[500px] lg:h-[500px] rounded-full bg-white/20 pointer-events-none" />
      {/* 2. Piringan Lembut Konsentris (Warm Cream Disc) */}
      <div className="absolute -right-8 -bottom-12 sm:-right-12 sm:-bottom-16 lg:-right-14 lg:-bottom-20 w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] lg:w-[400px] lg:h-[400px] rounded-full bg-[#FFFBEB]/30 pointer-events-none" />
      {/* 3. Lingkaran Penyeimbang Komposisi di Kiri Atas */}
      <div className="absolute -left-16 -top-16 w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-white/15 pointer-events-none" />

      {/* Kiri: Tipografi Elegan & Proporsional */}
      <div className="relative z-10 max-w-md lg:max-w-lg text-center md:text-left md:pb-3">
        <h1 className="font-duo-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E293B] leading-tight tracking-tight">
          {headline}
        </h1>
        <p className="text-[#334155] text-xs sm:text-sm lg:text-base font-bold mt-2.5 leading-relaxed">
          {subheadline}
        </p>
      </div>

      {/* Kanan: Maskot Burung Hantu Menonjol Besar ala Duolingo */}
      <div className="relative z-10 mt-4 md:mt-0 md:absolute md:right-4 lg:right-6 md:bottom-0 flex flex-col items-center md:items-end shrink-0 pointer-events-auto">
        {activeGreeting && (
          <div className="duo-speech-bubble mb-2 mr-3 sm:mr-6 text-xs sm:text-sm font-black text-[#1E293B] flex items-center gap-1.5 shadow-md animate-bubble-float">
            <span>{activeGreeting}</span>
            <Icon name="star" className="w-4 h-4 text-[#F59E0B]" />
          </div>
        )}

        <div
          className="relative flex items-center justify-center cursor-pointer animate-mascot-waddle"
          title="Maskot DuniaMadani"
        >
          {/* Diffuse White Radial Glow di Belakang Maskot */}
          <div className="absolute inset-0 m-auto w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full bg-white/25 blur-2xl pointer-events-none -z-10" />

          {/* Maskot Vector SVG Besar ala Duolingo */}
          <div style={{ filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.15))' }}>
            <Icon name="mascot" className="w-60 h-60 sm:w-72 sm:h-72 lg:w-80 lg:h-80" />
          </div>
        </div>
      </div>
    </section>
  );
};
