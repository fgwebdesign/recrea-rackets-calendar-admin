'use client';

import React, { useState, useEffect } from 'react';
import UsersTable from '../../components/Users/UsersTable';
import UserFilters from '../../components/Users/UserFilter';
import Header from '@/components/Header';
import { UsersIcon } from '@heroicons/react/24/outline';
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

export default function UsersPage() {
  const t = useTranslations('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/players`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        const transformedUsers = data.map((user: any) => ({
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role === 'user' ? t('player') : user.role,
          status: 'active', 
          lastLogin: new Date().toISOString().split('T')[0], 
          avatar: user.profile_photo || 
                 user.user_metadata?.avatar_url || 
                 (user.raw_user_meta_data && user.raw_user_meta_data.avatar_url) || 
                 '/assets/user.png',
          phone: user.phone || t('notAvailable')
        }));
        setUsers(transformedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase().trim();    
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      user.phone.toLowerCase().includes(searchTermLower);    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-64 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header 
          title={t('title')}
          description={t('description')}
          icon={<UsersIcon className="w-6 h-6 text-gray-900 dark:text-gray-100" />}
        />

        <div className="mb-8">
          <UserFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
          />
        </div>

        <div className="mt-8">
          <UsersTable users={filteredUsers} />
        </div>
      </div>
    </div>
  );
}
