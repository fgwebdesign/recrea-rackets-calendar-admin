import React from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  name: string;
  avatar?: string;
  className?: string;
}

export default function UserAvatar({ name, avatar, className = "" }: UserAvatarProps) {
  // Debug: log the name being processed
  console.log('UserAvatar received name:', name);
  
  // Get initials from name - mejorado para manejar casos edge
  const getInitials = (name: string) => {
    if (!name || name === 'undefined' || name === 'null' || name.trim() === '') {
      return 'U';
    }
    
    // Limpiar el nombre de cualquier "undefined" que pueda haber quedado
    const cleanName = name.replace(/undefined/gi, '').trim();
    
    if (!cleanName) {
      return 'U';
    }
    
    const names = cleanName.split(' ').filter(n => n.length > 0);
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return cleanName[0].toUpperCase();
  };

  // If there's a valid avatar URL
  if (avatar && avatar !== 'null' && avatar !== 'undefined' && !avatar.includes('user.png')) {
    return (
      <div className={`h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`}>
        <Image
          src={avatar}
          alt={name}
          width={40}
          height={40}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div className={`h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center ${className}`}>
      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
        {getInitials(name)}
      </span>
    </div>
  );
} 