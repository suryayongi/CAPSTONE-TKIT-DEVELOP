import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './Button';
import { MaterialIcon } from '../utils/icons';

/**
 * Derive a contextual Indonesian back label from a route path
 */
const deriveBackLabelFromPath = (path, fallbackLabel) => {
  if (!path || typeof path !== 'string') return fallbackLabel;
  if (path.includes('/studio')) return 'Kembali ke Studio Kuis';
  if (path.startsWith('/admin/tema/')) return 'Kembali ke Kelola Video';
  if (path === '/admin/tema') return 'Kembali ke Daftar Tema';
  if (path.startsWith('/admin/dashboard') || path === '/admin') return 'Kembali ke Beranda Studio';
  if (path.startsWith('/admin/pengaturan')) return 'Kembali ke Pengaturan';
  if (path.startsWith('/tema/')) return 'Kembali ke Tema';
  if (path === '/') return 'Kembali ke Beranda';
  return fallbackLabel;
};

/**
 * Reusable Context-Aware BackButton Component
 * Mengarahkan pengguna kembali ke halaman asal yang sebenarnya (berdasarkan location.state.from)
 * atau kembali ke rute fallback jika diakses langsung.
 */
export const BackButton = ({
  fallbackTo = '/',
  fallbackLabel = 'Kembali',
  size = 'sm',
  variant = 'outline',
  className = ''
}) => {
  const location = useLocation();
  const fromPath = location.state?.from;
  const fromLabel = location.state?.fromLabel;

  const targetTo = fromPath || fallbackTo;
  const targetLabel = fromPath
    ? fromLabel || deriveBackLabelFromPath(fromPath, fallbackLabel)
    : fallbackLabel;

  return (
    <Link to={targetTo} className={`shrink-0 ${className}`.trim()}>
      <Button
        size={size}
        variant={variant}
        icon={<MaterialIcon name="arrow_back" className="text-base" />}
      >
        {targetLabel}
      </Button>
    </Link>
  );
};
