import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, MaterialIcon } from '../utils/icons';
import { Button } from './Button';
import { authService } from '../services/authService';

export const PublicHeader = () => {
  const user = authService.getCurrentUser();
  const isAuth = Boolean(user);
  const adminTarget = isAuth ? authService.getHomeRouteForRole(user.role) : '/admin/login';

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E7E5E4] px-3.5 sm:px-8 py-3 sm:py-3.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Brand Logo & Editorial Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
          <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
            <Icon name="mascot" className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-xs" />
          </div>
          <div className="min-w-0">
            <span className="font-duo-display text-lg sm:text-2xl font-bold block leading-none tracking-tight group-hover:opacity-90 transition-opacity truncate">
              <span className="text-[#B45309]">Dunia</span>{' '}
              <span className="text-[#2D6A4F]">Madani</span>
            </span>
            <span className="text-[11px] font-semibold text-[#78716C] block mt-1 tracking-normal truncate">
              Media Belajar Interaktif TKIT Al Madani
            </span>
          </div>
        </Link>

        {/* Kontrol Aksi Header */}
        <div className="flex items-center shrink-0">
          <Link to={adminTarget}>
            <Button
              size="sm"
              variant="outline"
              icon={<MaterialIcon name="school" className="text-base sm:text-lg text-[#2D6A4F]" />}
              className="!px-2.5 sm:!px-3.5"
            >
              <span>{isAuth ? (user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Studio Guru') : 'Ruang Guru'}</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
