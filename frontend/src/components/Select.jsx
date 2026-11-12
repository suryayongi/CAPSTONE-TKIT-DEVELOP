import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MaterialIcon } from '../utils/icons';

/**
 * Custom Styled Tactile Select Dropdown (Menggantikan HTML <select> bawaan browser)
 * Mendukung prop `options={[{ value, label }]}` maupun `<option>` children secara transparan.
 */
export const Select = ({
  label,
  id,
  name,
  required = false,
  error,
  helperText,
  options = [],
  children,
  value,
  defaultValue,
  onChange,
  size = 'md',
  icon,
  placeholder = 'Pilih salah satu...',
  disabled = false,
  className = '',
  containerClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const wrapperRef = useRef(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  // Ekstrak daftar opsi baik dari prop `options` maupun dari `<option>` children
  const parsedOptions = useMemo(() => {
    if ( Array.isArray(options) && options.length > 0) {
      return options.map((opt) => ({
        value: String(opt.value),
        label: opt.label,
        disabled: Boolean(opt.disabled)
      }));
    }

    const childOptions = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === 'option') {
        const optVal = child.props.value !== undefined ? String(child.props.value) : String(child.props.children || '');
        const optLabel = child.props.children;
        childOptions.push({
          value: optVal,
          label: optLabel,
          disabled: Boolean(child.props.disabled)
        });
      }
    });
    return childOptions;
  }, [options, children]);

  // Temukan opsi yang sedang terpilih
  const selectedOption = useMemo(() => {
    const strVal = currentValue !== undefined && currentValue !== null ? String(currentValue) : '';
    return parsedOptions.find((o) => o.value === strVal) || parsedOptions[0] || null;
  }, [parsedOptions, currentValue]);

  // Tutup dropdown saat klik di luar atau tekan Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectOption = (opt) => {
    if (opt.disabled) return;
    if (!isControlled) {
      setInternalValue(opt.value);
    }
    if (onChange) {
      // Simulasikan objek event standar agar kompatibel dengan handler `(e) => setVal(e.target.value)`
      onChange({
        target: {
          value: opt.value,
          name: name || id,
          id
        }
      });
    }
    setIsOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div ref={wrapperRef} className={`relative w-full min-w-0 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className="block text-xs font-extrabold uppercase tracking-wider text-[#4B4B4B] mb-1.5 cursor-pointer select-none"
        >
          {label} {required && <span className="text-[#EF4444] font-extrabold">*</span>}
        </label>
      )}

      {/* Tombol Pemicu Dropdown Taktil */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 text-left font-duo-sans font-extrabold transition select-none cursor-pointer ${
          isSmall
            ? 'h-10 px-3.5 rounded-xl text-xs bg-white border-2 border-[#E5E5E5] shadow-[0_3px_0_0_#E5E5E5] hover:border-[#AFAFAF]'
            : 'duo-input !flex !items-center !justify-between bg-[#F7F7F7] hover:bg-white'
        } ${
          isOpen
            ? '!bg-white !border-[#FFC800] !shadow-[0_0_0_3px_rgba(255,200,0,0.25)]'
            : ''
        } ${error ? 'duo-input-error' : ''} ${
          disabled ? 'opacity-55 cursor-not-allowed' : ''
        } ${className}`}
      >
        <span className="flex items-center gap-2 truncate text-[#4B4B4B] min-w-0">
          {icon && (
            <MaterialIcon
              name={icon}
              className={`${isSmall ? 'text-base' : 'text-lg'} text-[#8B5CF6] shrink-0`}
            />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <MaterialIcon
          name="expand_more"
          className={`text-lg text-[#777777] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#4B4B4B]' : ''
          }`}
        />
      </button>

      {/* Menu Popover Opsi Pilihan */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 left-0 min-w-[220px] mt-2 bg-white border-2 border-[#E5E5E5] rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_4px_0_0_#E5E5E5] p-1.5 z-50 max-h-64 overflow-y-auto animate-pop-in"
        >
          {parsedOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs font-bold text-[#777777] text-center">
              Tidak ada pilihan tersedia
            </div>
          ) : (
            parsedOptions.map((opt) => {
              const isSelected = selectedOption && selectedOption.value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFF5D6] text-[#B45309] border-2 border-[#FFC800]'
                      : 'text-[#4B4B4B] border-2 border-transparent hover:bg-[#F7F7F7]'
                  } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <MaterialIcon
                      name="check_circle"
                      className="text-base text-[#D99B00] shrink-0"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {error && <p className="text-xs font-bold text-[#EF4444] mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-xs font-bold text-[#777777] mt-1">{helperText}</p>
      )}
    </div>
  );
};
