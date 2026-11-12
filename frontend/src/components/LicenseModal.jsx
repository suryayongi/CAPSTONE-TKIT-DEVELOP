import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

/**
 * Reusable LicenseModal Component
 * Modal informasi sumber video, atribusi lisensi, dan deklarasi penyusun kuis
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {object} subtheme
 */
export const LicenseModal = ({ isOpen, onClose, subtheme }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Informasi Sumber Video & Lisensi"
    >
      <div className="space-y-4 text-xs sm:text-sm text-[#4B4B4B]">
        <div className="p-3.5 rounded-2xl bg-[#F7F7F7] border-2 border-[#E5E5E5] space-y-1">
          <span className="text-xs font-bold text-[#777777] block">Sumber Kanal Video</span>
          <p className="font-bold text-[#1E293B]">
            {subtheme?.sumber_atribusi || 'Kanal Edukasi Terbuka YouTube'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F7F7F7] border-2 border-[#E5E5E5] space-y-1">
          <span className="text-xs font-bold text-[#777777] block">Lisensi Penayangan</span>
          <p className="font-bold text-[#1E293B]">
            {subtheme?.jenis_lisensi || 'YouTube Standard License (Official IFrame Embed)'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F7F7F7] border-2 border-[#E5E5E5] space-y-1">
          <span className="text-xs font-bold text-[#777777] block">Penyusun Kuis Interaktif</span>
          <p className="font-bold text-[#1E293B]">
            {subtheme?.deklarasi_ai || 'Pertanyaan kuis interaktif disusun oleh Guru TKIT Al Madani.'}
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4 mt-4 border-t-2 border-[#E5E5E5]">
        <Button size="md" variant="secondary" onClick={onClose}>
          Tutup Informasi
        </Button>
      </div>
    </Modal>
  );
};
