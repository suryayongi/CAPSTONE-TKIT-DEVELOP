import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminLayout,
  Card,
  Button,
  BackButton,
  VideoPlayer,
  QuizOverlay,
  ClosingGameOverlay,
  ConfirmModal,
  EmptyState,
  Breadcrumb,
  CuePointItem,
  CuePointForm,
  ClosingGameForm,
  useToast
} from '../../components';
import { MaterialIcon } from '../../utils/icons';
import { curriculumService } from '../../services/curriculumService';
import { formatSecondsToMMSS, parseMMSSToSeconds } from '../../utils/formatters';
import { resolveClosingGameConfig } from '../../utils/closingGame';

export const StudioPage = () => {
  const { subId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const videoPlayerRef = useRef(null);
  const questionInputRef = useRef(null);

  // Cue point form states
  const [editingCpId, setEditingCpId] = useState('');
  const [formTime, setFormTime] = useState('00:15');
  const [formType, setFormType] = useState('MULTIPLE_CHOICE');
  const [formEmoji, setFormEmoji] = useState('question');
  const [formQuestion, setFormQuestion] = useState('');

  // Multiple Choice state
  const [mcOptions, setMcOptions] = useState([
    { label: 'Opsi Jawaban 1', emoji: 'siren' },
    { label: 'Opsi Jawaban 2', emoji: 'pan' },
    { label: '', emoji: 'milk' }
  ]);
  const [showThirdOption, setShowThirdOption] = useState(false);
  const [mcCorrectIdx, setMcCorrectIdx] = useState(0);
  const [mcFeedbackCorrect, setMcFeedbackCorrect] = useState('MasyaAllah, tepat sekali jawaban teman-teman!');
  const [mcFeedbackWrong, setMcFeedbackWrong] = useState('Hampir tepat! Yuk coba amati lagi gambarnya!');
  const [showFeedbackAccordion, setShowFeedbackAccordion] = useState(false);

  // Flashcard state
  const [fcAnswer, setFcAnswer] = useState('');

  // Action Prompt state
  const [apTimer, setApTimer] = useState(8);
  const [apExtra, setApExtra] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // In-Studio Preview Overlay state
  const [previewQuizData, setPreviewQuizData] = useState(null);

  // In-Studio & Fullscreen Alert state
  const [studioAlert, setStudioAlert] = useState(null);
  const alertTimerRef = useRef(null);

  // Fullscreen Slide-Over Drawer state
  const [isStudioDrawerOpen, setIsStudioDrawerOpen] = useState(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

  // Confirm delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Panel Kanan Tab ('quiz' | 'closing') & Pengaturan Penutup/PJJ
  const [rightTab, setRightTab] = useState('quiz');
  const [closingEnabled, setClosingEnabled] = useState(true);
  const [closingMode, setClosingMode] = useState('PAIR_MATCH');
  const [closingTitle, setClosingTitle] = useState('');
  const [closingInstruction, setClosingInstruction] = useState('');
  const [closingPairs, setClosingPairs] = useState([
    { id: 'pair-1', emoji: 'star', label: 'Bintang Hebat' },
    { id: 'pair-2', emoji: 'trophy', label: 'Piala Ceria' },
    { id: 'pair-3', emoji: 'mascot', label: 'Sahabat Madani' }
  ]);
  const [closingQuickItems, setClosingQuickItems] = useState([
    { id: 'gp-1', emoji: 'star', label: 'Gambar Tepat 1', is_correct: true },
    { id: 'gp-2', emoji: 'trophy', label: 'Gambar Tepat 2', is_correct: true },
    { id: 'gp-3', emoji: 'pan', label: 'Pengecoh 1', is_correct: false },
    { id: 'gp-4', emoji: 'helmet', label: 'Pengecoh 2', is_correct: false }
  ]);
  const [closingIsPjj, setClosingIsPjj] = useState(false);
  const [closingPjjNotes, setClosingPjjNotes] = useState('');
  const [isSavingClosing, setIsSavingClosing] = useState(false);
  const [previewClosingData, setPreviewClosingData] = useState(null);

  const triggerStudioAlert = (message, variant = 'warning', duration = 4000) => {
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    setStudioAlert({ message, variant });
    if (duration > 0) {
      alertTimerRef.current = setTimeout(() => {
        setStudioAlert(null);
      }, duration);
    }
  };

  const { data: subData, isLoading } = useQuery({
    queryKey: ['subtheme', subId],
    queryFn: () => curriculumService.getSubthemeById(subId)
  });

  const sub = subData?.data?.subtheme;
  const theme = subData?.data?.theme;
  const subthemeGroup = subData?.data?.subthemeGroup;
  const cuePoints = sub?.cue_points || [];

  useEffect(() => {
    if (!sub) return;
    setClosingIsPjj(Boolean(sub.is_pjj_enabled));
    setClosingPjjNotes(sub.pjj_notes || '');

    const raw = sub.closing_game;
    if (raw && raw.enabled === false) {
      setClosingEnabled(false);
    } else {
      setClosingEnabled(true);
    }

    const resolved = resolveClosingGameConfig({ ...sub, closing_game: raw?.enabled === false ? null : raw }, theme);
    if (resolved) {
      setClosingMode(resolved.mode || 'PAIR_MATCH');
      setClosingTitle(raw?.title || resolved.title || '');
      setClosingInstruction(raw?.instruction || resolved.instruction || '');
      if (Array.isArray(raw?.pairs) && raw.pairs.length >= 2) {
        setClosingPairs(raw.pairs);
      } else if (Array.isArray(resolved.pairs)) {
        setClosingPairs(resolved.pairs);
      }
      if (Array.isArray(raw?.items) && raw.items.length >= 2) {
        setClosingQuickItems(raw.items);
      }
    }
  }, [sub?.id]);

  const buildClosingPayload = () => {
    if (!closingEnabled) {
      return { enabled: false };
    }
    if (closingMode === 'QUICK_PICK') {
      return {
        enabled: true,
        mode: 'QUICK_PICK',
        title: closingTitle.trim() || 'Permainan Penutup: Pilih Gambar Tepat',
        instruction: closingInstruction.trim() || 'Ketuk semua gambar yang sesuai dengan cerita video tadi.',
        items: closingQuickItems.map((it, i) => ({
          id: it.id || `gp-${i + 1}`,
          emoji: it.emoji || 'star',
          label: it.label?.trim() || `Gambar ${i + 1}`,
          is_correct: Boolean(it.is_correct)
        }))
      };
    }
    return {
      enabled: true,
      mode: 'PAIR_MATCH',
      title: closingTitle.trim() || 'Permainan Penutup: Cocokkan Gambar Kembar',
      instruction: closingInstruction.trim() || 'Ketuk dua kartu gambar yang kembar untuk menyalakan bintang.',
      pairs: closingPairs.map((p, i) => ({
        id: p.id || `pair-${i + 1}`,
        emoji: p.emoji || 'star',
        label: p.label?.trim() || `Kartu ${i + 1}`
      }))
    };
  };

  const handleSaveClosingSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!sub) return;
    setIsSavingClosing(true);
    const closingPayload = buildClosingPayload();
    const res = await curriculumService.saveClosingGame(sub.id, {
      closingGame: closingPayload,
      isPjjEnabled: closingIsPjj,
      pjjNotes: closingPjjNotes.trim()
    });
    setIsSavingClosing(false);

    if (res.success) {
      queryClient.invalidateQueries();
      showToast(res.message || 'Pengaturan permainan penutup dan mode PJJ berhasil disimpan.', 'success');
    } else {
      showToast(res.message || 'Gagal menyimpan pengaturan penutup.', 'error');
    }
  };

  const handlePreviewClosingGame = () => {
    const cfg = buildClosingPayload();
    if (!cfg || cfg.enabled === false) {
      showToast('Aktifkan permainan penutup terlebih dahulu untuk melihat pratinjau.', 'info');
      return;
    }
    setPreviewClosingData(cfg);
  };

  const handleCaptureTimestamp = (sec) => {
    const formatted = formatSecondsToMMSS(sec);
    setFormTime(formatted);
    showToast(`Waktu kuis ditandai pada menit ${formatted}`, 'success', 2000);
    setTimeout(() => {
      if (!editingCpId && questionInputRef.current) {
        questionInputRef.current.focus();
      }
    }, 100);
  };

  const resetForm = () => {
    setEditingCpId('');
    setFormTime('00:15');
    setFormType('MULTIPLE_CHOICE');
    setFormEmoji('question');
    setFormQuestion('');
    setMcOptions([
      { label: '', emoji: 'siren' },
      { label: '', emoji: 'pan' },
      { label: '', emoji: 'milk' }
    ]);
    setShowThirdOption(false);
    setMcCorrectIdx(0);
    setMcFeedbackCorrect('MasyaAllah, tepat sekali jawaban teman-teman!');
    setMcFeedbackWrong('Hampir tepat! Yuk coba amati lagi gambarnya!');
    setFcAnswer('');
    setApTimer(8);
    setApExtra('');
    setShowFeedbackAccordion(false);
    setStudioAlert(null);
  };

  const loadCuePointIntoForm = (cp) => {
    setEditingCpId(cp.id);
    setFormTime(formatSecondsToMMSS(cp.detik_muncul));
    setFormType(cp.tipe_interaksi || 'MULTIPLE_CHOICE');
    setFormEmoji(cp.ikon_stimulus || 'question');
    setFormQuestion(cp.judul_pertanyaan || '');

    const p = cp.payload_interaksi || {};
    if (cp.tipe_interaksi === 'MULTIPLE_CHOICE') {
      const opts = p.options || [];
      const hasOpt3 = Boolean(opts[2] && opts[2].label);
      setShowThirdOption(hasOpt3);
      setMcOptions([
        opts[0] || { label: '', emoji: 'siren' },
        opts[1] || { label: '', emoji: 'pan' },
        opts[2] || { label: '', emoji: 'milk' }
      ]);
      const foundIdx = opts.findIndex((o) => o.is_correct);
      setMcCorrectIdx(foundIdx >= 0 ? foundIdx : 0);
      setMcFeedbackCorrect(p.feedback_benar || 'MasyaAllah, tepat sekali jawaban teman-teman!');
      setMcFeedbackWrong(p.feedback_salah || 'Hampir tepat! Yuk coba amati lagi gambarnya!');
    } else if (cp.tipe_interaksi === 'FLASHCARD_REVEAL') {
      setFcAnswer(p.jawaban_balik || '');
    } else if (cp.tipe_interaksi === 'ACTION_PROMPT') {
      setApTimer(p.timer_detik || 8);
      setApExtra(p.instruksi_tambahan || '');
    }
  };

  const handlePreviewCurrentQuiz = () => {
    if (!formQuestion.trim()) {
      triggerStudioAlert('Tuliskan kalimat pertanyaan terlebih dahulu untuk melihat pratinjau', 'warning');
      return;
    }

    setStudioAlert(null);

    let payload_interaksi = {};
    if (formType === 'MULTIPLE_CHOICE') {
      const rawOpts = [
        { id: 'opt-1', label: mcOptions[0]?.label || 'Pilihan 1', emoji: mcOptions[0]?.emoji || 'star', is_correct: mcCorrectIdx === 0 },
        { id: 'opt-2', label: mcOptions[1]?.label || 'Pilihan 2', emoji: mcOptions[1]?.emoji || 'star', is_correct: mcCorrectIdx === 1 }
      ];
      if (showThirdOption && mcOptions[2]?.label?.trim()) {
        rawOpts.push({
          id: 'opt-3',
          label: mcOptions[2].label.trim(),
          emoji: mcOptions[2]?.emoji || 'star',
          is_correct: mcCorrectIdx === 2
        });
      }
      payload_interaksi = {
        options: rawOpts,
        feedback_benar: mcFeedbackCorrect.trim() || 'MasyaAllah, tepat sekali jawaban teman-teman!',
        feedback_salah: mcFeedbackWrong.trim() || 'Hampir tepat! Yuk coba amati lagi gambarnya!'
      };
    } else if (formType === 'FLASHCARD_REVEAL') {
      payload_interaksi = {
        jawaban_balik: fcAnswer.trim() || 'Contoh Jawaban di Balik Kartu'
      };
    } else if (formType === 'ACTION_PROMPT') {
      payload_interaksi = {
        timer_detik: parseInt(apTimer, 10) || 8,
        instruksi_tambahan: apExtra.trim() || 'Ayo tirukan gerakannya!'
      };
    }

    setPreviewQuizData({
      id: 'preview-quiz',
      detik_muncul: parseMMSSToSeconds(formTime),
      tipe_interaksi: formType,
      judul_pertanyaan: formQuestion.trim(),
      ikon_stimulus: formEmoji,
      payload_interaksi
    });
  };

  const handleSaveCuePoint = async (e) => {
    e.preventDefault();
    if (!formQuestion.trim()) {
      triggerStudioAlert('Mohon tuliskan kalimat pertanyaan kuis terlebih dahulu', 'warning');
      return;
    }

    let payload_interaksi = {};
    if (formType === 'MULTIPLE_CHOICE') {
      if (!mcOptions[0]?.label?.trim() || !mcOptions[1]?.label?.trim()) {
        triggerStudioAlert('Pilihan bergambar membutuhkan minimal 2 opsi jawaban', 'warning');
        return;
      }

      const rawOpts = [
        { label: mcOptions[0].label.trim(), emoji: mcOptions[0]?.emoji || 'siren' },
        { label: mcOptions[1].label.trim(), emoji: mcOptions[1]?.emoji || 'pan' }
      ];
      if (showThirdOption && mcOptions[2]?.label?.trim()) {
        rawOpts.push({
          label: mcOptions[2].label.trim(),
          emoji: mcOptions[2]?.emoji || 'milk'
        });
      }

      let correct = mcCorrectIdx;
      if (correct >= rawOpts.length) correct = 0;

      payload_interaksi = {
        options: rawOpts.map((o, idx) => ({
          id: `opt-${idx + 1}`,
          label: o.label,
          emoji: o.emoji,
          is_correct: idx === correct
        })),
        feedback_benar: mcFeedbackCorrect.trim() || 'MasyaAllah, tepat sekali jawaban teman-teman!',
        feedback_salah: mcFeedbackWrong.trim() || 'Hampir tepat! Yuk coba amati lagi gambarnya!'
      };
    } else if (formType === 'FLASHCARD_REVEAL') {
      if (!fcAnswer.trim()) {
        showToast('Mohon isi teks jawaban di balik kartu', 'warning');
        return;
      }
      payload_interaksi = {
        jawaban_balik: fcAnswer.trim()
      };
    } else if (formType === 'ACTION_PROMPT') {
      payload_interaksi = {
        timer_detik: parseInt(apTimer, 10) || 8,
        instruksi_tambahan: apExtra.trim()
      };
    }

    setIsSaving(true);
    const payload = {
      id: editingCpId || undefined,
      detik_muncul: formTime.trim(),
      tipe_interaksi: formType,
      judul_pertanyaan: formQuestion.trim(),
      ikon_stimulus: formEmoji,
      payload_interaksi
    };

    const res = await curriculumService.saveCuePoint(sub.id, payload);
    setIsSaving(false);

    if (res.success) {
      queryClient.invalidateQueries();
      showToast(
        editingCpId ? 'Pertanyaan kuis berhasil diperbarui' : 'Pertanyaan kuis baru berhasil disimpan',
        'success'
      );
      resetForm();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const res = await curriculumService.deleteCuePoint(sub.id, deleteTargetId);
    if (res.success) {
      queryClient.invalidateQueries();
      showToast('Pertanyaan kuis berhasil dihapus', 'success');
      if (editingCpId === deleteTargetId) {
        resetForm();
      }
    } else {
      showToast(res.message, 'error');
    }
    setDeleteTargetId(null);
  };

  if (isLoading) {
    return (
      <AdminLayout maxWidth="max-w-[1536px]">
        <div className="p-12 text-center text-[#777777] font-bold">
          Memuat ruang pembuat kuis video...
        </div>
      </AdminLayout>
    );
  }

  if (!sub || !theme) {
    return (
      <AdminLayout maxWidth="max-w-[1536px]">
        <EmptyState
          materialIcon="error_outline"
          title="Video Pembelajaran Tidak Ditemukan"
          description="Video yang Anda cari mungkin belum tersedia atau telah dipindahkan."
          action={
            <Button size="sm" variant="primary" onClick={() => navigate('/admin/tema')}>
              Kembali ke Daftar Tema
            </Button>
          }
        />
      </AdminLayout>
    );
  }

  const videoTitle = sub.judul_video || sub.judul_subtema;

  const cuePointFormProps = {
    editingCpId,
    formTime,
    setFormTime,
    formType,
    setFormType,
    formEmoji,
    setFormEmoji,
    formQuestion,
    setFormQuestion: (val) => {
      setFormQuestion(val);
      if (studioAlert) setStudioAlert(null);
    },
    questionInputRef,
    mcOptions,
    setMcOptions,
    showThirdOption,
    setShowThirdOption,
    mcCorrectIdx,
    setMcCorrectIdx,
    mcFeedbackCorrect,
    setMcFeedbackCorrect,
    mcFeedbackWrong,
    setMcFeedbackWrong,
    showFeedbackAccordion,
    setShowFeedbackAccordion,
    fcAnswer,
    setFcAnswer,
    apTimer,
    setApTimer,
    apExtra,
    setApExtra,
    isSaving,
    alert: studioAlert,
    onCloseAlert: () => setStudioAlert(null),
    onSave: handleSaveCuePoint,
    onReset: resetForm,
    onPreview: handlePreviewCurrentQuiz
  };

  return (
    <AdminLayout maxWidth="max-w-[1536px]">
      {/* Bar Navigasi Atas (Konsisten: Tombol Back Pintar + Breadcrumb + Tautan Ruang Tonton) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <BackButton
            fallbackTo={`/admin/tema/${encodeURIComponent(theme.id)}`}
            fallbackLabel="Kembali ke Kelola Video"
          />

          <Breadcrumb
            items={[
              { label: 'Daftar Tema', to: '/admin/tema' },
              { label: theme.judul_tema, to: `/admin/tema/${encodeURIComponent(theme.id)}` },
              ...(subthemeGroup ? [{ label: subthemeGroup.judul_subtema }] : []),
              { label: videoTitle }
            ]}
          />
        </div>

        <Link
          to={`/tonton/${encodeURIComponent(sub.id)}`}
          state={{ from: location.pathname, fromLabel: 'Kembali ke Studio Kuis' }}
          className="shrink-0"
        >
          <Button
            size="sm"
            variant="secondary"
            icon={<MaterialIcon name="smart_display" className="text-base" />}
          >
            Lihat Ruang Tonton Siswa
          </Button>
        </Link>
      </div>

      {/* HeaderJudul Video & Ringkasan Cara Kerja */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#F7F7F7] border border-[#E2E8F0] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#EDE9FE] border border-[#C4B5FD] text-[#6D28D9] text-xs font-extrabold mb-1">
            <MaterialIcon name="movie_edit" className="text-sm" />
            <span>Studio Pembuat Kuis Interaktif</span>
          </div>
          <h1 className="font-duo-display text-xl sm:text-2xl font-bold text-[#1E293B] truncate">
            {videoTitle}
          </h1>
        </div>

        <div className="text-xs font-bold text-[#64748B] shrink-0">
          <span>Putar video, klik <b>+ Tandai Kuis</b>, isi pertanyaan, dan simpan langsung ke timeline.</span>
        </div>
      </div>

      {/* Layout Utama 2 Kolom Lebar (Anti-Overflow dengan min-w-0) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 xl:gap-6 items-start min-w-0">
        {/* KOLOM KIRI (7/12): Pemutar Video Minimalis + Daftar Pertanyaan Terpasang */}
        <div className="xl:col-span-7 space-y-5 min-w-0">
          <VideoPlayer
            ref={videoPlayerRef}
            videoId={sub.youtube_video_id}
            duration={sub.durasi_detik || 210}
            cuePoints={cuePoints}
            isStudioMode={true}
            editingCuePointId={editingCpId}
            onCaptureTimestamp={handleCaptureTimestamp}
            onSelectCuePoint={(cp) => loadCuePointIntoForm(cp)}
            isStudioDrawerOpen={isStudioDrawerOpen}
            onToggleStudioDrawer={setIsStudioDrawerOpen}
            onFullscreenChange={setIsVideoFullscreen}
            hasActiveOverlay={Boolean(isVideoFullscreen && previewQuizData)}
            studioDrawerContent={
              <div className="space-y-6 min-w-0">
                <CuePointForm {...cuePointFormProps} />

                {/* Daftar Ringkas Pertanyaan di Dalam Pop-up Fullscreen */}
                {cuePoints.length > 0 && (
                  <div className="pt-4 border-t-2 border-[#E5E5E5] space-y-3 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-duo-display text-sm font-bold text-[#1E293B]">
                        Daftar Kuis Terpasang ({cuePoints.length})
                      </h4>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-xs font-extrabold text-[#7C3AED] hover:underline cursor-pointer"
                      >
                        + Buat Soal Baru
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {cuePoints.map((cp, idx) => (
                        <CuePointItem
                          key={cp.id}
                          cuePoint={cp}
                          index={idx}
                          isEditing={editingCpId === cp.id}
                          onSelect={(selected) => loadCuePointIntoForm(selected)}
                          onDelete={(id) => setDeleteTargetId(id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            }
            overlayChildren={
              isVideoFullscreen &&
              previewQuizData && (
                <QuizOverlay
                  isPreview={true}
                  cuePoint={previewQuizData}
                  onComplete={() => setPreviewQuizData(null)}
                  onSkip={() => setPreviewQuizData(null)}
                />
              )
            }
          />

          {/* Daftar Pertanyaan Kuis pada Video Ini */}
          <Card className="p-5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="font-duo-display text-lg font-bold text-[#1E293B] flex items-center gap-2">
                  <MaterialIcon name="quiz" className="text-xl text-[#8B5CF6]" />
                  <span>Daftar Pertanyaan di Video Ini ({cuePoints.length})</span>
                </h2>
                <p className="text-xs font-bold text-[#64748B]">
                  Klik salah satu kartu soal untuk menyunting atau melompat ke menit kuis tersebut
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={resetForm}
                icon={<MaterialIcon name="add" className="text-base" />}
              >
                Soal Baru
              </Button>
            </div>

            <div className="space-y-3 min-w-0">
              {cuePoints.length === 0 ? (
                <EmptyState
                  compact
                  materialIcon="quiz"
                  title="Belum Ada Pertanyaan di Video Ini"
                  description="Putar video di atas, lalu klik tombol kuning '+ Tandai Kuis' pada menit materi yang ingin ditanyakan."
                />
              ) : (
                cuePoints.map((cp, idx) => (
                  <CuePointItem
                    key={cp.id}
                    cuePoint={cp}
                    index={idx}
                    isEditing={editingCpId === cp.id}
                    onSelect={(selected) => {
                      loadCuePointIntoForm(selected);
                      setRightTab('quiz');
                      if (videoPlayerRef.current?.seekTo) {
                        videoPlayerRef.current.seekTo(selected.detik_muncul);
                        videoPlayerRef.current.pauseVideo();
                      }
                    }}
                    onDelete={(id) => setDeleteTargetId(id)}
                  />
                ))
              )}
            </div>
          </Card>
        </div>

        {/* KOLOM KANAN (5/12): Tab Kuis Timeline & Pengaturan Penutup/PJJ */}
        <div className="xl:col-span-5 min-w-0">
          <Card className="p-5 sm:p-6 min-w-0 space-y-5">
            {/* Switch Tab Bersih (Quiet Chrome) */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setRightTab('quiz')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  rightTab === 'quiz'
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <MaterialIcon name="quiz" className="text-base text-violet-600" />
                <span>Kuis Timeline</span>
              </button>
              <button
                type="button"
                onClick={() => setRightTab('closing')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  rightTab === 'closing'
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <MaterialIcon name="sports_esports" className="text-base text-amber-600" />
                <span>Penutup & Mode PJJ</span>
              </button>
            </div>

            {rightTab === 'quiz' ? (
              <CuePointForm {...cuePointFormProps} />
            ) : (
              <ClosingGameForm
                gameEnabled={closingEnabled}
                setGameEnabled={setClosingEnabled}
                gameMode={closingMode}
                setGameMode={setClosingMode}
                gameTitle={closingTitle}
                setGameTitle={setClosingTitle}
                gameInstruction={closingInstruction}
                setGameInstruction={setClosingInstruction}
                pairs={closingPairs}
                setPairs={setClosingPairs}
                quickItems={closingQuickItems}
                setQuickItems={setClosingQuickItems}
                isPjjEnabled={closingIsPjj}
                setIsPjjEnabled={setClosingIsPjj}
                pjjNotes={closingPjjNotes}
                setPjjNotes={setClosingPjjNotes}
                isSaving={isSavingClosing}
                onSave={handleSaveClosingSettings}
                onPreview={handlePreviewClosingGame}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Modal Pratinjau Soal di Layar Utama (Saat Tidak Fullscreen: Ukuran Asli 1:1 Ruang Tonton Siswa) */}
      {!isVideoFullscreen && previewQuizData && (
        <QuizOverlay
          isPreview={true}
          cuePoint={previewQuizData}
          onComplete={() => setPreviewQuizData(null)}
          onSkip={() => setPreviewQuizData(null)}
        />
      )}

      {/* Modal Pratinjau Permainan Penutup Akhir Video */}
      <ClosingGameOverlay
        isOpen={Boolean(previewClosingData)}
        gameConfig={previewClosingData}
        isPreview={true}
        onComplete={() => setPreviewClosingData(null)}
        onSkip={() => setPreviewClosingData(null)}
      />

      {/* Modal Konfirmasi Hapus Soal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Pertanyaan Kuis?"
        message="Pertanyaan ini akan dihapus dari timeline video. Anak-anak tidak akan lagi melihat kuis ini saat menonton."
        confirmText="Ya, Hapus Soal"
        cancelText="Batal"
        variant="danger"
        icon="delete"
      />
    </AdminLayout>
  );
};
