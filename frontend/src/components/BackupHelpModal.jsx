import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { MaterialIcon } from '../utils/icons';

/**
 * Reusable BackupHelpModal Component
 * Modal panduan dan tutorial cara menggunakan fitur Cadangan & Pemindahan Materi Belajar
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 */
export const BackupHelpModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Panduan Cadangan & Pemindahan Materi Belajar"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5 text-sm text-[#4B4B4B] leading-relaxed">
        {/* Info Utama */}
        <div className="p-4 rounded-2xl bg-[#E0F2FE] border-2 border-[#38BDF8] text-[#0284C7] flex items-start gap-3">
          <MaterialIcon name="info" className="text-2xl shrink-0 mt-0.5" />
          <div>
            <h4 className="font-duo-display text-base font-bold text-[#0284C7]">
              Mengapa Fitur Cadangan Ini Sangat Penting?
            </h4>
            <p className="text-xs sm:text-sm font-bold text-[#4B4B4B] mt-1">
              Semua data tema, video, dan kuis yang Ibu/Bapak Guru susun tersimpan secara aman di peramban komputer ini. Fitur cadangan memastikan materi <b>tidak akan pernah hilang</b> dan dapat <b>dibagikan ke sesama guru atau proyektor kelas</b> dalam hitungan detik.
            </p>
          </div>
        </div>

        {/* 3 Fungsi Utama (Simpan, Muat, Reset) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#F7F7F7] border-2 border-[#E5E5E5] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center">
              <MaterialIcon name="download" className="text-xl" />
            </div>
            <h5 className="font-duo-display text-base font-bold text-[#4B4B4B]">
              Simpan
            </h5>
            <p className="text-xs font-bold text-[#777777]">
              Mengunduh seluruh kurikulum dan kuis menjadi satu berkas cadangan ke folder unduhan komputer Anda.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F7F7] border-2 border-[#E5E5E5] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] text-[#059669] flex items-center justify-center">
              <MaterialIcon name="upload_file" className="text-xl" />
            </div>
            <h5 className="font-duo-display text-base font-bold text-[#4B4B4B]">
              Muat
            </h5>
            <p className="text-xs font-bold text-[#777777]">
              Memasukkan berkas cadangan yang sudah disimpan ke komputer atau laptop kelas lain agar materi langsung siap digunakan.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F7F7] border-2 border-[#E5E5E5] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FFF5D6] text-[#B45309] flex items-center justify-center">
              <MaterialIcon name="restart_alt" className="text-xl" />
            </div>
            <h5 className="font-duo-display text-base font-bold text-[#4B4B4B]">
              Reset
            </h5>
            <p className="text-xs font-bold text-[#777777]">
              Mengembalikan seluruh data tema dan kuis ke contoh materi bawaan TKIT Al Madani bila ingin memulai kembali dari awal.
            </p>
          </div>
        </div>

        {/* Tutorial Langkah Demi Langkah */}
        <div className="p-5 rounded-2xl bg-[#F7F7F7] border-2 border-[#E5E5E5] space-y-3">
          <h4 className="font-duo-display text-base font-bold text-[#4B4B4B] flex items-center gap-2">
            <MaterialIcon name="checklist" className="text-xl text-[#10B981]" />
            <span>Cara Memindahkan Materi Belajar ke Laptop Kelas Lain:</span>
          </h4>
          <ol className="space-y-2 text-xs sm:text-sm font-bold text-[#4B4B4B] list-decimal list-inside pl-1">
            <li>
              Di laptop utama Ibu/Bapak Guru, klik tombol <b>"Simpan"</b>. Berkas materi akan otomatis terunduh.
            </li>
            <li>
              Kirim berkas cadangan tersebut ke laptop kelas lain (melalui flashdisk, email, atau WhatsApp Web).
            </li>
            <li>
              Buka website Studio Guru di laptop kelas baru, lalu klik <b>"Muat"</b> dan pilih berkas tersebut.
            </li>
            <li>
              Selesai! Seluruh tema, video, dan kuis interaktif akan langsung muncul sama persis dan siap diputar di kelas.
            </li>
          </ol>
        </div>
      </div>

      <div className="flex justify-end pt-4 mt-5 border-t-2 border-[#E5E5E5]">
        <Button size="md" variant="secondary" onClick={onClose}>
          Saya Paham, Tutup Panduan
        </Button>
      </div>
    </Modal>
  );
};
