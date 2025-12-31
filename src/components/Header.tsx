import React from 'react';

interface HeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  button?: React.ReactNode;
}

export default function Header({ title, description, icon, button }: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
      <div className="flex items-start gap-2 sm:gap-3">
        {icon && (
          <div className="p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 break-words">
              {description}
            </p>
          )}
        </div>
      </div>
      {button && (
        <div className="flex-shrink-0 w-full sm:w-auto">
          {button}
        </div>
      )}
    </div>
  );
} 