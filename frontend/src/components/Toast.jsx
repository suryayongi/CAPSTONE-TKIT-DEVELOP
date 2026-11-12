import React, { createContext, useContext, useState, useCallback } from 'react';
import { MaterialIcon } from '../utils/icons';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          const bgClass = isSuccess
            ? 'bg-[#10B981] border-[#059669] text-white'
            : isError
            ? 'bg-[#EF4444] border-[#B91C1C] text-white'
            : isWarning
            ? 'bg-[#FFC800] border-[#D99B00] text-[#4B4B4B]'
            : 'bg-white border-[#E5E5E5] text-[#4B4B4B]';

          const iconName = isSuccess
            ? 'check_circle'
            : isError
            ? 'error'
            : isWarning
            ? 'warning'
            : 'info';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-2xl border-2 shadow-2xl flex items-center justify-between gap-3 animate-pop-in ${bgClass}`}
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
            >
              <div className="flex items-center gap-2.5">
                <MaterialIcon name={iconName} className="text-2xl shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold leading-tight">
                  {t.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="opacity-70 hover:opacity-100 transition p-1"
                title="Tutup"
              >
                <MaterialIcon name="close" className="text-base" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: (msg) => console.log('[Toast fallback]', msg)
    };
  }
  return ctx;
};
