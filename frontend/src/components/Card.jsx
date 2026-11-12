import React from 'react';

export const Card = ({
  children,
  hoverable = false,
  className = '',
  style = {},
  onClick,
  ...props
}) => {
  const combinedClass = [
    'duo-card',
    hoverable ? 'duo-card-hover cursor-pointer' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={combinedClass} style={style} onClick={onClick} {...props}>
      {children}
    </div>
  );
};
