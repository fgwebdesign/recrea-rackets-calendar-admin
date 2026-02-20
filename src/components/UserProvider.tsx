'use client'

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import LoadingScreen from './LoadingScreen';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/';
  const isTVPage = pathname.startsWith('/tv');

  // Verificar el estado de autenticación
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        // No mostrar error si no hay token, simplemente limpiar y redirigir
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userName');
        setUsername('');
        
        if (!isLoginPage) {
          router.push('/');
        }
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Solo mostrar error si el token existe pero es inválido
        console.error('Token inválido, limpiando sesión');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userName');
        setUsername('');
        
        if (!isLoginPage) {
          router.push('/');
        }
        return;
      }

      const data = await response.json();
      if (data.first_name) {
        setUsername(data.first_name);
      } else {
        console.error('Datos de usuario inválidos');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('userName');
        setUsername('');
        
        if (!isLoginPage) {
          router.push('/');
        }
      }
    } catch (error) {
      // Solo mostrar error si es un error de red, no por logout intencional
      console.error('Error de conexión:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userName');
      setUsername('');
      
      if (!isLoginPage) {
        router.push('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Agregar listener para eventos de storage para manejar logout en múltiples pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminToken' && !e.newValue) {
        router.push('/');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, isLoginPage]);

  if (isLoading) {
    return <LoadingScreen message="Verificando sesión..." />;
  }

  // Si es la página de login o pantalla TV, no mostramos el sidebar
  if (isLoginPage || isTVPage) {
    return children;
  }

  // Si el usuario está autenticado, mostramos el layout con sidebar
  if (username) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 w-full md:w-auto transition-all duration-300 ease-in-out overflow-x-hidden">
          {children}
        </main>
      </div>
    );
  }
  return children;
}
