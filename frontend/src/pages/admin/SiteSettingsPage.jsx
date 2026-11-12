import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminLayout,
  Card,
  Button,
  Input,
  Textarea,
  SpeechBubble,
  ConfirmModal,
  useToast
} from '../../components';
import { Icon, MaterialIcon } from '../../utils/icons';
import { curriculumService } from '../../services/curriculumService';

export const SiteSettingsPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'catalog'
  const [isSaving, setIsSaving] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const { data: configData, isLoading } = useQuery({
    queryKey: ['siteConfig'],
    queryFn: () => curriculumService.getSiteConfig()
  });

  const [formState, setFormState] = useState({
    banner_headline: 'Ayo Mulai Petualangan Belajar Hari Ini!',
    banner_subheadline: 'Pilih tema dan subtema belajar, tonton video seru bersama Ibu Guru, dan jawab pertanyaan kuisnya!',
    banner_mascot_greeting: 'Halo Sahabat Madani! Siap bermain?',
    catalog_section_title: 'Pilih Tema Pembelajaran',
    empty_catalog_title: 'Belum Ada Materi yang Ditampilkan',
    empty_catalog_desc: 'Ibu Guru sedang menyiapkan video pembelajaran yang seru untuk teman-teman.',
    theme_back_label: 'Kembali ke Daftar Tema',
    episode_section_title: 'Pilih Sub Tema & Video Pembelajaran',
    episode_play_label: 'Putar Video',
    celebration_title: 'Alhamdulillah, Kamu Hebat!',
    celebration_desc: 'Kamu telah menyelesaikan video dan kuis interaktif dengan luar biasa.',
    celebration_replay_btn: 'Putar Ulang Video',
    celebration_finish_btn: 'Selesai & Kembali ke Materi',
    default_wrong_feedback: 'Hampir tepat! Yuk coba amati lagi gambarnya!'
  });

  useEffect(() => {
    if (configData?.data) {
      setFormState((prev) => ({
        ...prev,
        ...configData.data
      }));
    }
  }, [configData]);

  const handleChange = (field, val) => {
    setFormState((prev) => ({
      ...prev,
      [field]: val
    }));
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);

    const res = await curriculumService.saveSiteConfig(formState);
    setIsSaving(false);

    if (res.success) {
      queryClient.invalidateQueries();
      showToast('Perubahan teks dan sambutan berhasil disimpan!', 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleConfirmReset = async () => {
    const res = await curriculumService.resetSeedData();
    if (res.success) {
      queryClient.invalidateQueries();
      showToast('Seluruh teks telah dikembalikan ke kalimat awal!', 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-[#777777] font-bold">Memuat pengaturan tampilan...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#D97706] block">
            ATUR KALIMAT SAMBUTAN & PUJIAN
          </span>
          <h1 className="font-duo-display text-2xl sm:text-3xl font-bold text-[#4B4B4B]">
            Pengaturan Tampilan & Sambutan
          </h1>
          <p className="text-sm font-bold text-[#777777]">
            Ubah kalimat sapaan di halaman depan, pesan maskot lebah, hingga ucapan pujian saat anak selesai menonton video.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/">
            <Button
              size="md"
              variant="outline"
              icon={<MaterialIcon name="visibility" className="text-base text-[#10B981]" />}
            >
              Lihat Halaman Belajar Anak
            </Button>
          </Link>
        </div>
      </div>

      {/* 2 Tab Navigasi Visual (Tanpa Identitas Brand Header/Footer) */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b-2 border-[#E5E5E5] pb-3">
        {[
          { id: 'hero', label: '1. Sambutan Halaman Depan & Maskot', icon: 'campaign' },
          { id: 'catalog', label: '2. Teks Halaman & Ucapan Selesai Belajar', icon: 'celebration' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-duo-display text-sm font-bold transition flex items-center gap-2 ${
                isActive
                  ? 'bg-[#E0F2FE] text-[#0284C7] border-2 border-[#0EA5E9] shadow-xs'
                  : 'bg-white text-[#777777] border-2 border-[#E5E5E5] hover:border-[#CBD5E1]'
              }`}
            >
              <MaterialIcon name={tab.icon} className="text-xl" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6 pb-20">
        {/* TAB 1: SAMBUTAN HALAMAN DEPAN & SAPAAN MASKOT */}
        {activeTab === 'hero' && (
          <div className="space-y-5 animate-pop-in">
            {/* Contoh Tampilan di Layar Anak */}
            <Card className="p-4 sm:p-5 bg-[#F8FAFC]">
              <span className="text-[10px] font-black uppercase text-[#0EA5E9] block mb-2">
                CONTOH TAMPILAN SAMBUTAN DI LAYAR ANAK
              </span>
              <div className="duo-card relative overflow-hidden bg-white border-2 border-[#E5E5E5] p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="max-w-md">
                  <h2 className="font-duo-display text-2xl font-bold text-[#4B4B4B] leading-tight">
                    {formState.banner_headline || 'Ayo Mulai Petualangan Belajar!'}
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-[#777777] mt-2 leading-relaxed">
                    {formState.banner_subheadline || 'Tonton video edukasi interaktif dan jawab kuisnya.'}
                  </p>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <SpeechBubble className="text-xs font-black text-[#4B4B4B] mb-2">
                    {formState.banner_mascot_greeting || 'Halo Sahabat Madani!'}
                  </SpeechBubble>
                  <Icon name="mascot" className="w-20 h-20" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-duo-display text-xl font-bold text-[#4B4B4B] mb-4 pb-2 border-b-2 border-[#E5E5E5] flex items-center gap-2">
                <MaterialIcon name="campaign" className="text-2xl text-[#10B981]" />
                <span>Isi Kalimat Sambutan & Maskot</span>
              </h2>

              <div className="space-y-4">
                <Input
                  label="Judul Sambutan Utama di Halaman Depan"
                  required
                  value={formState.banner_headline}
                  onChange={(e) => handleChange('banner_headline', e.target.value)}
                  placeholder="Ayo Mulai Petualangan Belajar Hari Ini!"
                />

                <Textarea
                  label="Kalimat Ajakan Belajar di Bawah Judul"
                  required
                  rows={2}
                  value={formState.banner_subheadline}
                  onChange={(e) => handleChange('banner_subheadline', e.target.value)}
                  placeholder="Pilih tema belajar, tonton video seru bersama Ibu Guru..."
                />

                <Input
                  label="Kalimat Sapaan Maskot Lebah"
                  value={formState.banner_mascot_greeting}
                  onChange={(e) => handleChange('banner_mascot_greeting', e.target.value)}
                  placeholder="Halo Sahabat Madani! Siap bermain?"
                />
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: TEKS HALAMAN & UCAPAN SELESAI BELAJAR */}
        {activeTab === 'catalog' && (
          <div className="space-y-5 animate-pop-in">
            {/* Contoh Tampilan Ucapan Selesai Menonton */}
            <Card className="p-4 sm:p-5 bg-[#F8FAFC]">
              <span className="text-[10px] font-black uppercase text-[#0EA5E9] block mb-2">
                CONTOH TAMPILAN UCAPAN SELAMAT SAAT VIDEO SELESAI
              </span>
              <div className="bg-white border-2 border-[#10B981] rounded-2xl p-5 text-center max-w-md mx-auto shadow-sm">
                <Icon name="crown" className="w-12 h-12 mx-auto mb-2" />
                <h3 className="font-duo-display text-xl font-bold text-[#4B4B4B]">
                  {formState.celebration_title || 'Alhamdulillah, Kamu Hebat!'}
                </h3>
                <p className="text-xs font-bold text-[#777777] mt-1">
                  {formState.celebration_desc || 'Kamu telah menyelesaikan video dan kuis interaktif.'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="duo-btn duo-btn-primary !h-[34px] !px-3 !text-[11px]">
                    {formState.celebration_finish_btn || 'Selesai & Kembali'}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-duo-display text-xl font-bold text-[#4B4B4B] mb-4 pb-2 border-b-2 border-[#E5E5E5] flex items-center gap-2">
                <MaterialIcon name="celebration" className="text-2xl text-[#0EA5E9]" />
                <span>Atur Teks Judul, Tombol & Ucapan Selamat</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Judul Bagian Daftar Tema di Beranda"
                    required
                    value={formState.catalog_section_title}
                    onChange={(e) => handleChange('catalog_section_title', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Judul Ucapan Selamat (Saat Video Selesai)"
                    required
                    value={formState.celebration_title}
                    onChange={(e) => handleChange('celebration_title', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Textarea
                    label="Pesan Pujian Saat Anak Selesai Menonton Video"
                    rows={2}
                    value={formState.celebration_desc}
                    onChange={(e) => handleChange('celebration_desc', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Teks Tombol Selesai Belajar"
                    value={formState.celebration_finish_btn}
                    onChange={(e) => handleChange('celebration_finish_btn', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Teks Tombol Putar Ulang Video"
                    value={formState.celebration_replay_btn}
                    onChange={(e) => handleChange('celebration_replay_btn', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Teks Tombol Kembali ke Daftar Tema"
                    value={formState.theme_back_label}
                    onChange={(e) => handleChange('theme_back_label', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Teks Tombol Putar Video"
                    value={formState.episode_play_label}
                    onChange={(e) => handleChange('episode_play_label', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Kalimat Penyemangat Saat Jawaban Kuis Anak Belum Tepat"
                    value={formState.default_wrong_feedback}
                    onChange={(e) => handleChange('default_wrong_feedback', e.target.value)}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Sticky Save Bar di Bagian Bawah Layar */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-[#CBD5E1] p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-[#64748B]">
            <MaterialIcon name="info" className="text-lg text-[#0EA5E9]" />
            <span className="hidden sm:inline">Klik tombol Simpan setelah mengubah kalimat di atas agar tampil di layar anak.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="md"
              variant="outline"
              onClick={() => setIsResetConfirmOpen(true)}
              icon={<MaterialIcon name="restart_alt" className="text-lg text-[#F59E0B]" />}
            >
              Kembalikan Teks Awal
            </Button>

            <Button
              type="submit"
              size="md"
              variant="primary"
              loading={isSaving}
              icon={<MaterialIcon name="save" className="text-xl" />}
            >
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </form>

      {/* Confirm Reset Seed Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Kembalikan ke Kalimat Awal?"
        message="Seluruh teks sambutan dan ucapan pujian akan dikembalikan ke kalimat awal. Lanjutkan?"
        confirmText="Ya, Kembalikan"
        cancelText="Batal"
        variant="danger"
        icon="restart_alt"
      />
    </AdminLayout>
  );
};
