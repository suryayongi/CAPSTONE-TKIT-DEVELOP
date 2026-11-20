import React from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { IconPicker } from './IconPicker';
import { MaterialIcon } from '../utils/icons';

/**
 * Formulir Pengaturan Permainan Penutup Akhir Video (Poin 5) & Mode PJJ (Poin 6)
 * Digunakan di dalam Studio Kuis Guru (/admin/subtema/:subId/studio).
 */
export const ClosingGameForm = ({
  gameEnabled,
  setGameEnabled,
  gameMode,
  setGameMode,
  gameTitle,
  setGameTitle,
  gameInstruction,
  setGameInstruction,
  pairs,
  setPairs,
  quickItems,
  setQuickItems,
  isPjjEnabled,
  setIsPjjEnabled,
  pjjNotes,
  setPjjNotes,
  isSaving,
  onSave,
  onPreview
}) => {
  const handlePairChange = (idx, field, val) => {
    const next = [...pairs];
    next[idx] = { ...next[idx], [field]: val };
    setPairs(next);
  };

  const handleQuickItemChange = (idx, field, val) => {
    const next = [...quickItems];
    next[idx] = { ...next[idx], [field]: val };
    setQuickItems(next);
  };

  return (
    <form onSubmit={onSave} className="space-y-5 min-w-0">
      {/* Bagian A: Mode Permainan Penutup Akhir Video (Poin 5) */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-duo-display text-base font-bold text-slate-800 flex items-center gap-2">
              <MaterialIcon name="sports_esports" className="text-xl text-amber-600" />
              <span>Permainan Penutup Akhir Video</span>
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Muncul otomatis setelah video selesai sebelum layar apresiasi agar penutup belajar tetap seru.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer shrink-0 select-none">
            <input
              type="checkbox"
              checked={gameEnabled}
              onChange={(e) => setGameEnabled(e.target.checked)}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700">Aktif</span>
          </label>
        </div>

        {gameEnabled && (
          <div className="space-y-4 pt-2 border-t border-slate-200/80">
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'PAIR_MATCH',
                  label: 'Cocokkan Kembar',
                  desc: 'Ketuk 2 gambar sama',
                  icon: 'grid_view'
                },
                {
                  id: 'QUICK_PICK',
                  label: 'Pilih Gambar Tepat',
                  desc: 'Pilih benda di cerita',
                  icon: 'touch_app'
                }
              ].map((m) => {
                const isSelected = gameMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setGameMode(m.id)}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <MaterialIcon name={m.icon} className="text-base" />
                      <span>{m.label}</span>
                    </div>
                    <span className="text-[11px] font-medium opacity-80 block mt-0.5">{m.desc}</span>
                  </button>
                );
              })}
            </div>

            <Input
              label="Judul Permainan Penutup"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="Contoh: Permainan Penutup: Cocokkan Perlengkapan Pak Polisi"
            />

            <Textarea
              label="Instruksi Singkat untuk Anak"
              rows={2}
              value={gameInstruction}
              onChange={(e) => setGameInstruction(e.target.value)}
              placeholder="Contoh: Ketuk dua kartu gambar yang sama hingga semua bintang menyala."
            />

            {gameMode === 'PAIR_MATCH' ? (
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-700 block">
                  Daftar Kartu Gambar Kembar (2 atau 3 Pasangan)
                </span>
                {pairs.map((pair, idx) => (
                  <div
                    key={pair.id || idx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200"
                  >
                    <IconPicker
                      value={pair.emoji || 'star'}
                      onChange={(k) => handlePairChange(idx, 'emoji', k)}
                      mode="popover"
                      compact={true}
                      align="left"
                    />
                    <input
                      type="text"
                      value={pair.label || ''}
                      onChange={(e) => handlePairChange(idx, 'label', e.target.value)}
                      placeholder={`Label Gambar ${idx + 1}`}
                      className="duo-input !h-10 !py-1.5 !px-3 !text-xs flex-1 min-w-0"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Pilihan Gambar (Tandai yang Benar)
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Centang jawaban benar
                  </span>
                </div>
                {quickItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`flex items-center gap-2 p-2 rounded-xl border ${
                      item.is_correct
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <IconPicker
                      value={item.emoji || 'star'}
                      onChange={(k) => handleQuickItemChange(idx, 'emoji', k)}
                      mode="popover"
                      compact={true}
                      align="left"
                    />
                    <input
                      type="text"
                      value={item.label || ''}
                      onChange={(e) => handleQuickItemChange(idx, 'label', e.target.value)}
                      placeholder={`Label Pilihan ${idx + 1}`}
                      className="duo-input !h-10 !py-1.5 !px-3 !text-xs flex-1 min-w-0 !bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuickItemChange(idx, 'is_correct', !item.is_correct)}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer ${
                        item.is_correct
                          ? 'bg-emerald-600 border-emerald-700 text-white'
                          : 'bg-white border-slate-300 text-slate-400 hover:border-emerald-500'
                      }`}
                      title={item.is_correct ? 'Termasuk gambar tepat' : 'Jadikan gambar tepat'}
                    >
                      <MaterialIcon
                        name={item.is_correct ? 'check_circle' : 'radio_button_unchecked'}
                        className="text-xl"
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bagian B: Pengaturan Isian Nama & Kelas Khusus PJJ (Poin 6) */}
      <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPjjEnabled}
            onChange={(e) => setIsPjjEnabled(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-sky-600 rounded cursor-pointer shrink-0"
          />
          <div>
            <span className="font-duo-display text-sm font-bold text-slate-800 block">
              Aktifkan Form Nama Anak & Kelas di Akhir Video (Mode PJJ)
            </span>
            <span className="text-xs font-medium text-slate-600 leading-relaxed block mt-0.5">
              Catatan: Nyalakan fitur ini <b>khusus untuk Pembelajaran Jarak Jauh (PJJ)</b> dari rumah. Untuk video pembelajaran klasikal di kelas, biarkan nonaktif agar tidak semua subtema meminta isian nama.
            </span>
          </div>
        </label>

        {isPjjEnabled && (
          <div className="pt-2 border-t border-sky-200/70">
            <Textarea
              label="Notes Tambahan di Layar Orang Tua / Anak (Opsional)"
              rows={2}
              value={pjjNotes}
              onChange={(e) => setPjjNotes(e.target.value)}
              placeholder="Contoh: Khusus PJJ di rumah: mohon tuliskan nama lengkap dan kelas ananda untuk catatan Ibu Guru."
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        {gameEnabled && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onPreview}
            icon={<MaterialIcon name="play_circle" className="text-base" />}
          >
            Uji Permainan
          </Button>
        )}

        <Button
          type="submit"
          size="md"
          variant="secondary"
          loading={isSaving}
          className="ml-auto"
          icon={<MaterialIcon name="save" className="text-lg" />}
        >
          Simpan Pengaturan Penutup
        </Button>
      </div>
    </form>
  );
};
