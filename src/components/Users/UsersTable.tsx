import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import UserAvatar from './UserAvatar';
import { useTranslations } from '@/contexts/TranslationContext';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLogin: string;
  avatar: string;
  phone: string;
}

interface UsersTableProps {
  users: User[];
}

const USERS_PER_PAGE = 10; // Aumentamos a 10 usuarios por página

export default function UsersTable({ users }: UsersTableProps) {
  const t = useTranslations('users');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  
  const paginatedUsers = users.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  if (users.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500 text-lg">{t('noUsersFound')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('user')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('email')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('phone')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('role')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('status')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{t('lastAccess')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={user.name} avatar={user.avatar} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{user.phone}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                    {user.status === 'active' ? t('active') : t('inactive')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{user.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6">
        <div className="flex justify-between w-full">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {t('showing')} <span className="font-medium">{((currentPage - 1) * USERS_PER_PAGE) + 1}</span> {t('to')}{' '}
            <span className="font-medium">
              {Math.min(currentPage * USERS_PER_PAGE, users.length)}
            </span>{' '}
            {t('of')} <span className="font-medium">{users.length}</span> {t('users')}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
              }`}
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
              }`}
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
