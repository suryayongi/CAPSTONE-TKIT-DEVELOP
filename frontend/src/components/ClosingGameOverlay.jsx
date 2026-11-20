import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Icon, MaterialIcon } from '../utils/icons';
import { Button } from './Button';
import { audioEngine } from '../utils/audioEngine';
import { PREDICATE_META } from '../utils/closingGame';

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Permainan Interaktif Penutup Akhir Video (Poin 5 & Evaluasi Simbol Non-Numerik Poin 6)
 * Mendukung 2 mode ramah anak usia dini:
 * 1. PAIR_MATCH: Cocokkan kartu gambar kembar (tanpa skor angka, hanya simbol bintang & predikat)
 * 2. QUICK_PICK: Pilih gambar yang sesuai dengan cerita video
 */
const createShuffledCards = (pairList) => {
  const doubled = pairList.flatMap((pair, idx) => [
    { uid: `${pair.id || idx}-a`, pairId: pair.id || String(idx), emoji: pair.emoji, label: pair.label },
    { uid: `${pair.id || idx}-b`, pairId: pair.id || String(idx), emoji: pair.emoji, label: pair.label }
  ]);
  return shuffleArray(doubled);
};

export const ClosingGameOverlay = ({ isOpen, gameConfig, ...props }) => {
  if (!isOpen || !gameConfig) return null;
  return <ClosingGameDialog gameConfig={gameConfig} {...props} />;
};

