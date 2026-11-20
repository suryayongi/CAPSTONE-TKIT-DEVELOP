import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminLayout,
  Button,
  ConfirmModal,
  EmptyState,
  useToast
} from '../../components';
import { Icon, MaterialIcon } from '../../utils/icons';
import { pjjService } from '../../services/pjjService';
import { curriculumService } from '../../services/curriculumService';
import { authService } from '../../services/authService';
import { PREDICATE_META } from '../../utils/closingGame';

export const PjjRecapPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterPredicate, setFilterPredicate] = useState('ALL');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const { data: configRes } = useQuery({
    queryKey: ['siteConfig'],
    queryFn: () => curriculumService.getSiteConfig()
  });

  const {
    data: recordsRes,
    isLoading,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['pjjRecords'],
    queryFn: async () => {
      const res = await pjjService.getRecords();
      if (res.requiresAuth) {
        authService.logout();
        navigate('/admin/login', { replace: true });
      }
      return res;
    }
  });

  const siteConfig = configRes?.data || {};
  const allRecords = useMemo(() => recordsRes?.data || [], [recordsRes?.data]);
  const dataSource = recordsRes?.source || 'local';

  const classOptions = useMemo(() => {
    const base = Array.isArray(siteConfig.pjj_classes) ? siteConfig.pjj_classes : ['TK A', 'TK B'];
    const dynamic = allRecords.map((r) => r.class_name).filter(Boolean);
    return Array.from(new Set([...base, ...dynamic]));
  }, [siteConfig.pjj_classes, allRecords]);

  const filteredRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allRecords.filter((rec) => {
      if (filterClass !== 'ALL' && rec.class_name !== filterClass) return false;
      if (filterPredicate !== 'ALL' && rec.predicate !== filterPredicate) return false;
      if (q) {
        const matchName = (rec.student_name || '').toLowerCase().includes(q);
        const matchVideo = (rec.video_title || '').toLowerCase().includes(q);
        const matchTheme = (rec.theme_title || '').toLowerCase().includes(q);
        if (!matchName && !matchVideo && !matchTheme) return false;
      }
      return true;
    });
  }, [allRecords, filterClass, filterPredicate, searchTerm]);

  const totalCount = allRecords.length;
  const excellentCount = allRecords.filter((r) => r.predicate === 'EXCELLENT').length;
  const goodCount = allRecords.filter((r) => r.predicate === 'GOOD').length;

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const res = await pjjService.deleteRecord(deleteTargetId);
    if (res.success) {
      queryClient.invalidateQueries({ queryKey: ['pjjRecords'] });
      showToast(res.message || 'Catatan PJJ berhasil dihapus.', 'success');
    } else {
      showToast(res.message || 'Gagal menghapus catatan PJJ.', 'error');
    }
    setDeleteTargetId(null);
  };

  const handleClearAll = async () => {
    const res = await pjjService.clearAllRecords();
    if (res.success) {
      queryClient.invalidateQueries({ queryKey: ['pjjRecords'] });
      showToast(res.message || 'Seluruh catatan PJJ berhasil dibersihkan.', 'success');
    } else {
      showToast(res.message || 'Gagal membersihkan catatan.', 'error');
    }
    setIsClearConfirmOpen(false);
  };

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) {
      showToast('Belum ada data PJJ untuk diunduh.', 'info');
      return;
    }
    pjjService.exportCsv(filteredRecords);
    showToast('Rekap PJJ berhasil diunduh ke format Spreadsheet CSV.', 'success');
  };

  return (
    <AdminLayout>
      {/* Header Halaman (Unslop: Quiet Chrome, Sentence Case, Jelas & Khusus Guru) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
            <MaterialIcon name="lock" className="text-sm text-emerald-600" />
            <span>Akses Khusus Guru TKIT Al Madani</span>
            <span>•</span>
            <span className={dataSource === 'postgres' ? 'text-emerald-700' : 'text-amber-700'}>
              {dataSource === 'postgres' ? 'Tersinkron PostgreSQL Neon' : 'Penyimpanan Lokal'}
            </span>
          </div>
          <h1 className="font-duo-display text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            Rekap Aktivitas Belajar PJJ
          </h1>
          <p className="text-sm font-medium text-slate-600 max-w-2xl leading-relaxed">
            Pantau nama, kelas, serta apresiasi simbol pencapaian ananda (Bintang Emas / Excellent dan Jempol Ceria / Good) dari materi yang mengaktifkan Mode PJJ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            loading={isFetching}
            icon={<MaterialIcon name="refresh" className="text-base" />}
          >
            Muat Ulang
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleExportCsv}
            icon={<MaterialIcon name="download" className="text-base" />}
          >
            Unduh Excel / CSV
          </Button>
        </div>
      </div>

      {/* Ringkasan Statistik Simbol & Partisipasi (3 Kartu Seimbang) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500">Total Catatan PJJ Masuk</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-mono tabular-nums text-3xl font-bold text-slate-800">
              {totalCount}
            </span>
            <span className="text-xs font-medium text-slate-500">Kiriman anak</span>
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-amber-800 block">Predikat Excellent</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono tabular-nums text-3xl font-bold text-amber-950">
                {excellentCount}
              </span>
              <span className="text-xs font-medium text-amber-800">Bintang Emas</span>
            </div>
          </div>
          <Icon name="trophy" className="w-12 h-12 shrink-0" />
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-emerald-800 block">Predikat Good</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono tabular-nums text-3xl font-bold text-emerald-950">
                {goodCount}
              </span>
              <span className="text-xs font-medium text-emerald-800">Jempol Ceria</span>
            </div>
          </div>
          <Icon name="thumbsup" className="w-12 h-12 shrink-0" />
        </div>
      </div>

      {/* Filter Bar (<search> Landmark) */}
      <search className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <label htmlFor="pjj-search" className="text-xs font-semibold text-slate-600">
              Cari Anak atau Materi
            </label>
            <input
              id="pjj-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ketik nama anak atau judul video"
              className="w-full h-10 px-3 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          <div className="w-full md:w-44 flex flex-col gap-1 shrink-0">
            <label htmlFor="pjj-filter-class" className="text-xs font-semibold text-slate-600">
              Filter Kelas
            </label>
            <select
              id="pjj-filter-class"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full h-10 px-3 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-sky-500"
            >
              <option value="ALL">Semua Kelas</option>
              {classOptions.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-44 flex flex-col gap-1 shrink-0">
            <label htmlFor="pjj-filter-pred" className="text-xs font-semibold text-slate-600">
              Predikat
            </label>
            <select
              id="pjj-filter-pred"
              value={filterPredicate}
              onChange={(e) => setFilterPredicate(e.target.value)}
              className="w-full h-10 px-3 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-sky-500"
            >
              <option value="ALL">Semua Predikat</option>
              <option value="EXCELLENT">Bintang Emas (Excellent)</option>
              <option value="GOOD">Jempol Ceria (Good)</option>
            </select>
          </div>

          {totalCount > 0 && (
            <div className="shrink-0 flex items-center justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsClearConfirmOpen(true)}
                icon={<MaterialIcon name="delete_sweep" className="text-base text-rose-600" />}
              >
                Bersihkan
              </Button>
            </div>
          )}
        </div>
      </search>

      {/* Tabel Rekap PJJ Responsif (Non-Numerik, Semantic & Container Query) */}
      {isLoading ? (
        <div className="p-12 text-center text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-2xl">
          Memuat catatan belajar PJJ siswa...
        </div>
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          materialIcon="assignment_ind"
          title={totalCount === 0 ? 'Belum Ada Catatan PJJ Masuk' : 'Tidak Ada Catatan Sesuai Filter'}
          description={
            totalCount === 0
              ? 'Aktifkan Mode PJJ pada salah satu video di Kelola Materi, lalu coba tonton hingga akhir untuk melihat hasilnya di sini.'
              : 'Coba ubah kata kunci pencarian atau pilihan kelas di atas.'
          }
        />
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="pjj-table-caption"
          className="pjj-table-wrapper"
        >
          <table className="pjj-table">
            <caption id="pjj-table-caption" className="sr-only">
              Daftar Partisipasi Siswa Pembelajaran Jarak Jauh TKIT Al Madani
            </caption>
            <thead>
              <tr>
                <th scope="col">Nama Anak</th>
                <th scope="col">Kelas</th>
                <th scope="col">Materi Video & Subtema</th>
                <th scope="col">Simbol Penilaian</th>
                <th scope="col">Waktu Kirim</th>
                <th scope="col">Catatan Pendamping</th>
                <th scope="col" className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => {
                const pred = PREDICATE_META[rec.predicate === 'EXCELLENT' ? 'EXCELLENT' : 'GOOD'];
                const dt = rec.submitted_at ? new Date(rec.submitted_at) : null;
                const dateFmt = dt
                  ? dt.toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : '-';
                const timeFmt = dt
                  ? dt.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '';

                return (
                  <tr key={rec.id}>
                    <th scope="row" className="font-bold text-slate-800 whitespace-nowrap">
                      {rec.student_name}
                    </th>
                    <td data-label="Kelas">
                      <span className="inline-flex px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 whitespace-nowrap">
                        {rec.class_name}
                      </span>
                    </td>
                    <td data-label="Materi">
                      <div className="min-w-[180px]">
                        <span className="font-semibold text-slate-800 block leading-snug">
                          {rec.video_title}
                        </span>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          {rec.theme_title}
                          {rec.subtheme_title ? ` • ${rec.subtheme_title}` : ''}
                        </span>
                      </div>
                    </td>
                    <td data-label="Penilaian">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-bold whitespace-nowrap ${pred.badgeClass}`}
                      >
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: pred.starCount }).map((_, idx) => (
                            <MaterialIcon key={idx} name="star" className="text-sm text-amber-500" />
                          ))}
                        </span>
                        <span>{pred.label}</span>
                      </div>
                    </td>
                    <td data-label="Waktu" className="font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                      <span>{dateFmt}</span>
                      <span className="block text-slate-400">{timeFmt} WIB</span>
                    </td>
                    <td data-label="Catatan" className="text-xs text-slate-600 max-w-[220px]">
                      {rec.notes || '-'}
                    </td>
                    <td data-label="Aksi" className="text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(rec.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus catatan ini"
                      >
                        <MaterialIcon name="delete_outline" className="text-lg" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Konfirmasi Hapus 1 Baris */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Catatan PJJ?"
        message="Catatan keaktifan anak yang dipilih akan dihapus dari daftar rekap."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        icon="delete"
      />

      {/* Modal Konfirmasi Bersihkan Semua */}
      <ConfirmModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClearAll}
        title="Bersihkan Seluruh Catatan PJJ?"
        message="Semua catatan siswa di tabel ini akan dihapus permanen. Pastikan Anda sudah mengunduh CSV jika datanya masih diperlukan."
        confirmText="Ya, Bersihkan Semua"
        cancelText="Batal"
        variant="danger"
        icon="delete_sweep"
      />
    </AdminLayout>
  );
};
