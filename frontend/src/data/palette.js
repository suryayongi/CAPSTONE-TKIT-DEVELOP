export const MADANI_SENTRA_COLOR_PALETTE = [
  {
    name: 'Madu Hangat (Al-Madani Amber Honey)',
    hex: '#D97706',
    lip: '#B45309',
    tint: '#FEF3C7',
    text: '#FFFFFF'
  },
  {
    name: 'Hijau Sage Hutan (Deep Forest Sage)',
    hex: '#2D6A4F',
    lip: '#1B4332',
    tint: '#E8F3EE',
    text: '#FFFFFF'
  },
  {
    name: 'Biru Slate Pesisir (Coastal Slate Cyan)',
    hex: '#0284C7',
    lip: '#0369A1',
    tint: '#E0F2FE',
    text: '#FFFFFF'
  },
  {
    name: 'Terakota Hangat (Warm Terracotta)',
    hex: '#C2410C',
    lip: '#9A3412',
    tint: '#FFEDD5',
    text: '#FFFFFF'
  },
  {
    name: 'Plum Kreatif (Muted Royal Plum)',
    hex: '#7E22CE',
    lip: '#6B21A8',
    tint: '#F3E8FF',
    text: '#FFFFFF'
  },
  {
    name: 'Bata Merah Teduh (Warm Crimson Brick)',
    hex: '#BE123C',
    lip: '#9F1239',
    tint: '#FFE4E6',
    text: '#FFFFFF'
  }
];

export const getThemePalette = (hex) => {
  if (!hex) return MADANI_SENTRA_COLOR_PALETTE[1];
  const found = MADANI_SENTRA_COLOR_PALETTE.find(
    (c) => c.hex.toLowerCase() === hex.toLowerCase()
  );
  if (found) return found;

  return {
    name: 'Warna Khusus',
    hex: hex,
    lip: '#1C1917',
    tint: '#F5F5F4',
    text: '#FFFFFF'
  };
};

export const getBorderColorForTheme = (hex) => {
  const p = getThemePalette(hex);
  return p.lip || '#E7E5E4';
};

export const getTintColorForTheme = (hex) => {
  const p = getThemePalette(hex);
  return p.tint || '#F5F5F4';
};

export const getTextColorForTheme = (hex) => {
  const p = getThemePalette(hex);
  return p.text || '#FFFFFF';
};
