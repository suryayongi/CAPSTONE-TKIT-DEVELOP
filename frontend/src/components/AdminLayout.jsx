import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export const AdminLayout = ({ children, maxWidth = 'max-w-6xl' }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('madani_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
      // Auto-collapse awal jika layar laptop / ter-zoom >100% (< 1366px) agar studio lapang
      return typeof window !== 'undefined' && window.innerWidth < 1366;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('madani_sidebar_collapsed', String(isCollapsed));
    } catch {}
  }, [isCollapsed]);

  const toggleDesktopCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col lg:flex-row">
      {/* Taskbar Kiri (Sidebar Navigasi Admin) */}
      <AdminSidebar
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleDesktopCollapse}
      />

      {/* Main Content Area */}
      <div
        className={`${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        } flex-1 flex flex-col min-h-screen min-w-0 transition-[padding] duration-200`}
      >
        <AdminHeader
          onToggleMobileSidebar={() => setMobileOpen((prev) => !prev)}
          isSidebarCollapsed={isCollapsed}
          onToggleDesktopSidebar={toggleDesktopCollapse}
        />
        <main className={`flex-1 p-3 sm:p-5 lg:p-6 xl:p-8 ${maxWidth} w-full mx-auto min-w-0`}>
          {children}
        </main>
      </div>
    </div>
  );
};
