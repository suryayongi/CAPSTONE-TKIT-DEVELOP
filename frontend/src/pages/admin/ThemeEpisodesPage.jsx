import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminLayout,
  Card,
  Button,
  BackButton,
  Modal,
  Input,
  Textarea,
  Select,
  ConfirmModal,
  Breadcrumb,
  EmptyState,
  useToast
} from '../../components';
import { Icon, MaterialIcon } from '../../utils/icons';
import { curriculumService } from '../../services/curriculumService';
import { formatSecondsToMMSS, parseMMSSToSeconds, extractYouTubeId } from '../../utils/formatters';
import { getThemePalette } from '../../data/palette';

export const ThemeEpisodesPage = () => {
  const { themeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // State Modal Sub Tema (Level 2)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [deleteTargetGroupId, setDeleteTargetGroupId] = useState(null);

  // State Modal Video (Level 3)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [showTechnicalAccordion, setShowTechnicalAccordion] = useState(false);

  const [formSubthemeId, setFormSubthemeId] = useState('');
  const [formYtUrl, setFormYtUrl] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsPjj, setFormIsPjj] = useState(false);
  const [formPjjNotes, setFormPjjNotes] = useState('');

  // Informasi Tambahan Video (Terisi Otomatis)
  const [formEpisodeLabel, setFormEpisodeLabel] = useState('');
  const [formDuration, setFormDuration] = useState('03:00');
  const [formSource, setFormSource] = useState('Kanal Edukasi YouTube');
  const [formLicense, setFormLicense] = useState('YouTube Standard License (Official IFrame Embed)');
  const [formAi, setFormAi] = useState('Pertanyaan kuis disusun oleh Guru TKIT Al Madani.');

  const [isFetchingYt, setIsFetchingYt] = useState(false);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [deleteTargetVideoId, setDeleteTargetVideoId] = useState(null);

  const { data: themeData, isLoading } = useQuery({
    queryKey: ['theme', themeId],
    queryFn: () => curriculumService.getThemeById(themeId)
  });

  const theme = themeData?.data;
  const subGroups = theme?.subthemes || [];
  const bgHex = theme?.warna_tema || theme?.warna_hex || '#0EA5E9';
  const palette = getThemePalette(bgHex);

  const detectedYtId = extractYouTubeId(formYtUrl);

  // ==========================================
  // HANDLER SUB TEMA (LEVEL 2)
  // ==========================================
  const handleOpenAddGroup = () => {
    setEditingGroup(null);
    setGroupTitle('');
    setGroupDesc('');
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group) => {
    setEditingGroup(group);
    setGroupTitle(group.judul_subtema || '');
    setGroupDesc(group.deskripsi_subtema || '');
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!groupTitle.trim()) {
      showToast('Mohon isi nama Sub Tema!', 'warning');
      return;
    }

    setIsSavingGroup(true);
    const res = await curriculumService.saveSubthemeGroup(theme.id, {
      id: editingGroup ? editingGroup.id : undefined,
      judul_subtema: groupTitle.trim(),
      deskripsi_subtema: groupDesc.trim()
    });
    setIsSavingGroup(false);

    if (res.success) {
      queryClient.invalidateQueries();
      setIsGroupModalOpen(false);
      setEditingGroup(null);
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!deleteTargetGroupId) return;
    const res = await curriculumService.deleteSubthemeGroup(theme.id, deleteTargetGroupId);
    if (res.success) {
      queryClient.invalidateQueries();
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
    setDeleteTargetGroupId(null);
  };

  // ==========================================
  // HANDLER VIDEO PEMBELAJARAN (LEVEL 3)
  // ==========================================
  const handleFetchYoutubeInfo = async (url) => {
    const id = extractYouTubeId(url);
    if (!id) return;

    setIsFetchingYt(true);
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.title) {
          if (!formTitle.trim() || !editingVideo) {
            setFormTitle(json.title);
          }
          if (json.author_name) {
            setFormSource(json.author_name);
          }
          showToast('Judul & nama kanal YouTube berhasil diambil otomatis!', 'success', 2500);
        }
      }
    } catch (e) {
      console.warn('[ThemeEpisodesPage] oEmbed fetch warning:', e);
    } finally {
      setIsFetchingYt(false);
    }
  };

  const handleYtUrlChange = (e) => {
    const val = e.target.value;
    setFormYtUrl(val);
    const id = extractYouTubeId(val);
    if (id) {
      handleFetchYoutubeInfo(val);
    }
  };

  const handleOpenAddVideo = (defaultGroupId = '') => {
    if (subGroups.length === 0) {
      showToast('Silakan buat Sub Tema terlebih dahulu sebelum menambahkan video!', 'info');
      handleOpenAddGroup();
      return;
    }

    const chosenGroupId = defaultGroupId || subGroups[0].id;
    const targetGroup = subGroups.find((g) => g.id === chosenGroupId) || subGroups[0];
    const currentVideoCount = (targetGroup.videos || []).length;

    setEditingVideo(null);
    setFormSubthemeId(targetGroup.id);
    setFormYtUrl('');
    setFormTitle('');
    setFormEpisodeLabel(`Video ${currentVideoCount + 1}`);
    setFormDuration('03:00');
    setFormDesc('');
    setFormIsPjj(false);
    setFormPjjNotes('');
    setFormSource('Kanal Edukasi YouTube');
    setFormLicense('YouTube Standard License (Official IFrame Embed)');
    setFormAi('Pertanyaan kuis disusun oleh Guru TKIT Al Madani.');
    setShowTechnicalAccordion(false);
    setIsVideoModalOpen(true);
  };

  const handleOpenEditVideo = (video, groupId) => {
    setEditingVideo(video);
    setFormSubthemeId(groupId || video.subtheme_id || (subGroups[0] && subGroups[0].id) || '');
    setFormYtUrl(video.youtube_url || `https://www.youtube.com/watch?v=${video.youtube_video_id}`);
    setFormTitle(video.judul_video || video.judul_subtema || '');
    setFormEpisodeLabel(video.label_episode || `Video ${video.urutan || 1}`);
    setFormDuration(formatSecondsToMMSS(video.durasi_detik || 180));
    setFormDesc(video.deskripsi_singkat || '');
    setFormIsPjj(Boolean(video.is_pjj_enabled));
    setFormPjjNotes(video.pjj_notes || '');
    setFormSource(video.sumber_atribusi || 'Kanal Edukasi YouTube');
    setFormLicense(
      video.jenis_lisensi ||
        video.lisensi_penggunaan ||
        'YouTube Standard License (Official IFrame Embed)'
    );
    setFormAi(
      video.deklarasi_ai ||
        video.ai_assistance_statement ||
        'Pertanyaan kuis disusun oleh Guru TKIT Al Madani.'
    );
    setShowTechnicalAccordion(false);
    setIsVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setEditingVideo(null);
  };

  const handleSaveVideo = async (e, directToStudio = false) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formSubthemeId) {
      showToast('Mohon pilih Sub Tema untuk video ini!', 'warning');
      return;
    }
    if (!formYtUrl.trim()) {
      showToast('Mohon masukkan tautan video YouTube!', 'warning');
      return;
    }
    if (!formTitle.trim()) {
      showToast('Mohon isi judul video pembelajaran!', 'warning');
      return;
    }

    setIsSavingVideo(true);
    const durasiDetik = parseMMSSToSeconds(formDuration) || 180;

    const payload = {
      id: editingVideo ? editingVideo.id : undefined,
      subtheme_id: formSubthemeId,
      label_episode: formEpisodeLabel.trim() || 'Video 1',
      judul_video: formTitle.trim(),
      judul_subtema: formTitle.trim(),
      youtube_url: formYtUrl.trim(),
      durasi_detik: durasiDetik,
      deskripsi_singkat:
        formDesc.trim() ||
        `Ayo tonton video pembelajaran tentang ${formTitle.trim()} dan jawab kuisnya!`,
      is_pjj_enabled: formIsPjj,
      pjj_notes: formPjjNotes.trim(),
      sumber_atribusi: formSource.trim() || 'Kanal Edukasi YouTube',
      jenis_lisensi: formLicense.trim() || 'YouTube Standard License (Official IFrame Embed)',
      deklarasi_ai: formAi.trim() || 'Pertanyaan kuis disusun oleh Guru TKIT Al Madani.'
    };

    const res = await curriculumService.saveSubtheme(theme.id, payload);
    setIsSavingVideo(false);

    if (res.success) {
      queryClient.invalidateQueries();
      handleCloseVideoModal();
      showToast(res.message, 'success');

      if (directToStudio && res.data?.id) {
        navigate(`/admin/subtema/${encodeURIComponent(res.data.id)}/studio`);
      }
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleConfirmDeleteVideo = async () => {
    if (!deleteTargetVideoId) return;
    const res = await curriculumService.deleteSubtheme(deleteTargetVideoId);
    if (res.success) {
      queryClient.invalidateQueries();
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
    setDeleteTargetVideoId(null);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-[#777777] font-bold">
          Memuat daftar Sub Tema & Video...
        </div>
      </AdminLayout>
    );
  }

  if (!theme) {
    return (
      <AdminLayout>
        <Card className="p-8 text-center max-w-lg mx-auto">
          <p className="font-bold text-[#4B4B4B] mb-4">Tema tidak ditemukan.</p>
          <Button size="sm" variant="primary" onClick={() => navigate('/admin/tema')}>
            Kembali ke Daftar Tema
          </Button>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Bar Navigasi Kembali & Breadcrumb Hirarki */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <BackButton
          fallbackTo="/admin/tema"
          fallbackLabel="Kembali ke Daftar Tema"
        />

        <Breadcrumb
          items={[
            { label: 'Daftar Tema', to: '/admin/tema' },
            { label: theme.judul_tema },
            { label: `Sub Tema (${subGroups.length})` }
          ]}
        />
      </div>

      {/* Banner Utama Tema */}
      <div
        className="duo-unit-banner mb-6 p-5 sm:p-6 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6"
        style={{ backgroundColor: bgHex }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          <div className="relative shrink-0 flex items-center justify-center pointer-events-auto">
            <div
              className="relative flex items-center justify-center transition-transform duration-300 hover:scale-105 cursor-pointer"
              style={{ transform: 'rotate(10deg)', transformOrigin: 'center center' }}
              title={theme.judul_tema}
            >
              <div className="absolute inset-0 m-auto w-[138px] h-[138px] rounded-full bg-white/20 blur-3xl pointer-events-none -z-10" />
              <div className="absolute inset-0 m-auto w-[92px] h-[92px] rounded-full bg-white/20 blur-xl pointer-events-none -z-10" />
              <div style={{ filter: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.2)) drop-shadow(0 0 32px rgba(255, 255, 255, 0.2))' }}>
                <Icon name={theme.ikon_emoji || 'star'} className="w-28 h-28" />
              </div>
            </div>
          </div>

          <div className="max-w-xl py-1">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-black/15 text-white text-xs font-black uppercase tracking-wider mb-2">
              <span>KELOLA SUB TEMA & VIDEO PEMBELAJARAN</span>
            </div>
            <h1 className="font-duo-display text-2xl sm:text-3xl font-bold text-white leading-tight">
              {theme.judul_tema}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-white/95 mt-1 leading-relaxed">
              {theme.deskripsi || ''}
            </p>
          </div>
        </div>

        {/* Tombol Tambah Sub Tema & Tambah Video (Responsif HP & Desktop) */}
        <div className="relative z-10 grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-center gap-2.5 shrink-0 w-full lg:w-auto">
          <Button
            size="md"
            variant="white"
            fullWidth
            onClick={handleOpenAddGroup}
            icon={<MaterialIcon name="create_new_folder" className="text-lg text-[#7C3AED] shrink-0" />}
            className="sm:w-auto"
          >
            + Tambah Sub Tema
          </Button>

          <Button
            size="md"
            variant="theme-white"
            fullWidth
            themeColor={palette.hex}
            themeLip={palette.lip}
            onClick={() => handleOpenAddVideo(subGroups[0]?.id)}
            icon={<MaterialIcon name="video_call" className="text-lg shrink-0" />}
            className="sm:w-auto"
          >
            + Tambah Video
          </Button>
        </div>
      </div>

      {/* Daftar Sub Tema beserta Video di dalamnya */}
      <div className="space-y-6">
        {subGroups.length === 0 ? (
          <EmptyState
            materialIcon="create_new_folder"
            title="Belum Ada Sub Tema di Tema Ini"
            description="Mulai dengan membuat Sub Tema terlebih dahulu, kemudian tambahkan Video Pembelajaran di dalamnya."
            action={
              <Button
                size="md"
                variant="primary"
                onClick={handleOpenAddGroup}
                icon={<MaterialIcon name="add" className="text-lg" />}
              >
                Buat Sub Tema Pertama
              </Button>
            }
          />
        ) : (
          subGroups.map((group, gIdx) => {
            const videos = group.videos || [];
            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5"
              >
                {/* Header Sub Tema (Level 2) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#EDE9FE] border border-[#C4B5FD] text-[#6D28D9] text-[11px] font-black uppercase tracking-wider">
                        Subtema {gIdx + 1}
                      </span>
                      <span className="text-xs font-extrabold text-[#64748B]">
                        • {videos.length} Video Pembelajaran
                      </span>
                    </div>
                    <h2 className="font-duo-display text-xl sm:text-2xl font-bold text-[#1E293B]">
                      {group.judul_subtema}
                    </h2>
                    {group.deskripsi_subtema && (
                      <p className="text-xs sm:text-sm font-bold text-[#64748B] mt-0.5">
                        {group.deskripsi_subtema}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenAddVideo(group.id)}
                      icon={<MaterialIcon name="add_circle" className="text-base" />}
                    >
                      Tambah Video
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditGroup(group)}
                      icon={<MaterialIcon name="edit" className="text-base" />}
                      title="Ubah Sub Tema"
                    />
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteTargetGroupId(group.id)}
                      icon={<MaterialIcon name="delete" className="text-base" />}
                      title="Hapus Sub Tema"
                    />
                  </div>
                </div>

                {/* Daftar Video di dalam Sub Tema Ini (Level 3) */}
                {videos.length === 0 ? (
                  <EmptyState
                    compact
                    materialIcon="smart_display"
                    title="Belum Ada Video"
                    description={`Belum ada video pembelajaran di Sub Tema ${group.judul_subtema}.`}
                    action={
                      <Button
                        size="sm"
                        variant="blue"
                        onClick={() => handleOpenAddVideo(group.id)}
                        icon={<MaterialIcon name="add" className="text-base" />}
                      >
                        Tambah Video Pertama
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {videos.map((sub, vIdx) => (
                      <div
                        key={sub.id}
                        className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-all min-w-0"
                      >
                        <div className="flex flex-col sm:flex-row items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                          <img
                            src={`https://img.youtube.com/vi/${sub.youtube_video_id}/hqdefault.jpg`}
                            alt={sub.judul_video || sub.judul_subtema}
                            className="w-full sm:w-36 aspect-video object-cover rounded-xl bg-slate-900 border border-slate-200 shrink-0 shadow-xs"
                          />
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-[#E0F2FE] text-[#0284C7]">
                                {sub.label_episode || `Video ${vIdx + 1}`}
                              </span>
                              <span className="text-[11px] font-bold text-[#64748B]">
                                Durasi: {formatSecondsToMMSS(sub.durasi_detik || 180)} • Kanal: {sub.sumber_atribusi || 'YouTube'}
                              </span>
                            </div>
                            <h3 className="font-duo-display text-lg sm:text-xl font-bold text-[#4B4B4B]">
                              {sub.judul_video || sub.judul_subtema}
                            </h3>
                            <p className="text-xs sm:text-sm font-bold text-[#777777]">
                              {sub.deskripsi_singkat || '-'}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              {(sub.cue_points || []).length > 0 ? (
                                <span className="text-xs font-bold text-[#059669] flex items-center gap-1">
                                  <MaterialIcon name="check_circle" className="text-base" />
                                  <span>{(sub.cue_points || []).length} Kuis Terpasang</span>
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-[#D97706] flex items-center gap-1">
                                  <MaterialIcon name="warning" className="text-base" />
                                  <span>Belum ada kuis (Klik Atur Kuis untuk menambahkan)</span>
                                </span>
                              )}
                              {sub.closing_game?.enabled !== false && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Permainan Penutup
                                </span>
                              )}
                              {sub.is_pjj_enabled && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                                  <MaterialIcon name="home" className="text-xs" />
                                  <span>Mode PJJ (Isi Nama & Kelas)</span>
                                </span>
                              )}
                              {(sub.created_by_name || sub.updated_by_name) && (
                                <span className="text-[11px] font-medium text-slate-500">
                                  • Oleh {sub.created_by_name || sub.updated_by_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Link
                            to={`/admin/subtema/${encodeURIComponent(sub.id)}/studio`}
                            state={{ from: location.pathname, fromLabel: 'Kembali ke Kelola Video' }}
                          >
                            <Button
                              size="sm"
                              variant="purple"
                              icon={<MaterialIcon name="movie_edit" className="text-base" />}
                            >
                              Atur Kuis
                            </Button>
                          </Link>

                          <Link
                            to={`/tonton/${encodeURIComponent(sub.id)}`}
                            state={{ from: location.pathname, fromLabel: 'Kembali ke Kelola Video' }}
                          >
                            <Button
                              size="sm"
                              variant="primary"
                              icon={<MaterialIcon name="play_arrow" className="text-base" />}
                              title="Tonton & Uji Coba Video"
                            />
                          </Link>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditVideo(sub, group.id)}
                            icon={<MaterialIcon name="edit" className="text-base" />}
                            title="Ubah Info Video"
                          />

                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTargetVideoId(sub.id)}
                            icon={<MaterialIcon name="delete" className="text-base" />}
                            title="Hapus Video"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL 1: TAMBAH / UBAH SUB TEMA (LEVEL 2) */}
      {/* ========================================== */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setEditingGroup(null);
        }}
        title={editingGroup ? 'Ubah Sub Tema' : 'Tambah Sub Tema Baru'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveGroup} className="space-y-4">
          <div className="p-3 rounded-2xl bg-[#EDE9FE]/60 border border-[#C4B5FD] text-xs font-bold text-[#5B21B6]">
            Tema Induk: <b>{theme.judul_tema}</b>
          </div>

          <Input
            label="Nama Sub Tema"
            required
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            placeholder="Contoh: Polisi & Keamanan Jalan Raya, Hewan Ternak..."
          />

          <Textarea
            label="Penjelasan Singkat Sub Tema (Opsional)"
            rows={2}
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
            placeholder="Tuliskan deskripsi singkat mengenai subtema ini..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t-2 border-[#E5E5E5]">
            <Button
              type="button"
              size="md"
              variant="outline"
              onClick={() => {
                setIsGroupModalOpen(false);
                setEditingGroup(null);
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="md"
              variant="primary"
              loading={isSavingGroup}
              icon={<MaterialIcon name="check" className="text-lg" />}
            >
              Simpan Sub Tema
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* MODAL 2: TAMBAH / UBAH VIDEO (LEVEL 3)     */}
      {/* ========================================== */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        title={editingVideo ? 'Ubah Video Pembelajaran' : 'Tambah Video Pembelajaran Baru'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={(e) => handleSaveVideo(e, false)} className="space-y-4">
          {/* 1. Pilih Sub Tema */}
          <div>
            <Select
              label="Pilih Sub Tema *"
              value={formSubthemeId}
              onChange={(e) => setFormSubthemeId(e.target.value)}
              options={subGroups.map((g, idx) => ({
                value: g.id,
                label: `Sub Tema ${idx + 1}: ${g.judul_subtema}`
              }))}
            />
          </div>

          {/* 2. Tautan Video YouTube */}
          <div>
            <Input
              label="Tautan Video YouTube"
              required
              value={formYtUrl}
              onChange={handleYtUrlChange}
              placeholder="Contoh: https://www.youtube.com/watch?v=L0MK7qz13bU"
            />
            {isFetchingYt && (
              <p className="text-xs font-bold text-[#0EA5E9] mt-1 flex items-center gap-1">
                <MaterialIcon name="sync" className="text-sm animate-spin" />
                <span>Mengambil judul & nama kanal dari YouTube...</span>
              </p>
            )}
          </div>

          {/* Pratinjau Gambar Video YouTube Otomatis */}
          {detectedYtId && (
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border-2 border-[#E5E5E5] flex items-center gap-3 animate-pop-in">
              <img
                src={`https://img.youtube.com/vi/${detectedYtId}/hqdefault.jpg`}
                alt="Pratinjau YouTube"
                className="w-24 h-16 object-cover rounded-xl border border-[#CBD5E1] bg-black shrink-0"
              />
              <div className="overflow-hidden">
                <span className="text-[10px] font-black uppercase text-[#0EA5E9] block">
                  Video YouTube Siap Diputar
                </span>
                <p className="text-xs font-bold text-[#4B4B4B] truncate mt-0.5">
                  {formTitle || 'Judul video akan terisi otomatis...'}
                </p>
                <span className="text-[11px] font-extrabold text-[#777777]">
                  Kanal: {formSource}
                </span>
              </div>
            </div>
          )}

          {/* 3. Judul Video Pembelajaran */}
          <div>
            <Input
              label="Judul Video Pembelajaran"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Contoh: Polisi Sahabat Anak & Rambu Lalu Lintas"
            />
          </div>

          {/* 4. Cerita Singkat Video (Opsional) */}
          <div>
            <Textarea
              label="Cerita Singkat Isi Video (Opsional)"
              rows={2}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Tuliskan gambaran singkat tentang isi video ini..."
            />
          </div>

          {/* 5. Pengaturan Mode PJJ (Isian Nama Anak & Kelas di Akhir Video) */}
          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsPjj}
                onChange={(e) => setFormIsPjj(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-sky-600 rounded cursor-pointer shrink-0"
              />
              <div>
                <span className="font-duo-display text-sm font-bold text-slate-800 block">
                  Aktifkan Isian Nama Anak & Kelas (Khusus Mode PJJ)
                </span>
                <span className="text-xs font-medium text-slate-600 leading-relaxed block mt-0.5">
                  Notes: Fitur ini khusus untuk <b>Pembelajaran Jarak Jauh (PJJ)</b> di rumah. Untuk pembelajaran bersama di kelas, biarkan nonaktif agar tidak semua subtema meminta isian nama.
                </span>
              </div>
            </label>

            {formIsPjj && (
              <div className="pt-2 border-t border-sky-200/70">
                <Textarea
                  label="Catatan Khusus di Layar Anak/Orang Tua (Opsional)"
                  rows={2}
                  value={formPjjNotes}
                  onChange={(e) => setFormPjjNotes(e.target.value)}
                  placeholder="Contoh: Khusus PJJ di rumah: silakan isi nama dan kelas ananda untuk Ibu Guru."
                />
              </div>
            )}
          </div>

          {/* 6. Informasi Tambahan (Terisi Otomatis) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTechnicalAccordion((p) => !p)}
              className="text-xs font-extrabold text-[#64748B] hover:text-[#0EA5E9] flex items-center gap-1 transition"
            >
              <MaterialIcon name={showTechnicalAccordion ? 'expand_less' : 'tune'} className="text-base" />
              <span>Pengaturan Tambahan: Durasi & Sumber Kanal (Terisi Otomatis)</span>
            </button>

            {showTechnicalAccordion && (
              <div className="mt-2 p-3.5 rounded-2xl bg-[#F8FAFC] border-2 border-[#E5E5E5] space-y-3 animate-pop-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Label Urutan Video"
                    value={formEpisodeLabel}
                    onChange={(e) => setFormEpisodeLabel(e.target.value)}
                    placeholder="Video 1"
                  />
                  <Input
                    label="Perkiraan Durasi (Menit:Detik)"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="03:00"
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Nama Kanal Sumber YouTube"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    placeholder="Kanal Edukasi YouTube"
                  />
                  <Input
                    label="Keterangan Lisensi Tayangan"
                    value={formLicense}
                    onChange={(e) => setFormLicense(e.target.value)}
                    placeholder="YouTube Standard License"
                  />
                </div>

                <Input
                  label="Catatan Penyusun Kuis"
                  value={formAi}
                  onChange={(e) => setFormAi(e.target.value)}
                  placeholder="Pertanyaan kuis disusun oleh Guru TKIT Al Madani."
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-[#E5E5E5]">
            <Button
              type="button"
              size="md"
              variant="outline"
              onClick={handleCloseVideoModal}
            >
              Batal
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="md"
                variant="outline"
                loading={isSavingVideo}
                icon={<MaterialIcon name="check" className="text-lg" />}
              >
                Simpan Video
              </Button>

              <Button
                type="button"
                size="md"
                variant="primary"
                loading={isSavingVideo}
                onClick={(e) => handleSaveVideo(e, true)}
                icon={<MaterialIcon name="movie_edit" className="text-lg" />}
              >
                Simpan & Atur Kuis
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Sub Tema Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetGroupId)}
        onClose={() => setDeleteTargetGroupId(null)}
        onConfirm={handleConfirmDeleteGroup}
        title="Hapus Sub Tema Ini?"
        message="Sub Tema ini beserta seluruh video dan pertanyaan kuis di dalamnya akan ikut dihapus. Lanjutkan?"
        confirmText="Ya, Hapus Sub Tema"
        cancelText="Batal"
        variant="danger"
        icon="delete"
      />

      {/* Confirm Delete Video Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetVideoId)}
        onClose={() => setDeleteTargetVideoId(null)}
        onConfirm={handleConfirmDeleteVideo}
        title="Hapus Video Pembelajaran?"
        message="Video ini beserta seluruh pertanyaan kuis di dalamnya akan dihapus. Lanjutkan?"
        confirmText="Ya, Hapus Video"
        cancelText="Batal"
        variant="danger"
        icon="delete"
      />
    </AdminLayout>
  );
};
