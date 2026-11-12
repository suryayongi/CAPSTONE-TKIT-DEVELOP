import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminLayout,
  Card,
  Button,
  Modal,
  Input,
  Textarea,
  Select,
  IconPicker,
  ConfirmModal,
  EmptyState,
  useToast
} from '../../components';
import { Icon, MaterialIcon } from '../../utils/icons';
import { MADANI_SENTRA_COLOR_PALETTE } from '../../data/palette';
import { curriculumService } from '../../services/curriculumService';

export const ThemesPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [showAdvancedAccordion, setShowAdvancedAccordion] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState('#0EA5E9');
  const [formIcon, setFormIcon] = useState('police');

  // Pengaturan Tambahan (Terisi Otomatis)
  const [formCategory, setFormCategory] = useState('');
  const [formAge, setFormAge] = useState('Usia 4–6 Tahun (TK A & TK B)');
  const [formBtnText, setFormBtnText] = useState('Mulai Belajar');
  const [formOrder, setFormOrder] = useState(1);
  const [formStatus, setFormStatus] = useState('PUBLISHED');

  const [isSaving, setIsSaving] = useState(false);
  const [deleteTargetThemeId, setDeleteTargetThemeId] = useState(null);

  const { data: themesData, isLoading } = useQuery({
    queryKey: ['themes', false],
    queryFn: () => curriculumService.getThemes(false)
  });

  const themes = themesData?.data || [];

  const handleOpenAdd = () => {
    setEditingTheme(null);
    setFormTitle('');
    setFormDesc('');
    setFormColor('#0EA5E9');
    setFormIcon('police');
    setFormCategory(`TEMA ${themes.length + 1} • MATERI BELAJAR`);
    setFormAge('Usia 4–6 Tahun (TK A & TK B)');
    setFormBtnText('Mulai Belajar');
    setFormOrder(themes.length + 1);
    setFormStatus('PUBLISHED');
    setShowAdvancedAccordion(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (theme) => {
    setEditingTheme(theme);
    setFormTitle(theme.judul_tema || '');
    setFormDesc(theme.deskripsi || '');
    setFormColor(theme.warna_tema || theme.warna_hex || '#0EA5E9');
    setFormIcon(theme.ikon_emoji || 'police');
    setFormCategory(theme.label_kategori || `TEMA ${theme.urutan || 1}`);
    setFormAge(theme.rentang_usia || 'Usia 4–6 Tahun (TK A & TK B)');
    setFormBtnText(theme.teks_tombol_kartu || 'Mulai Belajar');
    setFormOrder(theme.urutan || 1);
    setFormStatus(theme.status_publikasi || 'PUBLISHED');
    setShowAdvancedAccordion(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTheme(null);
  };

  const handleSaveTheme = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Mohon masukkan judul tema pembelajaran!', 'warning');
      return;
    }

    setIsSaving(true);
    const payload = {
      id: editingTheme ? editingTheme.id : undefined,
      judul_tema: formTitle.trim(),
      label_kategori: formCategory.trim() || `TEMA ${formOrder || themes.length + 1}`,
      rentang_usia: formAge.trim() || 'Usia 4–6 Tahun (TK A & TK B)',
      teks_tombol_kartu: formBtnText.trim() || 'Mulai Belajar',
      urutan: parseInt(formOrder, 10) || themes.length + 1,
      status_publikasi: formStatus,
      deskripsi:
        formDesc.trim() ||
        `Mari belajar dan mengenal ${formTitle.trim()} bersama teman-teman TKIT Al Madani!`,
      warna_tema: formColor,
      warna_hex: formColor,
      ikon_emoji: formIcon
    };

    const res = await curriculumService.saveTheme(payload);
    setIsSaving(false);

    if (res.success) {
      queryClient.invalidateQueries();
      handleCloseModal();
      showToast(
        editingTheme ? 'Tema pembelajaran berhasil diperbarui!' : 'Tema baru berhasil ditambahkan!',
        'success'
      );
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetThemeId) return;
    const res = await curriculumService.deleteTheme(deleteTargetThemeId);
    if (res.success) {
      queryClient.invalidateQueries();
      showToast('Tema beserta seluruh subtema dan videonya berhasil dihapus!', 'success');
    } else {
      showToast(res.message, 'error');
    }
    setDeleteTargetThemeId(null);
  };

  return (
    <AdminLayout>
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#0284C7] block">
            HIRARKI MATERI: 1. TEMA ➔ 2. SUB TEMA ➔ 3. VIDEO
          </span>
          <h1 className="font-duo-display text-2xl sm:text-3xl font-bold text-[#4B4B4B]">
            Kelola Tema Pembelajaran
          </h1>
          <p className="text-sm font-bold text-[#777777]">
            Buat atau ubah tema utama, lalu klik <b>Kelola Sub Tema & Video</b> pada kartu tema untuk mengatur isi materinya.
          </p>
        </div>
        <Button
          size="md"
          variant="primary"
          onClick={handleOpenAdd}
          icon={<MaterialIcon name="add" className="text-xl" />}
        >
          Tambah Tema Baru
        </Button>
      </div>

      {/* Grid Tema */}
      {isLoading ? (
        <div className="p-12 text-center text-[#777777] font-bold">Memuat daftar tema pembelajaran...</div>
      ) : themes.length === 0 ? (
        <EmptyState
          materialIcon="folder_open"
          title="Belum Ada Tema Pembelajaran"
          description="Mulai tambahkan tema pertama untuk menyusun materi pembelajaran siswa."
          action={
            <Button size="sm" variant="primary" onClick={handleOpenAdd}>
              Buat Tema Pertama
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {themes.map((t, idx) => {
            const bgHex = t.warna_tema || t.warna_hex || '#0EA5E9';
            const subGroups = t.subthemes || [];
            const totalVideos = subGroups.reduce(
              (acc, g) => acc + ((g.videos && g.videos.length) || 0),
              0
            );
            const isPub = !t.status_publikasi || t.status_publikasi === 'PUBLISHED';

            return (
              <Card key={t.id} className="p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  {/* Top Banner inside Card */}
                  <div
                    className="nested-radius-banner relative overflow-hidden p-4 mb-4 flex items-center justify-between text-white min-h-[110px]"
                    style={{ backgroundColor: bgHex }}
                  >
                    <div className="relative z-10 pr-3 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-90 block truncate">
                        Tema {t.urutan || idx + 1} • {isPub ? 'Tayang di layar anak' : 'Disembunyikan'}
                      </span>
                      <h3 className="font-duo-display text-2xl font-bold leading-tight truncate">
                        {t.judul_tema}
                      </h3>
                      <span className="text-xs font-bold opacity-90 block mt-0.5 truncate">
                        {t.rentang_usia || 'Usia 4–6 Tahun'}
                      </span>
                    </div>

                    <div className="relative z-10 shrink-0 self-center my-auto flex items-center justify-center pointer-events-none">
                      <Icon name={t.ikon_emoji || 'star'} className="w-16 h-16 drop-shadow-sm" />
                    </div>
                  </div>

                  <p className="text-sm font-bold text-[#4B4B4B] mb-3 line-clamp-2">
                    {t.deskripsi}
                  </p>

                  <div className="flex items-center gap-2 mb-4 text-xs font-bold text-[#64748B]">
                    <span>{subGroups.length} Sub Tema</span>
                    <span>•</span>
                    <span>{totalVideos} Video Pembelajaran</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#E2E8F0]">
                  <Link to={`/admin/tema/${encodeURIComponent(t.id || t.slug)}`}>
                    <Button
                      size="sm"
                      variant="blue"
                      icon={<MaterialIcon name="folder_open" className="text-base" />}
                    >
                      Kelola Sub Tema & Video ({subGroups.length} Sub Tema)
                    </Button>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(t)}
                      icon={<MaterialIcon name="edit" className="text-base" />}
                      title="Ubah Tema"
                    />
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteTargetThemeId(t.id)}
                      icon={<MaterialIcon name="delete" className="text-base" />}
                      title="Hapus Tema"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Tambah/Edit Tema */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTheme ? 'Ubah Tema Pembelajaran' : 'Tambah Tema Pembelajaran Baru'}
        maxWidth="max-w-2xl"
      >
        {/* Contoh Kartu Tema di Atas Form Modal */}
        <div
          className="rounded-2xl p-4 mb-4 flex items-center justify-between text-white min-h-[96px] shadow-sm transition-colors duration-200"
          style={{ backgroundColor: formColor }}
        >
          <div className="pr-3 min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-90 block truncate">
              Contoh tampilan kartu tema
            </span>
            <h3 className="font-duo-display text-xl sm:text-2xl font-bold leading-tight truncate">
              {formTitle || 'Judul Tema Pembelajaran'}
            </h3>
            <span className="text-xs font-bold opacity-90 block mt-0.5 truncate">
              {formAge || 'Usia 4–6 Tahun (TK A & TK B)'}
            </span>
          </div>

          <div className="relative shrink-0 flex items-center justify-center pointer-events-none">
            <div
              className="relative flex items-center justify-center transition-transform duration-300"
              style={{ transform: 'rotate(-10deg)', transformOrigin: 'center center' }}
            >
              <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-white/20 blur-xl pointer-events-none -z-10" />
              <div style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }}>
                <Icon name={formIcon || 'police'} className="w-16 h-16" />
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveTheme} className="space-y-4">
          {/* 1. Judul Tema (Wajib *) */}
          <div>
            <Input
              label="Judul Tema Pembelajaran"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Contoh: Tema Profesi, Tema Binatang, Tema Tanaman..."
            />
          </div>

          {/* 2. Deskripsi Tema (Opsional) */}
          <div>
            <Textarea
              label="Penjelasan Singkat Tema (Opsional)"
              rows={2}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Tuliskan secara singkat apa yang akan dipelajari anak pada tema ini..."
            />
          </div>

          {/* 3. Pemilih Warna Kartu Tema */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#64748B] mb-2">
              Pilih Warna Kartu Tema <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {MADANI_SENTRA_COLOR_PALETTE.map((c) => {
                const isSelected = formColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setFormColor(c.hex)}
                    className={`h-10 rounded-xl flex items-center justify-center transition border-2 ${
                      isSelected ? 'ring-4 ring-[#334155] border-white scale-105' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.hex, boxShadow: `0 3px 0 ${c.lip}` }}
                    title={c.name}
                  >
                    <span className="text-white text-xs font-black drop-shadow">
                      {isSelected ? '✓ Dipilih' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Pemilih Ikon Gambar Tema */}
          <div>
            <IconPicker
              value={formIcon}
              onChange={(k) => setFormIcon(k)}
              mode="grid"
              label="Pilih Gambar Ikon Tema *"
            />
          </div>

          {/* 5. Pengaturan Tambahan (Opsional) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedAccordion((p) => !p)}
              className="text-xs font-extrabold text-[#64748B] hover:text-[#0EA5E9] flex items-center gap-1 transition"
            >
              <MaterialIcon name={showAdvancedAccordion ? 'expand_less' : 'tune'} className="text-base" />
              <span>Pengaturan Tambahan (Rentang Usia & Status Tampil)</span>
            </button>

            {showAdvancedAccordion && (
              <div className="mt-2 p-3.5 rounded-2xl bg-[#F8FAFC] border-2 border-[#E5E5E5] space-y-3 animate-pop-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Sasaran Usia Anak"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    placeholder="Usia 4–6 Tahun (TK A & TK B)"
                  />
                  <Input
                    label="Tulisan pada Tombol Kartu"
                    value={formBtnText}
                    onChange={(e) => setFormBtnText(e.target.value)}
                    placeholder="Mulai Belajar"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Urutan Tampil"
                    type="number"
                    min="1"
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                  />
                  <Select
                    label="Status Tampilan di Layar Anak"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    options={[
                      { value: 'PUBLISHED', label: 'Tampilkan di Halaman Anak' },
                      { value: 'DRAFT', label: 'Sembunyikan Sementara' }
                    ]}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              size="md"
              variant="outline"
              onClick={handleCloseModal}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="md"
              variant="primary"
              loading={isSaving}
              icon={<MaterialIcon name="check" className="text-lg" />}
            >
              Simpan Tema
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetThemeId)}
        onClose={() => setDeleteTargetThemeId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Tema Pembelajaran?"
        message="Tema ini beserta seluruh Sub Tema, Video, dan Kuis di dalamnya akan ikut terhapus. Lanjutkan?"
        confirmText="Ya, Hapus Tema"
        cancelText="Batal"
        variant="danger"
        icon="delete"
      />
    </AdminLayout>
  );
};
