import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, MaterialIcon } from '../utils/icons';
import { Button } from './Button';
import { authService } from '../services/authService';

export const PublicHeader = () => {
  const isAuth = authService.isAuthenticated();

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#E7E5E4] px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Editorial Wordmark */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
            <Icon name="mascot" className="w-10 h-10 drop-shadow-xs" />
          </div>
          <div>
            <span className="font-duo-display text-2xl font-bold block leading-none tracking-tight group-hover:opacity-90 transition-opacity">
              <span className="text-[#B45309]">Dunia</span>{' '}
              <span className="text-[#2D6A4F]">Madani</span>
            </span>
            <span className="text-[11px] font-semibold text-[#78716C] block mt-1 tracking-normal">
              Media Belajar Interaktif TKIT Al Madani
            </span>
          </div>
        </Link>

        {/* Kontrol Aksi Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to={isAuth ? '/admin/dashboard' : '/admin/login'}>
            <Button
              size="sm"
              variant="outline"
              icon={<MaterialIcon name="school" className="text-lg text-[#2D6A4F]" />}
            >
              <span>{isAuth ? 'Studio Guru' : 'Ruang Guru'}</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
