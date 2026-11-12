import React from 'react';
import { Link } from 'react-router-dom';
import { MaterialIcon } from '../utils/icons';

/**
 * Reusable Breadcrumb Component
 * Mengikuti aturan desain sistem: sentence case, font Nunito, pemisah chevron halus.
 *
 * @param {Array<{ label: string, to?: string }>} items
 * @param {string} className
 */
export const Breadcrumb = ({ items = [], className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#64748B] select-none ${className}`}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const hasLink = Boolean(item.to) && !isLast;

        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {hasLink ? (
              <Link
                to={item.to}
                className="hover:text-[#0EA5E9] transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`truncate max-w-[220px] ${
                  isLast ? 'text-[#1E293B] font-extrabold' : 'text-[#64748B]'
                }`}
                title={item.label}
              >
                {item.label}
              </span>
            )}

            {!isLast && (
              <MaterialIcon
                name="chevron_right"
                className="text-sm text-[#CBD5E1] shrink-0"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
