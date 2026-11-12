import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MaterialIcon } from '../utils/icons';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  className = ''
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalElement = (
    <div
      className="fixed inset-0 z-[9999] bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-white rounded-2xl border border-slate-200/90 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)] w-full ${maxWidth} p-6 sm:p-7 my-auto animate-pop-in max-h-[90vh] overflow-y-auto relative ${className}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-5">
          <h3 className="font-duo-display text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center hover:bg-slate-100 hover:border-slate-300 transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
            title="Tutup Modal"
          >
            <MaterialIcon name="close" className="text-xl" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : modalElement;
};
