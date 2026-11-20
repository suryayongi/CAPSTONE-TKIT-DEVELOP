import React, { useState, useEffect, useRef } from 'react';
import { MaterialIcon, Icon } from '../utils/icons';
import { Button } from './Button';
import { audioEngine } from '../utils/audioEngine';
import { formatSecondsToMMSS } from '../utils/formatters';

export const QuizOverlay = ({
  cuePoint,
  onComplete,
  onSkip,
  isPreview = false
}) => {
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [hadWrongAttempt, setHadWrongAttempt] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'wrong', message: string }
  const [selectedOptId, setSelectedOptId] = useState(null);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(8);
  const timerIntervalRef = useRef(null);

  // Bacakan soal saat kuis muncul
  useEffect(() => {
    if (!cuePoint) return;

    setAnsweredCorrectly(false);
    setHadWrongAttempt(false);
    setFeedback(null);
    setSelectedOptId(null);
    setFlashcardRevealed(false);

    audioEngine.playPop();

    if (cuePoint.tipe_interaksi === 'ACTION_PROMPT') {
      const totalSec = Number(cuePoint.payload_interaksi && cuePoint.payload_interaksi.timer_detik) || 8;
      setTimerRemaining(totalSec);

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            audioEngine.playTick(true);
            audioEngine.playCorrect();
            setAnsweredCorrectly(true);
            return 0;
          }
          audioEngine.playTick(false);
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [cuePoint]);

  if (!cuePoint) return null;

  const handleSelectOption = (opt) => {
    if (answeredCorrectly) return;

    setSelectedOptId(opt.id);

    if (opt.is_correct) {
      audioEngine.playCorrect();
      setAnsweredCorrectly(true);
      const msg =
        (cuePoint.payload_interaksi && cuePoint.payload_interaksi.feedback_benar) ||
        'MasyaAllah, tepat sekali jawaban teman-teman!';
      setFeedback({ type: 'correct', message: msg });
    } else {
      audioEngine.playWrong();
      setHadWrongAttempt(true);
      const msg =
        (cuePoint.payload_interaksi && cuePoint.payload_interaksi.feedback_salah) ||
        'Hampir tepat. Ayo kita coba amati dan pilih jawaban lainnya ya.';
      setFeedback({ type: 'wrong', message: msg });
    }
  };

  const handleRevealFlashcard = () => {
    setFlashcardRevealed(true);
    setAnsweredCorrectly(true);
    audioEngine.playCorrect();
  };

  const options = (cuePoint.payload_interaksi && cuePoint.payload_interaksi.options) || [];
  const quizTypeLabel =
    cuePoint.tipe_interaksi === 'MULTIPLE_CHOICE'
      ? 'Kuis Pilihan Ganda'
      : cuePoint.tipe_interaksi === 'FLASHCARD_REVEAL'
      ? 'Tebak Lisan'
      : 'Ayo Tirukan Gerakan';

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Popup Kuis Berskala Besar (Mengisi ~70% Layar dengan Visual Jelas) */}
      <div className="duo-card w-[94vw] sm:w-[86vw] lg:w-[70vw] max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-9 lg:p-11 animate-pop-in shadow-2xl text-[#1E293B] bg-white border-2 border-[#E5E5E5] rounded-[32px] flex flex-col justify-between">
        <div>
          {/* Header Kuis */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-3 border-b-2 border-[#E5E5E5]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F7F7F7] text-[#4B4B4B] text-xs sm:text-sm font-bold border border-[#E5E5E5]">
                <MaterialIcon name="quiz" className="text-base text-[#0EA5E9]" />
                <span>
                  {quizTypeLabel} • Menit{' '}
                  <span className="font-mono tabular-nums">
                    {formatSecondsToMMSS(cuePoint.detik_muncul || 0)}
                  </span>
                </span>
              </span>

              {isPreview && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EDE9FE] text-[#6D28D9] text-xs font-extrabold border border-[#C4B5FD]">
                  <MaterialIcon name="visibility" className="text-sm" />
                  <span>Pratinjau Ukuran Asli Ruang Tonton Siswa</span>
                </span>
              )}
            </div>

            {isPreview ? (
              <Button
                size="sm"
                variant="outline"
                onClick={onSkip}
                icon={<MaterialIcon name="close" className="text-base" />}
              >
                Tutup Pratinjau
              </Button>
            ) : (
              <span className="text-xs sm:text-sm font-bold text-[#777777]">
                Pilih Jawaban di Bawah
              </span>
            )}
          </div>

          {/* Stimulus & Pertanyaan (Ukuran Ekstra Jelas) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-[#F7F7F7] p-5 sm:p-7 rounded-3xl border-2 border-[#E5E5E5] mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-[#E5E5E5] p-2.5 flex items-center justify-center shrink-0 shadow-xs">
              <Icon name={cuePoint.ikon_stimulus || 'question'} className="w-14 h-14 sm:w-16 sm:h-16" />
            </div>
            <h2 className="font-duo-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E293B] text-center sm:text-left leading-tight flex-1">
              {cuePoint.judul_pertanyaan}
            </h2>
          </div>

          {/* 1. Tipe MULTIPLE_CHOICE (Grid Opsi Taktil 3D Berskala Besar) */}
          {cuePoint.tipe_interaksi === 'MULTIPLE_CHOICE' && (
            <div className="space-y-4 mb-6">
              <div className={`grid grid-cols-1 ${options.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 sm:gap-6`}>
                {options.map((opt, idx) => {
                  const isSelected = selectedOptId === opt.id;
                  const isCorrect = opt.is_correct && answeredCorrectly;
                  const isWrong = isSelected && !opt.is_correct;

                  let tileClass = 'duo-tile p-5 sm:p-7 lg:p-8 flex flex-col items-center justify-center text-center gap-3 sm:gap-4 cursor-pointer relative min-h-[190px] sm:min-h-[220px] lg:min-h-[240px] rounded-[28px]';
                  if (isCorrect) tileClass += ' duo-tile-correct';
                  else if (isWrong) tileClass += ' duo-tile-wrong';
                  else if (isSelected) tileClass += ' duo-tile-selected';

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt)}
                      className={tileClass}
                      type="button"
                    >
                      <span className="absolute top-3 left-3 w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-[#E5E5E5] bg-white text-[#4B4B4B] font-duo-display text-sm sm:text-base font-bold flex items-center justify-center shadow-xs">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div className="my-1 sm:my-2">
                        <Icon name={opt.emoji || 'star'} className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28" />
                      </div>
                      <span className="font-duo-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#1E293B] leading-snug">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Tipe FLASHCARD_REVEAL */}
          {cuePoint.tipe_interaksi === 'FLASHCARD_REVEAL' && (
            <div className="mb-6 flex flex-col items-center text-center">
              {!flashcardRevealed ? (
                <button
                  type="button"
                  onClick={handleRevealFlashcard}
                  className="duo-btn duo-btn-sky w-full max-w-xl p-8 sm:p-12 rounded-[32px] !h-auto flex flex-col items-center justify-center gap-3 cursor-pointer"
                >
                  <Icon name="flashcard" className="w-20 h-20 sm:w-24 sm:h-24" />
                  <span className="font-duo-display text-2xl sm:text-3xl lg:text-4xl font-bold">
                    Buka Kartu Rahasia
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white/95 bg-black/20 px-4 py-1.5 rounded-full">
                    Klik untuk Membuka Jawaban
                  </span>
                </button>
              ) : (
                <div className="w-full max-w-xl p-8 sm:p-10 rounded-[32px] bg-[#D1FAE5] text-[#065F46] border-2 border-[#10B981] shadow-lg flex flex-col items-center justify-center gap-3.5 animate-pop-in">
                  <Icon name="star" className="w-16 h-16 sm:w-20 sm:h-20" />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#059669]">
                    Jawaban Guru & Teman-Teman
                  </span>
                  <p className="font-duo-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-relaxed text-[#065F46]">
                    {cuePoint.payload_interaksi?.jawaban_balik || 'Luar biasa!'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. Tipe ACTION_PROMPT */}
          {cuePoint.tipe_interaksi === 'ACTION_PROMPT' && (
            <div className="mb-6 flex flex-col items-center text-center space-y-4">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#0EA5E9] bg-[#E0F2FE] text-[#0284C7] font-duo-display text-5xl sm:text-6xl font-extrabold flex items-center justify-center shadow-md tabular-nums font-mono">
                {timerRemaining}s
              </div>
              {cuePoint.payload_interaksi?.instruksi_tambahan && (
                <p className="text-base sm:text-xl lg:text-2xl font-bold text-[#0369A1] bg-[#E0F2FE] px-6 py-3.5 rounded-2xl border border-[#BAE6FD]">
                  {cuePoint.payload_interaksi.instruksi_tambahan}
                </p>
              )}
            </div>
          )}

          {/* Banner Feedback Jawaban */}
          {feedback && (
            <div
              className={`p-4 sm:p-5 rounded-2xl mb-6 flex items-center gap-3.5 border-2 animate-pop-in ${
                feedback.type === 'correct'
                  ? 'bg-[#D1FAE5] text-[#065F46] border-[#10B981]'
                  : 'bg-[#FFF5D6] text-[#92400E] border-[#FFC800]'
              }`}
            >
              <MaterialIcon
                name={feedback.type === 'correct' ? 'check_circle' : 'info'}
                className="text-2xl sm:text-3xl shrink-0"
              />
              <span className="text-base sm:text-lg lg:text-xl font-bold leading-snug">
                {feedback.message}
              </span>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between pt-5 border-t-2 border-[#E5E5E5]">
          <Button size="md" variant="outline" onClick={onSkip}>
            {isPreview ? 'Tutup Pratinjau Soal' : 'Lewati Kuis'}
          </Button>

          {answeredCorrectly && (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => onComplete && onComplete({ hadWrongAttempt })}
              iconRight={<MaterialIcon name="arrow_forward" className="text-2xl" />}
            >
              {isPreview ? 'Selesai Uji Coba' : 'Lanjutkan Video'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
