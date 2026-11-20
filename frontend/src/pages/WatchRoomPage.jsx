import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { curriculumService } from '../services/curriculumService';
import { pjjService } from '../services/pjjService';
import { resolveClosingGameConfig, PREDICATE_META } from '../utils/closingGame';
import {
  PublicHeader,
  PublicFooter,
  VideoPlayer,
  QuizOverlay,
  ClosingGameOverlay,
  PjjCheckinOverlay,
  CelebrationScreen,
  Button,
  BackButton,
  Breadcrumb,
  EmptyState,
  LicenseModal,
  useToast
} from '../components';
import { MaterialIcon } from '../utils/icons';

export const WatchRoomPage = () => {
  const { subthemeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const videoPlayerRef = useRef(null);
  const { showToast } = useToast();

  const [activeCuePoint, setActiveCuePoint] = useState(null);
  const [completedCuePointIds, setCompletedCuePointIds] = useState(new Set());
  const [hadQuizRetry, setHadQuizRetry] = useState(false);

  // Alur Penutup Akhir Video (Poin 5 & Poin 6)
  const [isClosingGameOpen, setIsClosingGameOpen] = useState(false);
  const [closingGameDone, setClosingGameDone] = useState(false);
  const [isPjjModalOpen, setIsPjjModalOpen] = useState(false);
  const [isSubmittingPjj, setIsSubmittingPjj] = useState(false);
  const [finalPredicate, setFinalPredicate] = useState('EXCELLENT');
  const [pjjSubmittedMeta, setPjjSubmittedMeta] = useState(null);

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

  const closingGameConfig = useMemo(
    () => (subtheme ? resolveClosingGameConfig(subtheme, theme) : null),
    [subtheme, theme]
  );

  // Reset state saat berganti video
  useEffect(() => {
    setActiveCuePoint(null);
    setCompletedCuePointIds(new Set());
    setHadQuizRetry(false);
    setIsClosingGameOpen(false);
    setClosingGameDone(false);
    setIsPjjModalOpen(false);
    setFinalPredicate('EXCELLENT');
    setPjjSubmittedMeta(null);
    setIsCelebrationOpen(false);
  }, [subthemeId]);

  const handleCuePointTrigger = (cp) => {
    setActiveCuePoint(cp);
  };

  const handleQuizComplete = (meta = {}) => {
    if (meta?.hadWrongAttempt) {
      setHadQuizRetry(true);
    }
    if (activeCuePoint) {
      setCompletedCuePointIds((prev) => new Set([...prev, activeCuePoint.id]));
    }
    setActiveCuePoint(null);
    setTimeout(() => {
      videoPlayerRef.current?.playVideo();
    }, 150);
  };

  const handleQuizSkip = () => {
    setHadQuizRetry(true);
    if (activeCuePoint) {
      setCompletedCuePointIds((prev) => new Set([...prev, activeCuePoint.id]));
    }
    setActiveCuePoint(null);
    setTimeout(() => {
      videoPlayerRef.current?.playVideo();
    }, 150);
  };

  const proceedAfterClosingGame = (nextPredicate) => {
    setFinalPredicate(nextPredicate);
    setIsClosingGameOpen(false);
    setClosingGameDone(true);

    if (subtheme?.is_pjj_enabled) {
      setIsPjjModalOpen(true);
    } else {
      setIsCelebrationOpen(true);
    }
  };

  const handleVideoEnded = () => {
    if (closingGameConfig) {
      setIsClosingGameOpen(true);
    } else {
      proceedAfterClosingGame(hadQuizRetry ? 'GOOD' : 'EXCELLENT');
    }
  };

  const handleClosingGameComplete = (gamePredicate) => {
    const combined =
      !hadQuizRetry && gamePredicate === 'EXCELLENT' ? 'EXCELLENT' : 'GOOD';
    proceedAfterClosingGame(combined);
  };

  const handleClosingGameSkip = () => {
    proceedAfterClosingGame('GOOD');
  };

  const handlePjjSubmit = async (formValues) => {
    setIsSubmittingPjj(true);
    const res = await pjjService.submitRecord({
      theme_id: theme?.id || null,
      theme_title: theme?.judul_tema || 'Tema Pembelajaran',
      subtheme_id: subthemeGroup?.id || null,
      subtheme_title: subthemeGroup?.judul_subtema || '',
      video_id: subtheme?.id || null,
      video_title: subtheme?.judul_video || subtheme?.judul_subtema || 'Video Pembelajaran',
      student_name: formValues.student_name,
      class_name: formValues.class_name,
      predicate: formValues.predicate,
      badge_symbol: formValues.badge_symbol,
      closing_game_played: Boolean(closingGameConfig),
      notes: formValues.notes || ''
    });
    setIsSubmittingPjj(false);

    if (res.success) {
      setPjjSubmittedMeta({
        studentName: formValues.student_name,
        className: formValues.class_name
      });
      setIsPjjModalOpen(false);
      setIsCelebrationOpen(true);
    } else {
      showToast(res.message || 'Gagal menyimpan catatan PJJ, silakan coba lagi.', 'error');
    }
  };

  const handlePjjSkip = () => {
    setIsPjjModalOpen(false);
    setIsCelebrationOpen(true);
  };

  const handleReplay = () => {
    setIsCelebrationOpen(false);
    setIsClosingGameOpen(false);
    setClosingGameDone(false);
    setIsPjjModalOpen(false);
    setActiveCuePoint(null);
    setCompletedCuePointIds(new Set());
    setHadQuizRetry(false);
    setPjjSubmittedMeta(null);
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

  // Deretan Bintang Non-Numerik (1 bintang per kuis + 1 bintang permainan penutup jika aktif)
  const totalStarSlots = cuePoints.length + (closingGameConfig ? 1 : 0);
  const completedStarCount = completedCuePointIds.size + (closingGameDone ? 1 : 0);
  const activePredLabel =
    totalStarSlots > 0 && completedStarCount >= totalStarSlots
      ? PREDICATE_META[finalPredicate]?.label || 'Excellent'
      : completedStarCount > 0
      ? 'Bagus'
      : 'Siap Belajar';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBF9F5]">
      <div>
        <PublicHeader siteConfig={siteConfig} />

        <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {/* Bar Navigasi Atas */}
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
              {/* Judul & Simbol Bintang Kemajuan (Bebas Skor Angka) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                    {subthemeGroup && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-100 text-slate-700 border border-stone-200">
                        {subthemeGroup.judul_subtema}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                      {subtheme.label_episode || 'Video Pembelajaran'}
                    </span>
                    {subtheme.is_pjj_enabled && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                        <MaterialIcon name="home" className="text-sm" />
                        <span>Mode PJJ</span>
                      </span>
                    )}
                  </div>
                  <h1 className="font-duo-display text-2xl sm:text-3xl font-bold text-slate-800">
                    {videoTitle}
                  </h1>
                </div>

                {/* Indikator Simbol Bintang Tanpa Angka */}
                {totalStarSlots > 0 && (
                  <div
                    className="flex items-center gap-2 shrink-0 self-start sm:self-center px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs"
                    aria-label={`Bintang pencapaian: ${activePredLabel}`}
                  >
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: totalStarSlots }).map((_, idx) => {
                        const isLit = idx < completedStarCount;
                        return (
                          <MaterialIcon
                            key={idx}
                            name={isLit ? 'star' : 'star_outline'}
                            className={`text-xl ${isLit ? 'text-amber-400' : 'text-slate-300'}`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-xs font-bold text-slate-700 border-l border-slate-200 pl-2">
                      {activePredLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* Video Player Centerpiece */}
              <VideoPlayer
                ref={videoPlayerRef}
                videoId={subtheme.youtube_video_id}
                duration={subtheme.durasi_detik || 180}
                cuePoints={cuePoints}
                completedCuePointIds={completedCuePointIds}
                activeCuePoint={activeCuePoint}
                onCuePointTrigger={handleCuePointTrigger}
                onVideoEnded={handleVideoEnded}
                hasActiveOverlay={Boolean(
                  activeCuePoint || isClosingGameOpen || isPjjModalOpen || isCelebrationOpen
                )}
                overlayChildren={
                  <>
                    {activeCuePoint && (
                      <QuizOverlay
                        cuePoint={activeCuePoint}
                        onComplete={handleQuizComplete}
                        onSkip={handleQuizSkip}
                      />
                    )}

                    <ClosingGameOverlay
                      isOpen={isClosingGameOpen}
                      gameConfig={closingGameConfig}
                      onComplete={handleClosingGameComplete}
                      onSkip={handleClosingGameSkip}
                    />

                    <PjjCheckinOverlay
                      isOpen={isPjjModalOpen}
                      videoTitle={videoTitle}
                      pjjNote={subtheme.pjj_notes || siteConfig.pjj_form_note}
                      classInputMode={siteConfig.pjj_class_input_mode || 'TEXT'}
                      classOptions={siteConfig.pjj_classes}
                      predicate={finalPredicate}
                      isSubmitting={isSubmittingPjj}
                      onSubmit={handlePjjSubmit}
                      onSkip={handlePjjSkip}
                    />

                    <CelebrationScreen
                      isOpen={isCelebrationOpen}
                      title={siteConfig.celebration_title}
                      description={siteConfig.celebration_desc}
                      replayLabel={siteConfig.celebration_replay_btn}
                      finishLabel={siteConfig.celebration_finish_btn}
                      predicate={finalPredicate}
                      studentName={pjjSubmittedMeta?.studentName || ''}
                      className={pjjSubmittedMeta?.className || ''}
                      onReplay={handleReplay}
                      onFinish={handleFinish}
                    />
                  </>
                }
              />

              {/* Deskripsi Singkat & Notes PJJ (jika aktif) */}
              <div className="space-y-3">
                {subtheme.is_pjj_enabled && (
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 flex items-start gap-3">
                    <MaterialIcon name="assignment_ind" className="text-xl text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-sky-800 block">
                        Informasi Pembelajaran Jarak Jauh (PJJ)
                      </span>
                      <p className="text-xs sm:text-sm font-medium text-slate-700 mt-0.5 leading-relaxed">
                        {subtheme.pjj_notes || siteConfig.pjj_form_note}
                      </p>
                    </div>
                  </div>
                )}

                {subtheme.deskripsi_singkat && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <h3 className="text-xs font-bold text-slate-500">
                      Tentang Video Ini
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
                      {subtheme.deskripsi_singkat}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Lisensi & Hak Cipta */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        subtheme={subtheme}
      />

      <PublicFooter siteConfig={siteConfig} />
    </div>
  );
};
