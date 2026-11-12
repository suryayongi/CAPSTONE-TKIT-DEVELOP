import React, { useState } from 'react';
import { Icon, MaterialIcon } from '../utils/icons';
import { Button } from './Button';
import { Modal } from './Modal';

export const PublicFooter = () => {
  const [isAttributionOpen, setIsAttributionOpen] = useState(false);

  return (
    <>
      <footer className="mt-16 border-t-2 border-[#E5E5E5] bg-white py-8 px-4 sm:px-8 text-center">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon name="mascot" className="w-10 h-10" />
            <div className="text-left">
              <span className="font-duo-display text-xl font-black block leading-none">
                <span className="text-[#FFC800] drop-shadow-[0_1px_0_#D99B00]">Dunia</span>{' '}
                <span className="text-[#10B981]">Madani</span>
              </span>
              <p className="text-xs font-bold text-[#777777] mt-1">
                TKIT Al Madani • Tanjung Agung, Kab. Muara Enim, Sumatera Selatan
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-extrabold uppercase tracking-wider">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAttributionOpen(true)}
              icon={<MaterialIcon name="verified_user" className="text-base text-[#0EA5E9]" />}
              className="text-[#0EA5E9] border-[#E5E5E5] hover:border-[#0EA5E9]"
            >
              Informasi Sumber & Lisensi
            </Button>
          </div>
        </div>
      </footer>

      {/* Modal Global Informasi Sumber & Lisensi */}
      <Modal
        isOpen={isAttributionOpen}
        onClose={() => setIsAttributionOpen(false)}
        title="Informasi Sumber Materi & Lisensi"
        maxWidth="max-w-lg"
      >
        <div className="space-y-3 text-sm text-[#4B4B4B] leading-relaxed font-semibold">
          <div className="p-3.5 rounded-2xl bg-[#DDF4FF] border-2 border-[#84D8FF]">
            <p className="font-extrabold text-[#1899D6] uppercase text-xs tracking-wider mb-1">
              1. Video Pembelajaran (Pemutar Resmi YouTube)
            </p>
            <p className="text-xs text-[#4B4B4B]">
              Seluruh materi video diputar langsung dari layanan resmi YouTube tanpa mengunduh atau mengubah berkas video asli pemilik kanal.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#D1FAE5] border-2 border-[#10B981]">
            <p className="font-extrabold text-[#059669] uppercase text-xs tracking-wider mb-1">
              2. Huruf & Ilustrasi Ramah Anak
            </p>
            <p className="text-xs text-[#4B4B4B]">
              Menggunakan huruf <b>Fredoka</b> & <b>Nunito</b> (Google Fonts) serta ilustrasi visual yang dirancang ramah untuk anak usia dini.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FFF5D6] border-2 border-[#FFC800]">
            <p className="font-extrabold text-[#CD7900] uppercase text-xs tracking-wider mb-1">
              3. Kurasi Materi & Suara Pembaca Soal
            </p>
            <p className="text-xs text-[#4B4B4B]">
              Penyusunan materi tema, subtema, pertanyaan kuis interaktif, dan pembacaan suara otomatis Bahasa Indonesia dikelola oleh Guru TKIT Al Madani.
            </p>
          </div>
        </div>
        <div className="mt-6 text-right">
          <Button
            size="md"
            variant="secondary"
            onClick={() => setIsAttributionOpen(false)}
            icon={<MaterialIcon name="check" className="text-lg" />}
          >
            Mengerti
          </Button>
        </div>
      </Modal>
    </>
  );
};
