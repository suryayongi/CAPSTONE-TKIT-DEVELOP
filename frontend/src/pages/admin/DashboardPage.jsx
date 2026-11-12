import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminLayout,
  Button,
  ConfirmModal,
  BackupHelpModal,
  useToast
} from '../../components';
import { Icon, MaterialIcon } from '../../utils/icons';
import { curriculumService } from '../../services/curriculumService';

export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isBackupHelpOpen, setIsBackupHelpOpen] = useState(false);

  const { data: statsData } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => curriculumService.getStats()
  });

  const { data: themesData } = useQuery({
    queryKey: ['themes', false],
    queryFn: () => curriculumService.getThemes(false)
  });

  const stats = statsData?.data || {
    totalThemes: 0,
    totalSubthemeGroups: 0,
    totalVideos: 0,
    totalCuePoints: 0
  };

  const handleExportBackup = () => {
    curriculumService.exportCurriculumJson();
    showToast('Cadangan seluruh materi berhasil disimpan ke komputer Anda!', 'success');
  };

  const handleImportFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const res = curriculumService.importCurriculumJson(evt.target.result);
      if (res.success) {
        showToast(res.message, 'success');
        queryClient.invalidateQueries();
      } else {
        showToast(res.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmReset = async () => {
    const res = await curriculumService.resetSeedData();
    if (res.success) {
      showToast('Seluruh materi dan tampilan berhasil dikembalikan ke pengaturan awal!', 'success');
      queryClient.invalidateQueries();
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <AdminLayout>
      {/* 1. Studio Header Banner - Pusat Kontrol Utama yang Tenang & Berwibawa */}
      <div className="bg-[#214337] text-white rounded-2xl p-6 sm:p-8 mb-6 shadow-xs border border-[#18342B] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Icon name="teacher" className="w-11 h-11" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Ruang Kerja Guru • TKIT Al Madani</span>
            </div>
            <h1 className="font-duo-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              Studio Kurikulum & Materi
            </h1>
            <p className="text-sm font-medium text-emerald-100/80 mt-1 max-w-xl leading-relaxed">
              Pusat kendali tema pembelajaran, koleksi video, serta titik kuis interaktif untuk siswa kelas TK A & TK B.
            </p>
          </div>
        </div>

        {/* Tombol Aksi Cepat Header */}
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Link to="/admin/tema">
            <Button
              size="md"
              variant="yellow"
              icon={<MaterialIcon name="folder_special" className="text-lg" />}
            >
              Kelola Tema & Video
            </Button>
          </Link>
          <Link to="/" target="_blank">
            <Button
              size="md"
              variant="white"
              icon={<MaterialIcon name="visibility" className="text-base text-stone-700" />}
            >
              Lihat Tampilan Siswa
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Empat Kartu Metrik Utama yang Ditegaskan (High-Craft Highlighted Information Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Metrik 1: Tema Pembelajaran */}
        <div className="bg-sky-50/70 border border-sky-200/90 rounded-2xl p-5 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
              Tema Pembelajaran
            </span>
            <div className="w-9 h-9 rounded-xl bg-white text-sky-600 border border-sky-100 shadow-xs flex items-center justify-center shrink-0">
              <MaterialIcon name="folder_special" className="text-lg" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-sky-950 font-mono tabular-nums tracking-tight">
                {stats.totalThemes}
              </span>
              <span className="text-xs font-bold text-sky-800">Tema Aktif</span>
            </div>
            <p className="text-xs font-medium text-sky-700/80 mt-1">
              Sentra & materi siap tayang
            </p>
          </div>
        </div>

        {/* Metrik 2: Subtema */}
        <div className="bg-purple-50/70 border border-purple-200/90 rounded-2xl p-5 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
              Subtema Pembelajaran
            </span>
            <div className="w-9 h-9 rounded-xl bg-white text-purple-600 border border-purple-100 shadow-xs flex items-center justify-center shrink-0">
              <MaterialIcon name="category" className="text-lg" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-purple-950 font-mono tabular-nums tracking-tight">
                {stats.totalSubthemeGroups || 0}
              </span>
              <span className="text-xs font-bold text-purple-800">Subtema</span>
            </div>
            <p className="text-xs font-medium text-purple-700/80 mt-1">
              Topik & bahasan per pekan
            </p>
          </div>
        </div>

        {/* Metrik 3: Koleksi Video */}
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Koleksi Video
            </span>
            <div className="w-9 h-9 rounded-xl bg-white text-emerald-600 border border-emerald-100 shadow-xs flex items-center justify-center shrink-0">
              <MaterialIcon name="smart_display" className="text-lg" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono tabular-nums tracking-tight">
                {stats.totalVideos || stats.totalSubthemes || 0}
              </span>
              <span className="text-xs font-bold text-emerald-800">Video</span>
            </div>
            <p className="text-xs font-medium text-emerald-700/80 mt-1">
              Tayangan edukasi resmi YouTube
            </p>
          </div>
        </div>

        {/* Metrik 4: Pertanyaan Kuis */}
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Pertanyaan Kuis
            </span>
            <div className="w-9 h-9 rounded-xl bg-white text-amber-600 border border-amber-100 shadow-xs flex items-center justify-center shrink-0">
              <MaterialIcon name="quiz" className="text-lg" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-amber-950 font-mono tabular-nums tracking-tight">
                {stats.totalCuePoints}
              </span>
              <span className="text-xs font-bold text-amber-800">Titik Kuis</span>
            </div>
            <p className="text-xs font-medium text-amber-700/80 mt-1">
              Kuis interaktif di dalam video
            </p>
          </div>
        </div>
      </div>

      {/* 3. Baris Pintasan Utilitas Ramping (Tampilan & Cadangan Materi) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Utilitas 1: Pengaturan Tampilan & Sambutan */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
              <MaterialIcon name="edit_note" className="text-2xl" />
            </div>
            <div className="min-w-0">
              <h3 className="font-duo-display text-base font-bold text-[#1C1917] truncate">
                Tampilan & Sambutan Maskot
              </h3>
              <p className="text-xs text-[#78716C] mt-0.5 truncate">
                Atur kalimat sapaan, pesan maskot Madani, dan ucapan pujian.
              </p>
            </div>
          </div>
          <Link to="/admin/pengaturan" className="shrink-0">
            <Button size="sm" variant="outline" icon={<MaterialIcon name="tune" className="text-base text-[#78716C]" />}>
              Atur
            </Button>
          </Link>
        </div>

        {/* Utilitas 2: Cadangan & Sinkronisasi Materi */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0 border border-stone-200">
              <MaterialIcon name="sync_alt" className="text-2xl" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-duo-display text-base font-bold text-[#1C1917] truncate">
                  Cadangan Materi Belajar
                </h3>
                <button
                  type="button"
                  onClick={() => setIsBackupHelpOpen(true)}
                  className="text-stone-400 hover:text-stone-700 transition cursor-pointer"
                  title="Pelajari fungsi dan cara pakai cadangan materi"
                >
                  <MaterialIcon name="help_outline" className="text-base" />
                </button>
              </div>
              <p className="text-xs text-[#78716C] mt-0.5 truncate">
                Simpan berkas JSON atau muat materi ke laptop kelas lain.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportBackup}
              title="Unduh cadangan materi JSON"
              icon={<MaterialIcon name="download" className="text-base" />}
            >
              Simpan
            </Button>

            <label className="cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <span
                className="duo-btn duo-btn-outline duo-btn-sm !px-3 inline-flex items-center gap-1.5 cursor-pointer"
                title="Muat berkas cadangan JSON dari komputer"
              >
                <MaterialIcon name="upload_file" className="text-base text-emerald-600" />
                <span>Muat</span>
              </span>
            </label>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsResetConfirmOpen(true)}
              title="Kembalikan data ke materi bawaan contoh"
              icon={<MaterialIcon name="restart_alt" className="text-base text-amber-600" />}
            />
          </div>
        </div>
      </div>

      {/* 4. Panel Pusat Akses Kelola Materi (Fokus & Menghilangkan Redundansi) */}
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
            <MaterialIcon name="auto_stories" className="text-2xl" />
          </div>
          <div>
            <h2 className="font-duo-display text-lg font-bold text-stone-900 tracking-tight">
              Pusat Manajemen Tema & Video Pembelajaran
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
              Seluruh penambahan tema baru, pembagian subtema mingguan, tautan video YouTube, hingga penyusunan titik kuis interaktif terpusat di menu <strong>Kelola Materi</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/admin/tema">
            <Button
              size="md"
              variant="primary"
              icon={<MaterialIcon name="arrow_forward" className="text-lg" />}
            >
              Buka Kelola Materi
            </Button>
          </Link>
        </div>
      </div>

      {/* Modal Panduan & Tutorial Cadangan Materi Belajar */}
      <BackupHelpModal
        isOpen={isBackupHelpOpen}
        onClose={() => setIsBackupHelpOpen(false)}
      />

      {/* Modal Konfirmasi Reset Data */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Kembalikan ke Materi Awal?"
        message="Seluruh tema, subtema, video, dan pertanyaan kuis yang telah ditambahkan akan digantikan dengan data contoh awal TKIT Al Madani. Lanjutkan?"
        confirmText="Ya, Kembalikan Materi Awal"
        cancelText="Batal"
        variant="danger"
        icon="restart_alt"
      />
    </AdminLayout>
  );
};
