'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User2 } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';

interface Player {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  role: string;
}

export default function ActiveUsers() {
  const { users } = useUsers();
  const activeUsers = users?.slice(0, 5) || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Usuarios
        </h2>
        <Link 
          href="/users"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          Ver todos
        </Link>
      </div>

      <div className="space-y-4">
        {activeUsers.map((user) => (
          <div 
            key={user.id}
            className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
              {user.profile_photo ? (
                <Image
                  src={user.profile_photo}
                  alt={user.first_name}
                  fill
                  className="object-cover"
                  loading="lazy"
                  sizes="40px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.first_name} {user.last_name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.role || 'user'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 