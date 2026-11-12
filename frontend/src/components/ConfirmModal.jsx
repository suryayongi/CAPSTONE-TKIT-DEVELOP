import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { MaterialIcon } from '../utils/icons';

/**
 * Duolingo-Styled Action Confirmation Dialog (Pengganti window.confirm)
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Aksi',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger',
  icon = 'warning'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <MaterialIcon name={icon} className="text-2xl" />
          </div>
          <p className="text-sm font-bold text-[#4B4B4B] leading-relaxed pt-1">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button size="md" variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            size="md"
            variant={variant}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
