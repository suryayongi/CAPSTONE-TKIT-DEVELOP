import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { curriculumService } from '../services/curriculumService';
import {
  PublicHeader,
  PublicFooter,
  EpisodeCard,
  Button,
  BackButton,
  Breadcrumb,
  SubthemeFilterTabs,
  EmptyState
} from '../components';
import { Icon, MaterialIcon } from '../utils/icons';

export const ThemeDetailPage = () => {
  const { slug } = useParams();
  const [selectedSubthemeId, setSelectedSubthemeId] = useState('ALL');

  const { data: configRes } = useQuery({
    queryKey: ['siteConfig'],
    queryFn: () => curriculumService.getSiteConfig()
  });

  const { data: themeRes, isLoading } = useQuery({
    queryKey: ['theme', slug],
    queryFn: () => curriculumService.getThemeBySlug(slug)
  });

  const siteConfig = configRes?.data || {};
  const theme = themeRes?.data;
  const subGroups = (theme && theme.subthemes) || [];
  const bgHex = theme?.warna_tema || theme?.warna_hex || '#0EA5E9';

  const totalVideos = subGroups.reduce(
    (acc, g) => acc + ((g.videos && g.videos.length) || 0),
    0
  );
  const totalQuizzes = subGroups.reduce(
    (acc, g) =>
      acc +
      (g.videos || []).reduce(
        (vAcc, v) => vAcc + ((v.cue_points && v.cue_points.length) || 0),
        0
      ),
    0
  );

  const visibleGroups =
    selectedSubthemeId === 'ALL'
      ? subGroups
      : subGroups.filter((g) => g.id === selectedSubthemeId);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBF9F5]">
      <div>
        <PublicHeader siteConfig={siteConfig} />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {/* Bar Navigasi Atas (Konsisten: Tombol Back Pintar + Breadcrumb) */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <BackButton
              fallbackTo="/"
              fallbackLabel={siteConfig.theme_back_label || 'Kembali ke Katalog Tema'}
            />

            {theme && (
              <Breadcrumb
                items={[
                  { label: 'Beranda', to: '/' },
                  { label: theme.judul_tema }
                ]}
              />
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="duo-card h-48 animate-pulse bg-slate-100" />
              <div className="duo-card h-32 animate-pulse bg-slate-100" />
            </div>
          ) : !theme ? (
            <EmptyState
              materialIcon="error_outline"
              title="Tema Tidak Ditemukan"
              description="Tema yang Anda cari mungkin belum tersedia atau telah dipindahkan."
              action={
                <Link to="/">
                  <Button variant="primary">Kembali ke Beranda</Button>
                </Link>
              }
            />
          ) : (
            <>
              {/* Unit Header Banner Tema (100% Intact / Unaltered) */}
              <div
                className="duo-unit-banner mb-8 p-6 sm:p-8 relative overflow-hidden"
                style={{ backgroundColor: bgHex }}
              >
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="max-w-xl text-center md:text-left">
                    <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-black/15 text-white text-xs font-extrabold uppercase tracking-wider mb-3">
                      <MaterialIcon name="school" className="text-sm" />
                      <span>Tema Pembelajaran</span>
                      {theme.rentang_usia && <span>• {theme.rentang_usia}</span>}
                    </div>
                    <h1 className="font-duo-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                      {theme.judul_tema}
                    </h1>
                    <p className="text-sm sm:text-base font-bold text-white/95 mt-2 leading-relaxed">
                      {theme.deskripsi}
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3 text-xs font-bold text-white/90">
                      <span>{subGroups.length} Sub Tema</span>
                      <span>•</span>
                      <span>{totalVideos} Video Pembelajaran</span>
                      <span>•</span>
                      <span>{totalQuizzes} Kuis Interaktif</span>
                    </div>
                  </div>

                  {/* Ikon Tema Berkarakter dengan Kanvas Geometris Halus (Unslop) */}
                  <div className="relative z-10 shrink-0 self-center my-auto flex items-center justify-center pointer-events-none">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center shadow-lg transition-transform duration-300">
                      <Icon name={theme.ikon_emoji || 'star'} className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtema Selector Tab Bar (Komponen Ekstraksi Reusable) */}
              <SubthemeFilterTabs
                subGroups={subGroups}
                selectedSubthemeId={selectedSubthemeId}
                onSelectSubtheme={setSelectedSubthemeId}
                totalVideos={totalVideos}
              />

              {/* Daftar Subtema & Koleksi Video (Hierarki Bersih & Langsung) */}
              <div className="space-y-8">
                {visibleGroups.length === 0 ? (
                  <EmptyState
                    compact
                    materialIcon="inbox"
                    title="Belum Ada Subtema"
                    description="Belum ada subtema dan video pada tema ini."
                  />
                ) : (
                  visibleGroups.map((group, gIdx) => {
                    const videos = group.videos || [];
                    return (
                      <section key={group.id} className="space-y-4">
                        {/* Header Kelompok Subtema yang Rapi (Tanpa Nested Box Luar yang Berat) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#E5E5E5]">
                          <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-[#0EA5E9] block mb-0.5">
                              Subtema {group.urutan || gIdx + 1}
                            </span>
                            <h3 className="font-duo-display text-2xl sm:text-3xl font-bold text-[#1E293B]">
                              {group.judul_subtema}
                            </h3>
                            {group.deskripsi_subtema && (
                              <p className="text-xs sm:text-sm font-bold text-[#64748B] mt-1 leading-relaxed">
                                {group.deskripsi_subtema}
                              </p>
                            )}
                          </div>

                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F7F7F7] border-2 border-[#E5E5E5] text-xs font-extrabold text-[#4B4B4B] self-start sm:self-center shrink-0">
                            <MaterialIcon name="smart_display" className="text-sm text-[#0EA5E9]" />
                            <span>{videos.length} Video</span>
                          </span>
                        </div>

                        {/* Daftar Video Taktil (.duo-tile) */}
                        {videos.length === 0 ? (
                          <EmptyState
                            compact
                            materialIcon="smart_display"
                            title="Belum Ada Video"
                            description="Belum ada video pada subtema ini."
                          />
                        ) : (
                          <div className="space-y-4">
                            {videos.map((vid, vIdx) => (
                              <EpisodeCard
                                key={vid.id}
                                episode={vid}
                                subthemeTitle={group.judul_subtema}
                                showSubthemeBadge={selectedSubthemeId === 'ALL' && subGroups.length > 1}
                                playLabel={siteConfig.episode_play_label || 'Putar Video'}
                                index={vIdx}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>
      </div>

      <PublicFooter siteConfig={siteConfig} />
    </div>
  );
};
