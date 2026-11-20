/**
 * Helper Penyusun Permainan Penutup Akhir Video & Simbol Penilaian PAUD (Non-Numerik)
 */

export const PREDICATE_META = {
  EXCELLENT: {
    code: 'EXCELLENT',
    label: 'Bintang Emas (Excellent)',
    shortLabel: 'Excellent',
    symbolLabel: 'Bintang Emas',
    praise: 'Hebat Sekali',
    description: 'Ananda sangat fokus menyimak cerita, menjawab kuis, dan menuntaskan permainan penutup dengan ceria.',
    symbol: 'trophy',
    starCount: 3,
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    iconBgClass: 'bg-amber-100 border-amber-200'
  },
  GOOD: {
    code: 'GOOD',
    label: 'Jempol Ceria (Good)',
    shortLabel: 'Good',
    symbolLabel: 'Jempol Ceria',
    praise: 'Bagus Sekali',
    description: 'Ananda aktif menyimak materi sampai selesai dan berani mencoba tantangan permainan.',
    symbol: 'thumbsup',
    starCount: 2,
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    iconBgClass: 'bg-emerald-100 border-emerald-200'
  }
};

export const resolveClosingGameConfig = (subtheme, theme) => {
  const raw = subtheme?.closing_game;
  if (raw && raw.enabled === false) {
    return null;
  }

  if (raw && raw.mode === 'QUICK_PICK' && Array.isArray(raw.items) && raw.items.length >= 2) {
    return {
      mode: 'QUICK_PICK',
      title: raw.title || 'Permainan Penutup: Pilih Gambar Tepat',
      instruction: raw.instruction || 'Ketuk semua gambar yang sesuai dengan cerita video tadi.',
      items: raw.items
    };
  }

  if (raw && (!raw.mode || raw.mode === 'PAIR_MATCH') && Array.isArray(raw.pairs) && raw.pairs.length >= 2) {
    return {
      mode: 'PAIR_MATCH',
      title: raw.title || 'Permainan Penutup: Cocokkan Gambar Kembar',
      instruction: raw.instruction || 'Ketuk dua kartu yang bergambar sama hingga seluruh bintang bersinar.',
      pairs: raw.pairs
    };
  }

  // Fallback otomatis dari ikon video / tema bila guru belum mengisi game khusus
  const autoPairs = [];
  const seenEmojis = new Set();

  const pushPair = (emoji, label) => {
    if (!emoji || seenEmojis.has(emoji) || autoPairs.length >= 3) return;
    seenEmojis.add(emoji);
    autoPairs.push({
      id: `auto-pair-${autoPairs.length + 1}`,
      emoji,
      label
    });
  };

  if (theme?.ikon_emoji) {
    pushPair(theme.ikon_emoji, theme.judul_tema || 'Tema Utama');
  }

  const cues = Array.isArray(subtheme?.cue_points) ? subtheme.cue_points : [];
  for (const cp of cues) {
    const opts = cp?.payload_interaksi?.options || [];
    for (const opt of opts) {
      if (opt.is_correct && opt.emoji) {
        pushPair(opt.emoji, opt.label || 'Jawaban Tepat');
      }
    }
    if (cp?.ikon_stimulus && cp.ikon_stimulus !== 'question') {
      pushPair(cp.ikon_stimulus, 'Kuis Seru');
    }
  }

  const defaults = [
    { emoji: 'star', label: 'Bintang Hebat' },
    { emoji: 'trophy', label: 'Piala Ceria' },
    { emoji: 'mascot', label: 'Sahabat Madani' }
  ];
  for (const d of defaults) {
    if (autoPairs.length >= 3) break;
    pushPair(d.emoji, d.label);
  }

  return {
    mode: 'PAIR_MATCH',
    title: 'Permainan Penutup: Cocokkan Gambar Kembar',
    instruction: 'Ketuk dua kartu untuk menemukan gambar kembar dan menyalakan bintang.',
    pairs: autoPairs
  };
};
