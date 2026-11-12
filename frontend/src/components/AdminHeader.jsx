import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, MaterialIcon } from '../utils/icons';
import { Button } from './Button';
import { authService } from '../services/authService';

export const AdminHeader = ({
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  onToggleDesktopSidebar
}) => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser() || {
    nama_lengkap: 'Guru TKIT Al Madani',
    username: 'guru'
  };

  const handleLogout = () => {
    if (window.confirm('Keluar dari Ruang Guru?')) {
      authService.logout();
      navigate('/admin/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#E7E5E4] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-xs">
      {/* Kiri: Tombol Buka/Minimalkan Taskbar & Identitas */}
      <div className="flex items-center gap-3">
        {/* Tombol Hamburger Mobile */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden w-10 h-10 rounded-xl border-2 border-[#E5E5E5] flex items-center justify-center text-[#777777] hover:text-[#4B4B4B] hover:bg-[#F7F7F7] transition cursor-pointer"
          title="Buka Menu"
        >
          <MaterialIcon name="menu" className="text-2xl" />
        </button>

        {/* Tombol Minimalkan / Munculkan Taskbar Kiri di Desktop */}
        {onToggleDesktopSidebar && (
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex w-10 h-10 rounded-xl border-2 border-[#E5E5E5] items-center justify-center text-[#777777] hover:text-[#4B4B4B] hover:bg-[#F7F7F7] transition cursor-pointer"
            title={isSidebarCollapsed ? 'Munculkan Taskbar Kiri' : 'Minimalkan Taskbar Kiri'}
          >
            <MaterialIcon
              name={isSidebarCollapsed ? 'menu' : 'menu_open'}
              className="text-xl"
            />
          </button>
        )}

        <span className="hidden sm:inline-block font-duo-display text-sm font-bold text-[#777777]">
          TKIT Al Madani • Media Pembelajaran Video Interaktif
        </span>
      </div>

      {/* Kanan: Satu-satunya Profil Guru & Tombol Keluar (Tanpa Duplikat) */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] border-2 border-[#38BDF8] flex items-center justify-center shrink-0">
            <Icon name="teacher" className="w-7 h-7" />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs font-extrabold text-[#4B4B4B] leading-tight">
              {user.nama_lengkap}
            </span>
            <span className="text-[11px] font-bold text-[#10B981]">
              Guru Pengelola Materi
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleLogout}
          icon={<MaterialIcon name="logout" className="text-base text-[#EF4444]" />}
        >
          Keluar
        </Button>
      </div>
    </header>
  );
};
