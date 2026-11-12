import React from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { IconPicker } from './IconPicker';
import { Alert } from './Alert';
import { MaterialIcon } from '../utils/icons';

/**
 * Reusable CuePointForm Component
 * Formulir pembuatan dan penyuntingan kuis interaktif anak (Multiple Choice, Flashcard, Action Prompt).
 * Dirancang anti-overflow (min-w-0) agar dapat dirender di kolom halaman maupun di dalam Slide-Over Drawer Fullscreen.
 */
export const CuePointForm = ({
  editingCpId,
  formTime,
  setFormTime,
  formType,
  setFormType,
  formEmoji,
  setFormEmoji,
  formQuestion,
  setFormQuestion,
  questionInputRef,
  mcOptions,
  setMcOptions,
  showThirdOption,
  setShowThirdOption,
  mcCorrectIdx,
  setMcCorrectIdx,
  mcFeedbackCorrect,
  setMcFeedbackCorrect,
  mcFeedbackWrong,
  setMcFeedbackWrong,
  showFeedbackAccordion,
  setShowFeedbackAccordion,
  fcAnswer,
  setFcAnswer,
  apTimer,
  setApTimer,
  apExtra,
  setApExtra,
  isSaving,
  alert = null,
  onCloseAlert = null,
  onSave,
  onReset,
  onPreview
}) => {
  const quizModels = [
    {
      id: 'MULTIPLE_CHOICE',
      label: 'Pilihan Gambar',
      desc: 'Pilih jawaban tepat',
      icon: 'check_circle'
    },
    {
      id: 'FLASHCARD_REVEAL',
      label: 'Tebak Kartu',
      desc: 'Kartu tanya jawab',
      icon: 'style'
    },
    {
      id: 'ACTION_PROMPT',
      label: 'Ayo Bergerak',
      desc: 'Tirukan gerakan',
      icon: 'directions_run'
    }
  ];

  const handleOptionChange = (idx, field, val) => {
    const copy = [...mcOptions];
    copy[idx] = { ...copy[idx], [field]: val };
    setMcOptions(copy);
  };

  return (
    <div className="min-w-0 w-full">
      {/* Header Form */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 ${
              editingCpId
                ? 'bg-[#EDE9FE] border-[#8B5CF6] text-[#6D28D9]'
                : 'bg-[#D1FAE5] border-[#10B981] text-[#059669]'
            }`}
          >
            <MaterialIcon name={editingCpId ? 'edit_note' : 'add_circle'} className="text-2xl" />
          </div>
          <div className="min-w-0">
            <h2 className="font-duo-display text-lg font-bold text-[#1E293B] truncate">
              {editingCpId ? 'Ubah Pertanyaan Kuis' : 'Tambah Pertanyaan Baru'}
            </h2>
            <span className="text-xs font-bold text-[#64748B] block truncate">
              {editingCpId
                ? `Menyunting soal pada menit ${formTime}`
                : 'Susun pertanyaan interaktif untuk siswa'}
            </span>
          </div>
        </div>

        {editingCpId && (
          <Button size="sm" variant="outline" onClick={onReset}>
            Batal Ubah
          </Button>
        )}
      </div>

      <form onSubmit={onSave} className="space-y-4 min-w-0">
        {/* Bagian 1: Waktu Muncul & Ikon Stimulus */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-[#7C3AED] flex items-center gap-1.5">
              <MaterialIcon name="schedule" className="text-base text-[#8B5CF6]" />
              <span>Waktu Muncul & Ikon Soal</span>
            </span>
            <span className="text-[11px] font-bold text-[#777777]">Menit : Detik</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center min-w-0">
            <div className="min-w-0">
              <Input
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                placeholder="00:15"
                className="font-mono text-center font-extrabold !text-base !h-[42px] !py-1.5 tabular-nums"
                required
              />
            </div>
            <div className="min-w-0">
              <IconPicker
                value={formEmoji}
                onChange={(k) => setFormEmoji(k)}
                mode="popover"
                size="md"
                fullWidth={true}
                align="right"
              />
            </div>
          </div>

          <p className="text-[11px] font-bold text-[#777777] flex items-start gap-1.5 leading-snug">
            <MaterialIcon name="info" className="text-sm text-[#8B5CF6] shrink-0 mt-0.5" />
            <span>
              Tekan tombol kuning <b>"+ Tandai Kuis"</b> di bar bawah video untuk mengambil waktu otomatis.
            </span>
          </p>
        </div>

        {/* Bagian 2: Model Kuis Interaktif */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-extrabold text-[#4B4B4B] block">
            Model Interaksi Kuis
          </label>
          <div className="grid grid-cols-3 gap-2 min-w-0">
            {quizModels.map((t) => {
              const isSelected = formType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormType(t.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all min-w-0 cursor-pointer ${
                    isSelected
                      ? 'bg-violet-50/90 border-violet-500 text-violet-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <MaterialIcon name={t.icon} className="text-xl shrink-0" />
                  <span className="text-xs font-extrabold leading-tight text-center truncate w-full">
                    {t.label}
                  </span>
                  <span className="text-[10px] font-bold text-[#777777] text-center truncate w-full hidden sm:block">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bagian 3: Kalimat Pertanyaan */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-[#4B4B4B]">
              Kalimat Pertanyaan untuk Anak
            </label>
            <span className="text-[11px] font-bold text-[#777777]">Dibacakan otomatis</span>
          </div>
          <Textarea
            ref={questionInputRef}
            required
            rows={2}
            value={formQuestion}
            onChange={(e) => setFormQuestion(e.target.value)}
            placeholder="Contoh: Ayo tebak teman-teman, apa warna mobil pemadam kebakaran?"
          />
        </div>

        {/* Bagian 4: Opsi Jawaban Berdasarkan Model Kuis */}
        {formType === 'MULTIPLE_CHOICE' && (
          <div className="space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="text-xs font-extrabold text-[#4B4B4B]">
                Pilihan Jawaban Bergambar
              </label>
              <span className="text-[11px] font-extrabold text-[#059669] flex items-center gap-1">
                <MaterialIcon name="check_circle" className="text-sm" />
                <span>Klik lingkaran centang untuk jawaban benar</span>
              </span>
            </div>

            {/* Pilihan 1 & 2 */}
            {[0, 1].map((idx) => {
              const isCorrect = mcCorrectIdx === idx;
              const defaultEmoji = idx === 0 ? 'siren' : 'pan';
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 p-2 rounded-2xl border-2 transition-colors min-w-0 ${
                    isCorrect
                      ? 'bg-[#F0FDF4] border-[#10B981]'
                      : 'bg-[#F7F7F7] border-[#E5E5E5]'
                  }`}
                >
                  <div className="shrink-0">
                    <IconPicker
                      value={mcOptions[idx]?.emoji || defaultEmoji}
                      onChange={(k) => handleOptionChange(idx, 'emoji', k)}
                      mode="popover"
                      compact={true}
                      align="left"
                    />
                  </div>

                  <input
                    type="text"
                    required
                    value={mcOptions[idx]?.label || ''}
                    onChange={(e) => handleOptionChange(idx, 'label', e.target.value)}
                    placeholder={`Pilihan ${idx + 1} (wajib diisi)`}
                    className="duo-input !h-10 !py-1.5 !px-3 !text-xs !bg-white flex-1 min-w-0 overflow-hidden text-ellipsis"
                  />

                  {/* Tombol Centang Lingkaran Taktil (Radio Badge Kompak) */}
                  <button
                    type="button"
                    onClick={() => setMcCorrectIdx(idx)}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      isCorrect
                        ? 'bg-[#10B981] border-[#059669] text-white shadow-[0_2px_0_#059669]'
                        : 'bg-white border-[#CBD5E1] text-[#94A3B8] hover:border-[#10B981] hover:text-[#10B981]'
                    }`}
                    title={isCorrect ? 'Jawaban Benar (Terpilih)' : 'Tandai sebagai Jawaban Benar'}
                  >
                    <MaterialIcon
                      name={isCorrect ? 'check_circle' : 'radio_button_unchecked'}
                      className="text-xl"
                    />
                  </button>
                </div>
              );
            })}

            {/* Pilihan 3 (Opsional) */}
            {showThirdOption ? (
              <div
                className={`flex items-center gap-2 p-2 rounded-2xl border-2 transition-colors min-w-0 ${
                  mcCorrectIdx === 2
                    ? 'bg-[#F0FDF4] border-[#10B981]'
                    : 'bg-[#F7F7F7] border-[#E5E5E5]'
                }`}
              >
                <div className="shrink-0">
                  <IconPicker
                    value={mcOptions[2]?.emoji || 'milk'}
                    onChange={(k) => handleOptionChange(2, 'emoji', k)}
                    mode="popover"
                    compact={true}
                    align="left"
                  />
                </div>

                <input
                  type="text"
                  value={mcOptions[2]?.label || ''}
                  onChange={(e) => handleOptionChange(2, 'label', e.target.value)}
                  placeholder="Pilihan 3 (opsional)"
                  className="duo-input !h-10 !py-1.5 !px-3 !text-xs !bg-white flex-1 min-w-0 overflow-hidden text-ellipsis"
                />

                <button
                  type="button"
                  onClick={() => setMcCorrectIdx(2)}
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    mcCorrectIdx === 2
                      ? 'bg-[#10B981] border-[#059669] text-white shadow-[0_2px_0_#059669]'
                      : 'bg-white border-[#CBD5E1] text-[#94A3B8] hover:border-[#10B981] hover:text-[#10B981]'
                  }`}
                  title={mcCorrectIdx === 2 ? 'Jawaban Benar (Terpilih)' : 'Tandai sebagai Jawaban Benar'}
                >
                  <MaterialIcon
                    name={mcCorrectIdx === 2 ? 'check_circle' : 'radio_button_unchecked'}
                    className="text-xl"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowThirdOption(false);
                    if (mcCorrectIdx === 2) setMcCorrectIdx(0);
                  }}
                  className="w-8 h-10 rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-[#EF4444] shrink-0 cursor-pointer"
                  title="Hapus Pilihan ke-3"
                >
                  <MaterialIcon name="close" className="text-lg" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowThirdOption(true)}
                className="w-full py-2 border-2 border-dashed border-[#C4B5FD] rounded-xl text-xs font-extrabold text-[#7C3AED] hover:bg-[#EDE9FE] hover:border-[#8B5CF6] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MaterialIcon name="add" className="text-base" />
                <span>Tambah Pilihan ke-3 (Opsional)</span>
              </button>
            )}

            {/* Accordion Kalimat Pujian Guru */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowFeedbackAccordion((p) => !p)}
                className="text-xs font-extrabold text-[#64748B] hover:text-[#7C3AED] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MaterialIcon name={showFeedbackAccordion ? 'expand_less' : 'tune'} className="text-base" />
                <span>Kalimat Pujian & Semangat Guru (Terisi Otomatis)</span>
              </button>

              {showFeedbackAccordion && (
                <div className="mt-2 p-3.5 rounded-2xl bg-[#F7F7F7] border-2 border-[#E5E5E5] space-y-2.5">
                  <Input
                    label="Pujian Saat Jawaban Benar"
                    value={mcFeedbackCorrect}
                    onChange={(e) => setMcFeedbackCorrect(e.target.value)}
                    placeholder="MasyaAllah, tepat sekali jawaban teman-teman!"
                  />
                  <Input
                    label="Semangat Saat Jawaban Kurang Tepat"
                    value={mcFeedbackWrong}
                    onChange={(e) => setMcFeedbackWrong(e.target.value)}
                    placeholder="Hampir tepat! Yuk coba amati lagi gambarnya!"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payload Flashcard */}
        {formType === 'FLASHCARD_REVEAL' && (
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs font-extrabold text-[#4B4B4B] block">
              Jawaban di Balik Kartu
            </label>
            <Textarea
              required
              rows={2}
              value={fcAnswer}
              onChange={(e) => setFcAnswer(e.target.value)}
              placeholder="Contoh: Ini adalah mobil pemadam kebakaran berwarna merah yang bertugas memadamkan api."
            />
            <p className="text-[11px] font-bold text-[#777777]">
              Kalimat ini akan ditampilkan dan dibacakan saat kartu dibalik oleh anak.
            </p>
          </div>
        )}

        {/* Payload Action Prompt */}
        {formType === 'ACTION_PROMPT' && (
          <div className="space-y-2.5 min-w-0">
            <label className="text-xs font-extrabold text-[#4B4B4B] block">
              Pengaturan Gerakan Anak
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center min-w-0">
              <Input
                label="Durasi Gerakan (Detik)"
                type="number"
                min="3"
                max="30"
                required
                value={apTimer}
                onChange={(e) => setApTimer(e.target.value)}
              />
              <div className="text-xs font-bold text-[#777777] sm:pt-5 flex items-center gap-1.5">
                <MaterialIcon name="timer" className="text-base text-[#8B5CF6]" />
                <span>Hitung mundur otomatis</span>
              </div>
            </div>
            <Input
              label="Instruksi Tambahan (Opsional)"
              value={apExtra}
              onChange={(e) => setApExtra(e.target.value)}
              placeholder="Contoh: Ayo tirukan bunyi sirine sambil berdiri tegak!"
            />
          </div>
        )}

        {/* Tombol Aksi Bawah: Proporsional, Seimbang, & Hirarki Jelas */}
        <div className="pt-3 border-t-2 border-[#E5E5E5] space-y-2.5 min-w-0">
          {/* Alert Notifikasi Reusable (Muncul di Form & Fullscreen) */}
          {alert && (
            <Alert
              variant={alert.variant || 'warning'}
              message={alert.message}
              onClose={onCloseAlert}
            />
          )}

          {/* Baris 1: Tombol Utilitas (Pratinjau Soal & Reset) 50:50 Seimbang */}
          <div className="grid grid-cols-2 gap-2 min-w-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              fullWidth
              onClick={onPreview}
              icon={<MaterialIcon name="visibility" className="text-base text-[#8B5CF6]" />}
              title="Pratinjau tampilan soal seperti di ruang tonton siswa"
            >
              Pratinjau Soal
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              fullWidth
              onClick={onReset}
              icon={<MaterialIcon name="restart_alt" className="text-base text-[#64748B]" />}
              title="Kosongkan formulir atau batalkan penyuntingan"
            >
              {editingCpId ? 'Batal Ubah' : 'Reset Form'}
            </Button>
          </div>

          {/* Baris 2: Tombol Aksi Utama (Simpan Pertanyaan) Penuh & Menonjol */}
          <Button
            type="submit"
            size="md"
            variant="purple"
            fullWidth
            loading={isSaving}
            icon={<MaterialIcon name="check_circle" className="text-lg" />}
          >
            {editingCpId ? 'Simpan Perubahan' : 'Simpan Pertanyaan'}
          </Button>
        </div>
      </form>
    </div>
  );
};
