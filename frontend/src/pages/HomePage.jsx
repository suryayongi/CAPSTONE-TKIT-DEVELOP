import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { curriculumService } from '../services/curriculumService';
import {
  PublicHeader,
  PublicFooter,
  HeroBanner,
  ThemeCard,
  Button,
  EmptyState
} from '../components';
import { MaterialIcon } from '../utils/icons';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  const { data: configRes } = useQuery({
    queryKey: ['siteConfig'],
    queryFn: () => curriculumService.getSiteConfig()
  });

  const { data: themesRes, isLoading: isThemesLoading } = useQuery({
    queryKey: ['themes', 'published'],
    queryFn: () => curriculumService.getThemes(true)
  });

  const siteConfig = configRes?.data || {};
  const themes = themesRes?.data || [];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBF9F5]">
      <div>
        <PublicHeader siteConfig={siteConfig} />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {/* Sambutan Beranda (Hero Banner - 100% Intact) */}
          <HeroBanner
            headline={siteConfig.banner_headline}
            subheadline={siteConfig.banner_subheadline}
            mascotGreeting={siteConfig.banner_mascot_greeting}
          />

          {/* Section Header Daftar Tema (Quiet Chrome) */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="font-duo-display text-2xl sm:text-3xl font-bold text-slate-800">
              {siteConfig.catalog_section_title || 'Pilih Tema Pembelajaran'}
            </h2>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span><span className="font-mono tabular-nums font-bold text-slate-800">{themes.length}</span> Tema Tersedia</span>
            </div>
          </div>

          {/* Grid Tema (.duo-tile dengan Hover Taktil 3D) */}
          {isThemesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="duo-card p-6 h-64 animate-pulse bg-white flex flex-col justify-between">
                  <div className="h-20 bg-slate-100 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                    <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : themes.length === 0 ? (
            <EmptyState
              icon="mascot"
              title={siteConfig.empty_catalog_title || 'Belum Ada Materi yang Ditampilkan'}
              description={siteConfig.empty_catalog_desc || 'Ibu Guru sedang menyiapkan video pembelajaran seru.'}
              action={
                <Link to="/admin/login">
                  <Button variant="primary" icon={<MaterialIcon name="school" className="text-lg" />}>
                    Buka Ruang Guru
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {themes.map((theme, idx) => (
                <ThemeCard key={theme.id} theme={theme} index={idx} />
              ))}
            </div>
          )}
        </main>
      </div>

      <PublicFooter siteConfig={siteConfig} />
    </div>
  );
};
