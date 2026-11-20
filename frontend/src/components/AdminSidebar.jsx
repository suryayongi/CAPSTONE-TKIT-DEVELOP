import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Icon, MaterialIcon } from '../utils/icons';
import { authService } from '../services/authService';

export const AdminSidebar = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const currentUser = authService.getCurrentUser();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const navItems = [
    ...(isSuperAdmin
      ? [{ to: '/admin/akun-guru', label: 'Kelola Akun Guru', icon: 'manage_accounts' }]
      : []),
    { to: '/admin/dashboard', label: 'Beranda Studio', icon: 'space_dashboard' },
    { to: '/admin/tema', label: 'Bank Materi Bersama', icon: 'folder_special' },
    { to: '/admin/rekap-pjj', label: 'Rekap Belajar PJJ', icon: 'assignment_ind' },
    { to: '/admin/pengaturan', label: 'Pengaturan Tampilan', icon: 'tune' }
  ];

  const renderSidebarBody = (collapsedMode = false) => (
    <div
      className={`h-full flex flex-col justify-between ${
        collapsedMode ? 'p-3 items-center' : 'p-4 sm:p-5'
      }`}
    >
      <div className="w-full">
        {/* Brand Header Kuning Al Madani + Emerald (1 Baris Penuh) */}
        <div
          className={`flex items-center ${
            collapsedMode ? 'justify-center mb-6' : 'justify-between gap-2 px-1 mb-7'
          }`}
        >
          <Link
            to="/"
            className="flex items-center gap-3 group min-w-0"
            title="Dunia Madani — Ruang Studio Guru"
          >
            <div className="shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3">
              <Icon name="mascot" className="w-10 h-10" />
            </div>
            {!collapsedMode && (
              <div className="min-w-0">
                <span className="font-duo-display text-2xl font-bold block leading-none whitespace-nowrap">
                  <span className="text-[#B45309]">Dunia</span>{' '}
                  <span className="text-[#2D6A4F]">Madani</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500 block mt-1 whitespace-nowrap">
                  {isSuperAdmin ? 'Portal Super Admin' : 'Ruang Studio Guru'}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Pills (1 Baris Tanpa Bertingkat & Tanpa Layar Anak) */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              title={item.label}
              className={({ isActive }) =>
                `duo-nav-pill whitespace-nowrap ${
                  collapsedMode ? '!px-0 !py-3 w-12 h-12 justify-center mx-auto' : 'w-full'
                } ${isActive ? 'active' : ''}`
              }
            >
              <MaterialIcon name={item.icon} className="text-xl shrink-0" />
              {!collapsedMode && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Tombol Minimalkan / Munculkan Taskbar Kiri (Khusus Desktop) */}
      {onToggleCollapse && (
        <div className="hidden lg:block w-full pt-4 border-t-2 border-[#E5E5E5]">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsedMode ? 'Munculkan Taskbar Menu' : 'Minimalkan Taskbar Menu'}
            className={`duo-nav-pill w-full text-[#777777] hover:text-[#4B4B4B] ${
              collapsedMode ? '!px-0 justify-center' : 'justify-between'
            }`}
          >
            {!collapsedMode && (
              <span className="text-xs font-extrabold uppercase tracking-wider whitespace-nowrap">
                Minimalkan Menu
              </span>
            )}
            <MaterialIcon
              name={collapsedMode ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
              className="text-xl shrink-0"
            />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop (Lebar w-72 agar teks 1 baris, atau w-20 saat diminimalkan) */}
      <aside
        className={`hidden lg:block ${
          isCollapsed ? 'w-20' : 'w-72'
        } bg-[#F6F4EF] border-r border-[#E7E5E4] fixed inset-y-0 left-0 z-30 overflow-y-auto overflow-x-hidden transition-[width] duration-200`}
      >
        {renderSidebarBody(isCollapsed)}
      </aside>

      {/* Sidebar Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />
          <aside className="relative w-72 bg-white h-full shadow-2xl z-10 overflow-y-auto">
            {renderSidebarBody(false)}
          </aside>
        </div>
      )}
    </>
  );
};
