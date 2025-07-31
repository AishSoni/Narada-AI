import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  actions,
  className = ''
}) => {
  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          {title && <h2 className="text-lg font-medium text-gray-900">{title}</h2>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
};

export default Card;