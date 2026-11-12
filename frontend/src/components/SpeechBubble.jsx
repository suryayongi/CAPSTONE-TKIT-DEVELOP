import React from 'react';
import { Icon } from '../utils/icons';

export const SpeechBubble = ({
  children,
  className = '',
  showStar = true
}) => {
  return (
    <div
      className={`duo-speech-bubble text-xs sm:text-sm font-black text-[#4B4B4B] flex items-center gap-2 animate-bounce-subtle z-20 shadow-md ${className}`}
    >
      <span>{children}</span>
      {showStar && <Icon name="star" className="w-4 h-4 shrink-0" />}
    </div>
  );
};
