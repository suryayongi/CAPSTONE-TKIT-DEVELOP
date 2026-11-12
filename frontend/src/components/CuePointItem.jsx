import React from 'react';
import { Button } from './Button';
import { Icon, MaterialIcon } from '../utils/icons';
import { formatSecondsToMMSS } from '../utils/formatters';

/**
 * Reusable CuePointItem Component
 * Menampilkan baris item pertanyaan kuis yang terpasang pada video pembelajaran.
 * Dilengkapi pengaman min-w-0 dan truncate agar teks panjang tidak pernah menembus container.
 */
export const CuePointItem = ({
  cuePoint,
  index,
  isEditing = false,
  onSelect,
  onDelete
}) => {
  const correctOption =
    cuePoint.tipe_interaksi === 'MULTIPLE_CHOICE'
      ? (cuePoint.payload_interaksi?.options || []).find((o) => o.is_correct)?.label
      : null;

  const interactionLabel =
    cuePoint.tipe_interaksi === 'MULTIPLE_CHOICE'
      ? 'Pilihan Bergambar'
      : cuePoint.tipe_interaksi === 'FLASHCARD_REVEAL'
      ? 'Kartu Tebak'
      : 'Ayo Bergerak';

  return (
    <div
      className={`p-3.5 rounded-xl transition-all border flex items-center justify-between gap-3 min-w-0 ${
        isEditing
          ? 'bg-violet-50/80 border-violet-400 shadow-xs'
          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
      }`}
    >
      <div
        onClick={() => onSelect && onSelect(cuePoint)}
        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
      >
        <div
          className={`w-11 h-11 rounded-xl bg-white border-2 p-1.5 flex items-center justify-center shrink-0 transition-colors ${
            isEditing ? 'border-[#8B5CF6] shadow-xs' : 'border-[#E5E5E5]'
          }`}
        >
          <Icon name={cuePoint.ikon_stimulus || 'question'} className="w-7 h-7" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span
              className={`px-2 py-0.5 rounded-lg font-mono text-xs font-extrabold tabular-nums shrink-0 transition-colors ${
                isEditing
                  ? 'bg-[#8B5CF6] text-white shadow-[0_1px_0_#6D28D9]'
                  : 'bg-[#FFC800] text-[#1E293B]'
              }`}
            >
              #{index + 1} • {formatSecondsToMMSS(cuePoint.detik_muncul)}
            </span>
            <span
              className={`px-2 py-0.5 rounded-lg border text-[11px] font-extrabold truncate ${
                isEditing
                  ? 'bg-white border-[#C4B5FD] text-[#6D28D9]'
                  : 'bg-white border-[#E5E5E5] text-[#64748B]'
              }`}
            >
              {interactionLabel}
            </span>

            {isEditing && (
              <span className="px-2 py-0.5 rounded-lg bg-[#7C3AED] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 animate-pop-in">
                <MaterialIcon name="edit" className="text-xs" />
                <span>Sedang Diedit</span>
              </span>
            )}
          </div>

          <p
            className={`text-sm font-extrabold truncate ${
              isEditing ? 'text-[#5B21B6]' : 'text-[#1E293B]'
            }`}
            title={cuePoint.judul_pertanyaan}
          >
            {cuePoint.judul_pertanyaan}
          </p>

          {correctOption && (
            <p className="text-xs font-bold text-[#059669] truncate mt-0.5">
              ✓ Jawaban: {correctOption}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          size="sm"
          variant={isEditing ? 'purple' : 'outline'}
          onClick={() => onSelect && onSelect(cuePoint)}
          icon={<MaterialIcon name="edit" className="text-base" />}
          title={isEditing ? 'Sedang Diedit' : 'Ubah Pertanyaan'}
        />
        <Button
          type="button"
          size="sm"
          variant="danger"
          onClick={() => onDelete && onDelete(cuePoint.id)}
          icon={<MaterialIcon name="delete" className="text-base" />}
          title="Hapus Pertanyaan"
        />
      </div>
    </div>
  );
};
