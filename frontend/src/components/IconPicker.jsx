import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon, MaterialIcon, DUO_VECTOR_CATALOG, ICON_CATEGORIES } from '../utils/icons';

/**
 * Visual SVG Icon Picker Komprehensif & Responsif
 * Mendukung 360+ Ikon Vektor Al Madani / Duolingo-style
 * dengan Filter Kategori Horizontal, Pencarian Kata Kunci Dwibahasa (ID/EN),
 * serta Mode Popover (Form Kuis) & Grid Terpadu (Form Tema).
 *
 * @param {string} value - Key ikon yang dipilih (misal: 'police', 'apple', 'mosque')
 * @param {function} onChange - Callback ketika ikon dipilih (value: string) => void
 * @param {string} mode - 'popover' (default) | 'grid'
 * @param {string} label - Label pembantu (opsional)
 * @param {string} size - 'sm' (untuk baris opsi kuis) | 'md' (standar form)
 * @param {boolean} compact - Tampilkan tombol kompak 40x40px hanya ikon (ideal untuk baris pilihan kuis)
 * @param {boolean} fullWidth - Rentangkan tombol selebar kolom container
 * @param {string} align - 'left' | 'right' (posisi horizontal popover agar tidak menembus batas kartu)
 * @param {string} className - Kelas tambahan
 */
