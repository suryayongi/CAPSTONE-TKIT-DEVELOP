import React from 'react';
import { Card } from './Card';
import { MaterialIcon } from '../utils/icons';

export const StatCard = ({
  title,
  value,
  unit = '',
  icon = 'folder_special',
  variant = 'sky',
  className = ''
}) => {
  const iconColors = {
    sky: 'text-[#0284C7] bg-[#F0F9FF] border-[#BAE6FD]',
    purple: 'text-[#7E22CE] bg-[#FAF5FF] border-[#E9D5FF]',
    emerald: 'text-[#2D6A4F] bg-[#E8F3EE] border-[#B7DFCE]',
    yellow: 'text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]',
    orange: 'text-[#C2410C] bg-[#FFEDD5] border-[#FED7AA]',
    ruby: 'text-[#BE123C] bg-[#FFE4E6] border-[#FECDD3]'
  };

  const selectedColor = iconColors[variant] || iconColors.emerald;

  return (
    <Card className={`p-5 flex items-center gap-4 bg-white rounded-[20px] border border-[#E7E5E4] shadow-xs hover:border-[#D6D3D1] transition-colors ${className}`}>
      <div
        className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${selectedColor}`}
      >
        <MaterialIcon name={icon} className="text-2xl" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#78716C] truncate">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-[#1C1917] tabular-nums font-mono tracking-tight truncate mt-0.5">
          {value}{unit ? ` ${unit}` : ''}
        </p>
      </div>
    </Card>
  );
};
