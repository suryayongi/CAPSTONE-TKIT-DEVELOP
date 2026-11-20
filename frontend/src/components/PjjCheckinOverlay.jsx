import React, { useState, useEffect, useRef } from 'react';
import { Icon, MaterialIcon } from '../utils/icons';
import { Button } from './Button';
import { PREDICATE_META } from '../utils/closingGame';

/**
 * Formulir Identitas Anak (Nama & Kelas) Khusus Mode PJJ di Akhir Video (Poin 6)
 * - Hanya muncul jika guru mengaktifkan Mode PJJ pada subtema/video ini
 * - Mendukung mode Ketik Manual ('TEXT', bawaan) atau Pilihan Tombol ('SELECT') sesuai konfigurasi PJJ guru
 * - Penilaian murni simbol & predikat (Good / Excellent), tanpa skor numerik
 */
export const PjjCheckinOverlay = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <PjjCheckinDialog {...props} />;
};

const PjjCheckinDialog = ({
  videoTitle = 'Video Pembelajaran',
  pjjNote = '',
  classInputMode = 'TEXT',
  classOptions = ['TK A', 'TK B'],
  predicate = 'EXCELLENT',
  isSubmitting = false,
  onSubmit,
  onSkip
}) => {
  const safeClasses =
    Array.isArray(classOptions) && classOptions.length > 0 ? classOptions : ['TK A', 'TK B'];
  const isSelectMode = classInputMode === 'SELECT' && safeClasses.length > 0;

  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState(
    isSelectMode ? safeClasses[0] || 'TK A' : ''
  );
  const [parentNote, setParentNote] = useState('');
  const [touchedName, setTouchedName] = useState(false);
  const [touchedClass, setTouchedClass] = useState(false);
  const [submittedAttempt, setSubmittedAttempt] = useState(false);
  const [formError, setFormError] = useState('');

  const nameInputRef = useRef(null);
  const classInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const predInfo = PREDICATE_META[predicate === 'EXCELLENT' ? 'EXCELLENT' : 'GOOD'];
  const nameTrimmed = studentName.trim();
  const classTrimmed = selectedClass.trim();
  const isNameInvalid = (touchedName || submittedAttempt) && nameTrimmed.length < 2;
  const isClassInvalid =
    !isSelectMode && (touchedClass || submittedAttempt) && classTrimmed.length < 1;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setSubmittedAttempt(true);

    if (nameTrimmed.length < 2) {
      setFormError('Mohon tuliskan nama lengkap ananda (minimal 2 huruf).');
      nameInputRef.current?.focus();
      return;
    }

    if (!classTrimmed) {
      setFormError(
        isSelectMode
          ? 'Mohon pilih kelas ananda terlebih dahulu.'
          : 'Mohon tuliskan kelas ananda terlebih dahulu.'
      );
      if (!isSelectMode) classInputRef.current?.focus();
      return;
    }

    setFormError('');
    onSubmit({
      student_name: nameTrimmed,
      class_name: classTrimmed,
      notes: parentNote.trim(),
      predicate: predInfo.code,
      badge_symbol: predInfo.symbol
    });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pjj-dialog-title"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[92dvh] overflow-y-auto p-5 sm:p-8 animate-pop-in space-y-5 my-auto">
        {/* Header Tenang */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-200">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0">
            <MaterialIcon name="assignment_ind" className="text-2xl text-sky-600" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-sky-700 block">
              Catatan Belajar PJJ (Pembelajaran Jarak Jauh)
            </span>
            <h2
              id="pjj-dialog-title"
              className="font-duo-display text-lg sm:text-2xl font-bold text-slate-800 leading-tight mt-0.5"
            >
              Catat Nama & Kelas Ananda
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1 truncate">
              Materi: {videoTitle}
            </p>
          </div>
        </div>

        {/* Notes Penjelas Khusus PJJ */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-start gap-3">
          <MaterialIcon name="info" className="text-xl text-sky-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
            {pjjNote ||
              'Catatan Khusus PJJ: Isian nama dan kelas ini ditujukan bagi siswa yang belajar dari rumah agar Ibu Guru dapat mencatat keaktifan ananda. Tidak semua materi meminta pengisian nama.'}
          </p>
        </div>

        {/* Preview Simbol Pencapaian (Bebas Angka) */}
        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${predInfo.badgeClass}`}>
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${predInfo.iconBgClass}`}>
            <Icon name={predInfo.symbol} className="w-8 h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {Array.from({ length: predInfo.starCount }).map((_, i) => (
                <MaterialIcon key={i} name="star" className="text-base text-amber-500" />
              ))}
              <span className="font-duo-display text-sm font-bold ml-0.5">
                Predikat: {predInfo.label} • {predInfo.praise}
              </span>
            </div>
            <p className="text-xs font-medium opacity-85 mt-0.5">
              Catatan pencapaian simbol tersimpan otomatis untuk Ibu Guru.
            </p>
          </div>
        </div>

        {/* Error Box */}
        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2"
          >
            <MaterialIcon name="error_outline" className="text-base shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Semantic Accessible Form */}
        <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
          {/* Input Nama Anak */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pjj-student-name" className="text-sm font-bold text-slate-800">
              Nama Lengkap Anak <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="pjj-student-name"
              name="student_name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              enterKeyHint="next"
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value);
                if (formError) setFormError('');
              }}
              onBlur={() => setTouchedName(true)}
              aria-invalid={isNameInvalid ? 'true' : 'false'}
              aria-describedby="pjj-name-help"
              placeholder="Contoh: Aisyah Putri"
              className={`pjj-field-control w-full min-h-[48px] px-4 py-3 font-semibold text-slate-800 bg-slate-50 border-2 rounded-xl transition-colors focus:outline-none focus:bg-white ${
                isNameInvalid
                  ? 'border-red-500 focus:border-red-600'
                  : 'border-slate-200 focus:border-sky-500'
              }`}
            />
            <span
              id="pjj-name-help"
              className={`text-xs font-medium ${isNameInvalid ? 'text-red-600' : 'text-slate-500'}`}
            >
              {isNameInvalid
                ? 'Tuliskan nama lengkap anak minimal 2 huruf.'
                : 'Tuliskan nama panggilan atau nama lengkap siswa.'}
            </span>
          </div>

          {/* Input Kelas (Ketik Manual Bawaan atau Pilihan Jika Diaktifkan Guru) */}
          {isSelectMode ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-bold text-slate-800 mb-1">
                Pilih Kelas <span className="text-red-600" aria-hidden="true">*</span>
              </legend>
              <div className={`grid gap-2.5 ${safeClasses.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {safeClasses.map((clsName) => {
                  const isSelected = selectedClass === clsName;
                  const radioId = `pjj-class-${clsName.replace(/\s+/g, '-').toLowerCase()}`;
                  return (
                    <label
                      key={clsName}
                      htmlFor={radioId}
                      className={`min-h-[52px] px-3 py-3 rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer font-duo-display text-sm sm:text-base font-bold transition-colors select-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <input
                        id={radioId}
                        type="radio"
                        name="class_name"
                        value={clsName}
                        checked={isSelected}
                        onChange={() => setSelectedClass(clsName)}
                        className="sr-only"
                      />
                      <MaterialIcon
                        name={isSelected ? 'check_circle' : 'radio_button_unchecked'}
                        className={`text-xl shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}
                      />
                      <span className="truncate">{clsName}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pjj-class-name" className="text-sm font-bold text-slate-800">
                Kelas Ananda <span className="text-red-600" aria-hidden="true">*</span>
              </label>
              <input
                ref={classInputRef}
                id="pjj-class-name"
                name="class_name"
                type="text"
                required
                minLength={1}
                maxLength={40}
                enterKeyHint="next"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  if (formError) setFormError('');
                }}
                onBlur={() => setTouchedClass(true)}
                aria-invalid={isClassInvalid ? 'true' : 'false'}
                aria-describedby="pjj-class-help"
                placeholder="Contoh: TK A, TK B, atau Kelompok Bermain"
                className={`pjj-field-control w-full min-h-[48px] px-4 py-3 font-semibold text-slate-800 bg-slate-50 border-2 rounded-xl transition-colors focus:outline-none focus:bg-white ${
                  isClassInvalid
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-slate-200 focus:border-sky-500'
                }`}
              />
              <span
                id="pjj-class-help"
                className={`text-xs font-medium ${isClassInvalid ? 'text-red-600' : 'text-slate-500'}`}
              >
                {isClassInvalid
                  ? 'Tuliskan kelas ananda terlebih dahulu.'
                  : 'Ketikkan nama kelas siswa secara langsung.'}
              </span>
            </div>
          )}

          {/* Catatan Pendamping Opsional */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pjj-parent-note" className="text-xs font-bold text-slate-600">
              Catatan Pendamping di Rumah (Opsional)
            </label>
            <input
              id="pjj-parent-note"
              name="notes"
              type="text"
              maxLength={180}
              enterKeyHint="done"
              value={parentNote}
              onChange={(e) => setParentNote(e.target.value)}
              placeholder="Contoh: Ananda semangat menirukan gerakan Pak Polisi"
              className="pjj-field-control w-full min-h-[48px] px-4 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          {/* Action Footer (HP Friendly stacking) */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-4 border-t border-slate-200">
            {onSkip && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onSkip}
                className="w-full sm:w-auto"
              >
                Lewati
              </Button>
            )}
            <Button
              type="submit"
              size="lg"
              variant="secondary"
              loading={isSubmitting}
              className="w-full sm:w-auto sm:ml-auto"
              icon={<MaterialIcon name="save" className="text-xl shrink-0" />}
            >
              Simpan & Lihat Apresiasi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