export const IconPicker = ({
  value = 'question',
  onChange,
  mode = 'popover',
  label,
  size = 'md',
  compact = false,
  fullWidth = false,
  align = 'left',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openUpward, setOpenUpward] = useState(false);
  const [resolvedAlign, setResolvedAlign] = useState(align);

  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Ambil data item terpilih
  const selectedItem = useMemo(() => {
    return (
      DUO_VECTOR_CATALOG.find((item) => item.key === value) || {
        key: value,
        label: value,
        category: 'Umum'
      }
    );
  }, [value]);

  // Filter ikon berdasarkan kategori aktif dan kata kunci pencarian (ID & EN)
  const filteredIcons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return DUO_VECTOR_CATALOG.filter((item) => {
      // 1. Filter Kategori
      if (activeCategory !== 'all' && item.categoryId !== activeCategory) {
        return false;
      }

      // 2. Filter Pencarian
      if (!query) return true;

      const matchLabel = item.label.toLowerCase().includes(query);
      const matchKey = item.key.toLowerCase().includes(query);
      const matchCategory = item.category.toLowerCase().includes(query);
      const matchKeywords = Array.isArray(item.keywords) && item.keywords.some((kw) => kw.toLowerCase().includes(query));

      return matchLabel || matchKey || matchCategory || matchKeywords;
    });
  }, [activeCategory, searchQuery]);

  // Hitung posisi vertikal & horizontal popover agar tidak pernah menembus batas layar / container
  const handleToggleOpen = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceRight = window.innerWidth - rect.left;

      setOpenUpward(spaceBelow < 320 && rect.top > 320);

      if (align === 'right' || spaceRight < 340) {
        setResolvedAlign('right');
      } else {
        setResolvedAlign('left');
      }

      // Focus input setelah dibuka
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);
    }
    setIsOpen((prev) => !prev);
  };

  // Tutup popover jika pengguna mengklik di luar area
  useEffect(() => {
    if (mode !== 'popover' || !isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, mode]);

  const handleSelect = (key) => {
    if (onChange) onChange(key);
    if (mode === 'popover') setIsOpen(false);
  };

  // ==========================================
  // MODE 1: GRID VIEW (Untuk Halaman Kelola Tema)
  // ==========================================
  if (mode === 'grid') {
    return (
      <div className={`space-y-3 ${className}`}>
        {label && (
          <div className="flex items-center justify-between">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#64748B]">
              {label}
            </label>
            <span className="text-[11px] font-bold text-[#94A3B8]">
              {filteredIcons.length} dari {DUO_VECTOR_CATALOG.length} Ikon
            </span>
          </div>
        )}

        {/* Bar Pencarian & Filter Kategori */}
        <div className="p-3 rounded-2xl bg-[#F8FAFC] border-2 border-[#E5E5E5] space-y-2.5">
          {/* Kolom Pencarian Cepat */}
          <div className="relative">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#94A3B8]"
            />
            <input
              type="text"
              placeholder="Cari ikon (cth: mobil, apel, masjid, polisi, cat)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-white border-2 border-[#E5E5E5] focus:outline-none focus:border-[#0EA5E9] font-bold text-[#1E293B] shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] p-0.5 rounded cursor-pointer"
                title="Hapus pencarian"
              >
                <MaterialIcon name="close" className="text-base" />
              </button>
            )}
          </div>

          {/* Tab Filter Kategori Horizontal */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {ICON_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    isActive
                      ? 'bg-[#0EA5E9] text-white shadow-xs'
                      : 'bg-white border border-[#E5E5E5] text-[#64748B] hover:text-[#1E293B] hover:border-[#CBD5E1]'
                  }`}
                >
                  <MaterialIcon name={cat.icon} className="text-sm" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Grid Ikon Komprehensif */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-1.5 rounded-xl bg-white border border-[#E5E5E5]">
            {filteredIcons.map((item) => {
              const isSelected = value === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelect(item.key)}
                  className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition cursor-pointer group ${
                    isSelected
                      ? 'bg-[#E0F2FE] border-[#0EA5E9] shadow-sm ring-2 ring-[#0EA5E9]/20'
                      : 'bg-white border-[#F1F5F9] hover:border-[#0EA5E9] hover:bg-[#F8FAFC]'
                  }`}
                  title={`${item.label} (${item.category})`}
                >
                  <div className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                    <Icon name={item.key} className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-extrabold text-[#475569] truncate w-full text-center">
                    {item.label}
                  </span>
                </button>
              );
            })}

            {filteredIcons.length === 0 && (
              <div className="col-span-full py-8 text-center text-[#94A3B8] font-bold text-xs">
                Tidak ada ikon yang sesuai dengan kata kunci &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MODE 2: POPOVER MODE (Untuk Formulir Kuis Studio)
  // ==========================================
  return (
    <div
      className={`relative ${fullWidth ? 'block w-full' : 'inline-block'} ${className}`}
      ref={popoverRef}
    >
      {label && (
        <label className="block text-xs font-extrabold uppercase tracking-wider text-[#64748B] mb-1">
          {label}
        </label>
      )}

      {/* Tombol Trigger Popover */}
      {compact ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggleOpen}
          className={`group relative w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition cursor-pointer ${
            isOpen
              ? 'bg-[#E0F2FE] border-[#0EA5E9] text-[#0284C7] shadow-[0_2px_0_#0284C7]'
              : 'bg-white border-[#CBD5E1] hover:border-[#0EA5E9] text-[#4B4B4B] shadow-[0_2px_0_#E2E8F0]'
          }`}
          title={`Pilih Gambar Ikon: ${selectedItem.label}`}
        >
          <Icon name={value} className="w-6 h-6" />
          <span
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border flex items-center justify-center transition ${
              isOpen
                ? 'bg-[#0EA5E9] border-white text-white'
                : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] group-hover:border-[#0EA5E9] group-hover:text-[#0EA5E9]'
            }`}
          >
            <MaterialIcon name={isOpen ? 'expand_less' : 'expand_more'} className="text-[11px]" />
          </span>
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggleOpen}
          className={`group flex items-center justify-between gap-2 rounded-xl border-2 transition cursor-pointer ${
            fullWidth ? 'w-full' : 'inline-flex'
          } ${
            size === 'sm'
              ? 'h-10 px-2.5 py-1 text-xs'
              : 'h-[42px] px-3 py-1.5 text-xs sm:text-sm'
          } ${
            isOpen
              ? 'bg-[#E0F2FE] border-[#0EA5E9] text-[#0284C7] shadow-[0_2px_0_#0284C7]'
              : 'bg-white border-[#E5E5E5] hover:border-[#0EA5E9] text-[#4B4B4B] shadow-[0_2px_0_#E5E5E5]'
          }`}
          title={`Pilih Ikon: ${selectedItem.label}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0 flex items-center justify-center w-7 h-7">
              <Icon name={value} className="w-6 h-6" />
            </div>
            <span className="font-extrabold truncate text-left">
              {selectedItem.label}
            </span>
          </div>
          <MaterialIcon
            name={isOpen ? 'expand_less' : 'expand_more'}
            className="text-base text-[#777777] group-hover:text-[#0EA5E9] transition shrink-0"
          />
        </button>
      )}

      {/* Popover Dropdown Panel Luas & Rapi (Terkunci di Dalam Batas Kartu Container) */}
      {isOpen && (
        <div
          className={`absolute z-50 w-[300px] sm:w-[340px] max-w-[calc(100vw-2.5rem)] bg-white border-2 border-[#CBD5E1] rounded-2xl shadow-2xl p-3 animate-pop-in ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${resolvedAlign === 'right' ? 'right-0 left-auto' : 'left-0 right-auto'}`}
        >
          {/* Header Panel */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b-2 border-[#E5E5E5]">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#64748B]">
              <MaterialIcon name="category" className="text-base text-[#0EA5E9]" />
              <span>Galeri 360+ Ikon Vektor</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#94A3B8] hover:text-[#4B4B4B] p-0.5 rounded-lg cursor-pointer"
              title="Tutup Galeri"
            >
              <MaterialIcon name="close" className="text-base" />
            </button>
          </div>

          {/* Kolom Pencarian Cepat */}
          <div className="relative mb-2">
            <MaterialIcon
              name="search"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-[#94A3B8]"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari ikon (cth: polisi, apel, mobil)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] focus:outline-none focus:border-[#0EA5E9] font-bold text-[#1E293B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] p-0.5 rounded cursor-pointer"
                title="Hapus pencarian"
              >
                <MaterialIcon name="close" className="text-sm" />
              </button>
            )}
          </div>

          {/* Tab Filter Kategori Horizontal */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 scrollbar-thin">
            {ICON_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-black whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    isActive
                      ? 'bg-[#0EA5E9] text-white shadow-xs'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Grid Ikon Scrollable */}
          <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto p-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            {filteredIcons.map((item) => {
              const isSelected = value === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelect(item.key)}
                  className={`p-1.5 rounded-xl flex flex-col items-center gap-1 transition cursor-pointer group ${
                    isSelected
                      ? 'bg-[#E0F2FE] border-2 border-[#0EA5E9] shadow-xs'
                      : 'bg-white border border-[#E5E5E5] hover:border-[#0EA5E9]'
                  }`}
                  title={`${item.label} (${item.category})`}
                >
                  <div className="w-8 h-8 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                    <Icon name={item.key} className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-extrabold text-[#475569] truncate w-full text-center">
                    {item.label}
                  </span>
                </button>
              );
            })}

            {filteredIcons.length === 0 && (
              <div className="col-span-full py-6 text-center text-[#94A3B8] font-bold text-xs">
                Ikon &quot;{searchQuery}&quot; tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