const ClosingGameDialog = ({
  gameConfig,
  isPreview = false,
  onComplete,
  onSkip
}) => {
  const mode = gameConfig?.mode === 'QUICK_PICK' ? 'QUICK_PICK' : 'PAIR_MATCH';

  const pairList = useMemo(() => {
    const list = Array.isArray(gameConfig?.pairs) ? gameConfig.pairs : [];
    return list.slice(0, 4);
  }, [gameConfig]);

  const quickItems = useMemo(() => {
    return Array.isArray(gameConfig?.items) ? gameConfig.items : [];
  }, [gameConfig]);

  const correctTargetIds = useMemo(
    () => new Set(quickItems.filter((it) => it.is_correct).map((it) => it.id)),
    [quickItems]
  );

  // State PAIR_MATCH
  const [cards, setCards] = useState(() =>
    mode === 'PAIR_MATCH' ? createShuffledCards(pairList) : []
  );
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState(new Set());
  const [isCheckingLock, setIsCheckingLock] = useState(false);

  // State QUICK_PICK
  const [pickedCorrectIds, setPickedCorrectIds] = useState(new Set());
  const [wrongPickId, setWrongPickId] = useState(null);

  // State Non-Numerik Bersama
  const [mistakeCount, setMistakeCount] = useState(0);
  const [hintText, setHintText] = useState('');
  const [isGameFinished, setIsGameFinished] = useState(false);

  const flipTimerRef = useRef(null);

  const initGame = () => {
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    setFlippedIndices([]);
    setMatchedPairIds(new Set());
    setPickedCorrectIds(new Set());
    setWrongPickId(null);
    setMistakeCount(0);
    setHintText('');
    setIsCheckingLock(false);
    setIsGameFinished(false);

    if (mode === 'PAIR_MATCH') {
      setCards(createShuffledCards(pairList));
    }
  };

  useEffect(() => {
    audioEngine.playPop();
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, []);

  const totalStars =
    mode === 'PAIR_MATCH' ? pairList.length : Math.max(1, correctTargetIds.size);
  const litStars =
    mode === 'PAIR_MATCH' ? matchedPairIds.size : pickedCorrectIds.size;

  const maxMistakesForExcellent =
    mode === 'PAIR_MATCH' ? Math.max(4, pairList.length * 2) : 1;
  const predicateCode = mistakeCount <= maxMistakesForExcellent ? 'EXCELLENT' : 'GOOD';
  const predicateInfo = PREDICATE_META[predicateCode];

  const triggerWinFeedback = () => {
    setIsGameFinished(true);
    audioEngine.playCelebration();
    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  const handleCardTap = (idx) => {
    if (isCheckingLock || isGameFinished) return;
    if (flippedIndices.includes(idx)) return;
    const tapped = cards[idx];
    if (!tapped || matchedPairIds.has(tapped.pairId)) return;

    audioEngine.playPop();
    const nextFlipped = [...flippedIndices, idx];
    setFlippedIndices(nextFlipped);
    setHintText('');

    if (nextFlipped.length === 2) {
      const [firstIdx, secondIdx] = nextFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        const nextMatched = new Set(matchedPairIds);
        nextMatched.add(firstCard.pairId);
        setMatchedPairIds(nextMatched);
        setFlippedIndices([]);
        audioEngine.playCorrect();
        setHintText(`Cocok: ${firstCard.label}`);

        if (nextMatched.size >= pairList.length) {
          triggerWinFeedback();
        }
      } else {
        setIsCheckingLock(true);
        setMistakeCount((c) => c + 1);
        setHintText('Belum kembar, ayo coba buka kartu lainnya.');
        flipTimerRef.current = setTimeout(() => {
          setFlippedIndices([]);
          setIsCheckingLock(false);
        }, 780);
      }
    }
  };

  const handleQuickPickTap = (item) => {
    if (isGameFinished) return;

    if (item.is_correct) {
      if (pickedCorrectIds.has(item.id)) return;
      const nextPicked = new Set(pickedCorrectIds);
      nextPicked.add(item.id);
      setPickedCorrectIds(nextPicked);
      setWrongPickId(null);
      audioEngine.playCorrect();
      setHintText(`Tepat sekali: ${item.label}`);

      if (nextPicked.size >= correctTargetIds.size) {
        triggerWinFeedback();
      }
    } else {
      setWrongPickId(item.id);
      setMistakeCount((c) => c + 1);
      audioEngine.playWrong();
      setHintText('Hampir tepat, coba pilih gambar lain yang sesuai dengan cerita tadi.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="closing-game-title"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-[94vw] max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 animate-pop-in flex flex-col justify-between gap-6">
        {/* Header Bar & Indikator Bintang Non-Numerik */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <MaterialIcon name="sports_esports" className="text-xl text-amber-600" />
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-700 block">
                {isPreview ? 'Pratinjau Permainan Penutup' : 'Aktivitas Akhir Video'}
              </span>
              <h2
                id="closing-game-title"
                className="font-duo-display text-lg sm:text-2xl font-bold text-slate-800 leading-tight"
              >
                {gameConfig.title}
              </h2>
            </div>
          </div>

          {/* Simbol Bintang Kemajuan (Bebas Angka) */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200"
            aria-label="Bintang pencapaian permainan"
          >
            {Array.from({ length: totalStars }).map((_, idx) => {
              const isLit = idx < litStars;
              return (
                <MaterialIcon
                  key={idx}
                  name={isLit ? 'star' : 'star_outline'}
                  className={`text-2xl transition-transform duration-200 ${
                    isLit ? 'text-amber-400 scale-110' : 'text-slate-300'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Instruksi Singkat */}
        <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm sm:text-base font-semibold text-slate-700 text-center sm:text-left">
            {gameConfig.instruction}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={initGame}
            icon={<MaterialIcon name="shuffle" className="text-base" />}
          >
            Main Ulang
          </Button>
        </div>

        {/* Arena Permainan */}
        {mode === 'PAIR_MATCH' ? (
          <div
            className={`grid gap-3 sm:gap-4 ${
              cards.length <= 4 ? 'grid-cols-2 max-w-xl mx-auto w-full' : 'grid-cols-2 sm:grid-cols-3'
            }`}
          >
            {cards.map((card, idx) => {
              const isMatched = matchedPairIds.has(card.pairId);
              const isFlipped = flippedIndices.includes(idx) || isMatched;

              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleCardTap(idx)}
                  disabled={isMatched || isCheckingLock}
                  className={`min-h-[140px] sm:min-h-[164px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-colors duration-150 cursor-pointer select-none ${
                    isMatched
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : isFlipped
                      ? 'bg-amber-50/70 border-amber-400 text-slate-800'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-500'
                  }`}
                >
                  {isFlipped ? (
                    <>
                      <Icon name={card.emoji || 'star'} className="w-16 h-16 sm:w-20 sm:h-20" />
                      <span className="font-duo-display text-sm sm:text-base font-bold text-slate-800 text-center leading-snug">
                        {card.label}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                        <MaterialIcon name="help_outline" className="text-3xl text-slate-400" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500">Ketuk Kartu</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {quickItems.map((item) => {
              const isPicked = pickedCorrectIds.has(item.id);
              const isWrong = wrongPickId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleQuickPickTap(item)}
                  className={`min-h-[156px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2.5 transition-colors duration-150 cursor-pointer ${
                    isPicked
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : isWrong
                      ? 'bg-amber-50 border-amber-400 text-amber-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <Icon name={item.emoji || 'star'} className="w-16 h-16 sm:w-20 sm:h-20" />
                  <span className="font-duo-display text-sm sm:text-base font-bold text-center leading-snug">
                    {item.label}
                  </span>
                  {isPicked && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <MaterialIcon name="check_circle" className="text-base" />
                      <span>Tepat</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Umpan Balik Kualitatif Tanpa Angka */}
        {isGameFinished ? (
          <div className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row items-center gap-4 animate-pop-in ${predicateInfo.badgeClass}`}>
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${predicateInfo.iconBgClass}`}>
              <Icon name={predicateInfo.symbol} className="w-10 h-10" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
                <span className="font-duo-display text-lg font-bold">
                  {predicateInfo.label} — {predicateInfo.praise}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold opacity-90">
                Semua bintang permainan penutup sudah menyala terang.
              </p>
            </div>
          </div>
        ) : (
          hintText && (
            <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MaterialIcon name="lightbulb" className="text-lg text-amber-500 shrink-0" />
              <span>{hintText}</span>
            </div>
          )
        )}

        {/* Footer Action */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button type="button" size="sm" variant="outline" onClick={onSkip}>
            {isPreview ? 'Tutup Pratinjau' : 'Lewati Permainan'}
          </Button>

          {isGameFinished && (
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={() => onComplete && onComplete(predicateCode)}
              iconRight={<MaterialIcon name="arrow_forward" className="text-xl" />}
            >
              {isPreview ? 'Selesai Uji Coba' : 'Lanjutkan'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
