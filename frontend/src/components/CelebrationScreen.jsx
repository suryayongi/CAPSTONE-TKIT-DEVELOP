import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Icon, MaterialIcon } from '../utils/icons';
import { Button } from './Button';
import { audioEngine } from '../utils/audioEngine';

export const CelebrationScreen = ({
  isOpen,
  title = 'Pelajaran Selesai! Luar Biasa!',
  description = 'Alhamdulillah, teman-teman sudah selesai menonton dan menjawab semua kuis interaktif dengan sangat hebat!',
  replayLabel = 'Putar Ulang Video',
  finishLabel = 'Selesai & Kembali ke Katalog',
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

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="duo-card w-[92vw] sm:w-[80vw] lg:w-[65vw] max-w-3xl p-8 sm:p-12 text-center animate-pop-in shadow-2xl border-2 border-[#E5E5E5] bg-white rounded-[32px]">
        {/* Trophy Craft Moment Besar */}
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#FFF5D6] border-4 border-[#FFC800] flex items-center justify-center shadow-md animate-bounce-subtle">
            <Icon name="trophy" className="w-20 h-20 sm:w-24 sm:h-24" />
          </div>
        </div>

        <h2 className="font-duo-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E293B] leading-tight mb-3">
          {title}
        </h2>

        <p className="text-base sm:text-lg lg:text-xl font-bold text-[#64748B] leading-relaxed mb-8 max-w-xl mx-auto">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
          <Button
            size="lg"
            variant="outline"
            fullWidth
            onClick={onReplay}
            icon={<MaterialIcon name="replay" className="text-2xl" />}
          >
            {replayLabel}
          </Button>

          <Button
            size="lg"
            variant="primary"
            fullWidth
            onClick={onFinish}
            iconRight={<MaterialIcon name="check_circle" className="text-2xl" />}
          >
            {finishLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
