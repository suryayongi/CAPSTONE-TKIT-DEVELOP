import React from 'react';
import { DUO_VECTOR_CATALOG, DUO_VECTOR_SVGS, ICON_CATEGORIES } from './icons/index.js';

export { DUO_VECTOR_CATALOG, DUO_VECTOR_SVGS, ICON_CATEGORIES };

/**
 * Komponen Icon Vektor Al Madani / Duolingo-style
 * Merender SVG 64x64 dengan skala 100% responsif, animasi waddle ceria, dan fallback aman ke ikon 'star'
 */
export const Icon = ({ name = 'star', className = 'w-12 h-12', animated = true }) => {
  const cleanKey = String(name || 'star').trim().toLowerCase();
  const rawSvg = DUO_VECTOR_SVGS[cleanKey] || DUO_VECTOR_SVGS.star;
  const svgWithClass = rawSvg.replace(
    '<svg ',
    '<svg width="100%" height="100%" class="w-full h-full block" '
  );

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${animated ? 'animate-theme-icon' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: svgWithClass }}
    />
  );
};

/**
 * Komponen MaterialIcon untuk ikon antarmuka Google Material Symbols Rounded
 */
export const MaterialIcon = ({ name, className = 'text-xl' }) => {
  return (
    <span className={`material-symbols-rounded select-none leading-none inline-flex items-center justify-center ${className}`} aria-hidden="true">
      {name}
    </span>
  );
};
