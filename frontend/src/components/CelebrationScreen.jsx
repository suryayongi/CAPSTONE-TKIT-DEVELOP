import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Icon, MaterialIcon } from '../utils/icons';
import { Button } from './Button';
import { audioEngine } from '../utils/audioEngine';
import { PREDICATE_META } from '../utils/closingGame';

export const CelebrationScreen = ({
  isOpen,
  title = 'Alhamdulillah, Pelajaran Selesai',
  description = 'Ananda sudah selesai menyimak video pembelajaran dan permainan penutup dengan sangat baik.',
  replayLabel = 'Putar Ulang Video',
  finishLabel = 'Selesai & Kembali ke Materi',
  predicate = 'EXCELLENT',
  studentName = '',
  className = '',
  onReplay,
  onFinish
}) => {
  useEffect(() => {
    if (isOpen) {
      audioEngine.playCelebration();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const predInfo = PREDICATE_META[predicate === 'EXCELLENT' ? 'EXCELLENT' : 'GOOD'];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div className="duo-card w-[92vw] sm:w-[86vw] max-w-2xl max-h-[92vh] overflow-y-auto p-6 sm:p-10 text-center animate-pop-in shadow-2xl border border-slate-200 bg-white rounded-3xl space-y-6">
        {/* Simbol Piala / Bintang Utama (Bebas Skor Angka) */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center shadow-xs">
            <Icon name={predInfo.symbol} className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl border text-sm font-bold ${predInfo.badgeClass}`}>
            <span className="flex items-center gap-0.5">
              {Array.from({ length: predInfo.starCount }).map((_, idx) => (
                <MaterialIcon key={idx} name="star" className="text-lg text-amber-500" />
              ))}
            </span>
            <span>{predInfo.label} • {predInfo.praise}</span>
          </div>
        </div>

        <div className="space-y-2">
          {studentName && (
            <p className="text-sm sm:text-base font-bold text-emerald-700">
              Ananda {studentName} {className ? `(${className})` : ''}
            </p>
          )}

          <h2
            id="celebration-title"
            className="font-duo-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 leading-tight"
          >
            {title}
          </h2>

          <p className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed max-w-lg mx-auto">
            {studentName
              ? `Catatan PJJ ananda telah tersimpan untuk Ibu Guru. ${predInfo.description}`
              : description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mx-auto pt-2">
          <Button
            size="lg"
            variant="outline"
            fullWidth
            className="min-w-0 !whitespace-normal !h-auto min-h-[52px] py-3 px-4 leading-snug text-center"
            onClick={onReplay}
            icon={<MaterialIcon name="replay" className="text-xl shrink-0" />}
          >
            <span>{replayLabel}</span>
          </Button>

          <Button
            size="lg"
            variant="primary"
            fullWidth
            className="min-w-0 !whitespace-normal !h-auto min-h-[52px] py-3 px-4 leading-snug text-center"
            onClick={onFinish}
            iconRight={<MaterialIcon name="check_circle" className="text-xl shrink-0" />}
          >
            <span>{finishLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
