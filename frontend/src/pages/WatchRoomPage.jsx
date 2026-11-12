import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { curriculumService } from '../services/curriculumService';
import {
  PublicHeader,
  PublicFooter,
  VideoPlayer,
  QuizOverlay,
  CelebrationScreen,
  Button,
  BackButton,
  Breadcrumb,
  EmptyState,
  LicenseModal
} from '../components';
import { MaterialIcon } from '../utils/icons';

export const WatchRoomPage = () => {
  const { subthemeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoPlayerRef = useRef(null);

  const [activeCuePoint, setActiveCuePoint] = useState(null);
  const [completedCuePointIds, setCompletedCuePointIds] = useState(new Set());
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  const { data: configRes } = useQuery({
    queryKey: ['siteConfig'],
    queryFn: () => curriculumService.getSiteConfig()
  });

  const { data: subRes, isLoading } = useQuery({
    queryKey: ['subtheme', subthemeId],
    queryFn: () => curriculumService.getSubthemeById(subthemeId)
  });

  const siteConfig = configRes?.data || {};
  const found = subRes?.data;
  const theme = found?.theme;
  const subthemeGroup = found?.subthemeGroup;
  const subtheme = found?.subtheme;
  const cuePoints = subtheme?.cue_points || [];

  // Reset state saat berganti video
  useEffect(() => {
    setActiveCuePoint(null);
    setCompletedCuePointIds(new Set());
    setIsCelebrationOpen(false);
  }, [subthemeId]);

  // Tangani saat cue point terpicu
  const handleCuePointTrigger = (cp) => {
    setActiveCuePoint(cp);
  };

  const handleQuizComplete = () => {
    if (activeCuePoint) {
      setCompletedCuePointIds((prev) => new Set([...prev, activeCuePoint.id]));
    }
    setActiveCuePoint(null);
    // Otomatis lanjutkan pemutaran video setelah kuis selesai
    setTimeout(() => {
      videoPlayerRef.current?.playVideo();
    }, 150);
  };

  const handleQuizSkip = () => {
    if (activeCuePoint) {
      setCompletedCuePointIds((prev) => new Set([...prev, activeCuePoint.id]));
    }
    setActiveCuePoint(null);
    setTimeout(() => {
      videoPlayerRef.current?.playVideo();
    }, 150);
  };

  const handleVideoEnded = () => {
    setIsCelebrationOpen(true);
  };

  const handleReplay = () => {
    setIsCelebrationOpen(false);
    setActiveCuePoint(null);
    setCompletedCuePointIds(new Set());
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(0);
      videoPlayerRef.current.playVideo();
    }
  };

  const handleFinish = () => {
    setIsCelebrationOpen(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (theme) {
      navigate(`/tema/${theme.slug || theme.id}`);
    } else {
      navigate('/');
    }
  };

  const videoTitle = subtheme?.judul_video || subtheme?.judul_subtema || 'Video Pembelajaran';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBF9F5]">
      <div>
        <PublicHeader siteConfig={siteConfig} />

        <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {/* Bar Navigasi Atas (Konsisten: Tombol Back Pintar + Breadcrumb + Lisensi) */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <BackButton
                fallbackTo={theme ? `/tema/${theme.slug || theme.id}` : '/'}
                fallbackLabel={theme ? 'Kembali ke Tema' : 'Kembali ke Beranda'}
              />

              <Breadcrumb
                className="hidden sm:flex"
                items={[
                  { label: 'Beranda', to: '/' },
                  ...(theme ? [{ label: theme.judul_tema, to: `/tema/${theme.slug || theme.id}` }] : []),
                  ...(subthemeGroup ? [{ label: subthemeGroup.judul_subtema }] : []),
                  { label: videoTitle }
                ]}
              />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsLicenseModalOpen(true)}
              icon={<MaterialIcon name="info" className="text-base text-[#64748B]" />}
            >
              Sumber & Lisensi
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="w-full aspect-video duo-card animate-pulse bg-slate-100" />
              <div className="h-20 duo-card animate-pulse bg-slate-100" />
            </div>
          ) : !subtheme ? (
            <EmptyState
              materialIcon="error_outline"
              title="Video Pembelajaran Tidak Ditemukan"
              description="Video yang Anda cari mungkin belum tersedia atau telah dipindahkan."
              action={
                <Link to="/">
                  <Button size="md" variant="primary">
                    Kembali ke Beranda
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-6">
              {/* Judul & Meta Informasi Video (Quiet Chrome) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#64748B]">
                    {subthemeGroup && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#F7F7F7] text-[#4B4B4B] border border-[#E5E5E5]">
                        {subthemeGroup.judul_subtema}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                      {subtheme.label_episode || 'Video Pembelajaran'}
                    </span>
                  </div>
                  <h1 className="font-duo-display text-2xl sm:text-3xl font-bold text-slate-800">
                    {videoTitle}
                  </h1>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-xl border border-[#A7F3D0] flex items-center gap-1.5">
                    <MaterialIcon name="check_circle" className="text-base text-[#10B981]" />
                    <span className="tabular-nums font-mono font-bold">{completedCuePointIds.size}</span> dari{' '}
                    <span className="tabular-nums font-mono font-bold">{cuePoints.length}</span> Kuis Selesai
                  </span>
                </div>
              </div>

              {/* Video Player Centerpiece (Paling Utama di Layar) */}
              <VideoPlayer
                ref={videoPlayerRef}
                videoId={subtheme.youtube_video_id}
                duration={subtheme.durasi_detik || 180}
                cuePoints={cuePoints}
                completedCuePointIds={completedCuePointIds}
                activeCuePoint={activeCuePoint}
                onCuePointTrigger={handleCuePointTrigger}
                onVideoEnded={handleVideoEnded}
                overlayChildren={
                  <>
                    {activeCuePoint && (
                      <QuizOverlay
                        cuePoint={activeCuePoint}
                        onComplete={handleQuizComplete}
                        onSkip={handleQuizSkip}
                      />
                    )}
                    <CelebrationScreen
                      isOpen={isCelebrationOpen}
                      title={siteConfig.celebration_title}
                      description={siteConfig.celebration_desc}
                      replayLabel={siteConfig.celebration_replay_btn}
                      finishLabel={siteConfig.celebration_finish_btn}
                      onReplay={handleReplay}
                      onFinish={handleFinish}
                    />
                  </>
                }
              />

              {/* Deskripsi Singkat Cerita Materi (Quiet Chrome & Unslop) */}
              {subtheme.deskripsi_singkat && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-500">
                    Tentang Video Ini
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
                    {subtheme.deskripsi_singkat}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal Lisensi & Hak Cipta (Komponen Ekstraksi Reusable) */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        subtheme={subtheme}
      />

      <PublicFooter siteConfig={siteConfig} />
    </div>
  );
};
