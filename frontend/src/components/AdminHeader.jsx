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
    username: 'guru',
    role: 'GURU',
    jabatan_kelas: 'Guru Pengelola Materi'
  };
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    if (window.confirm('Keluar dari Ruang Studio?')) {
      authService.logout();
      navigate('/admin/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E7E5E4] min-h-16 py-2 flex items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 shadow-xs">
      {/* Kiri: Tombol Buka/Minimalkan Taskbar & Identitas */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Tombol Hamburger Mobile */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Buka menu navigasi"
          className="lg:hidden w-10 h-10 rounded-xl border-2 border-[#E5E5E5] flex items-center justify-center text-[#777777] hover:text-[#4B4B4B] hover:bg-[#F7F7F7] transition cursor-pointer shrink-0"
          title="Buka Menu"
        >
          <MaterialIcon name="menu" className="text-2xl" />
        </button>

        {/* Tombol Minimalkan / Munculkan Taskbar Kiri di Desktop */}
        {onToggleDesktopSidebar && (
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            aria-label={isSidebarCollapsed ? 'Munculkan menu kiri' : 'Minimalkan menu kiri'}
            className="hidden lg:flex w-10 h-10 rounded-xl border-2 border-[#E5E5E5] items-center justify-center text-[#777777] hover:text-[#4B4B4B] hover:bg-[#F7F7F7] transition cursor-pointer shrink-0"
            title={isSidebarCollapsed ? 'Munculkan Taskbar Kiri' : 'Minimalkan Taskbar Kiri'}
          >
            <MaterialIcon
              name={isSidebarCollapsed ? 'menu' : 'menu_open'}
              className="text-xl"
            />
          </button>
        )}

        <span className="hidden md:inline-block font-duo-display text-sm font-bold text-[#777777] truncate">
          TKIT Al Madani • Media Pembelajaran Video Interaktif
        </span>
      </div>

      {/* Kanan: Profil Akun Aktif (Tampil rapi di HP maupun Laptop) & Tombol Keluar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 flex items-center justify-center shrink-0 ${
              isSuperAdmin
                ? 'bg-slate-800 border-slate-600 text-amber-300'
                : 'bg-[#E0F2FE] border-[#38BDF8]'
            }`}
          >
            {isSuperAdmin ? (
              <MaterialIcon name="admin_panel_settings" className="text-lg sm:text-xl" />
            ) : (
              <Icon name="teacher" className="w-6 h-6 sm:w-7 sm:h-7" />
            )}
          </div>
          <div className="flex flex-col text-left sm:text-right min-w-0">
            <span className="text-xs font-extrabold text-[#4B4B4B] leading-tight max-w-[115px] sm:max-w-[200px] truncate">
              {user.nama_lengkap}
            </span>
            <span
              className={`text-[11px] font-bold truncate ${
                isSuperAdmin ? 'text-amber-700' : 'text-[#10B981]'
              }`}
            >
              {isSuperAdmin ? 'Super Admin' : user.jabatan_kelas || 'Guru'}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleLogout}
          aria-label="Keluar dari Ruang Studio"
          title="Keluar"
          icon={<MaterialIcon name="logout" className="text-base text-[#EF4444]" />}
          className="shrink-0 !px-2.5 sm:!px-3.5"
        >
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
};
