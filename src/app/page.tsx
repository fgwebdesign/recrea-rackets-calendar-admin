"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import LoadingScreen from "@/components/LoadingScreen";
import { useTranslations } from '@/contexts/TranslationContext';

export default function Home() {
  const router = useRouter();
  const t = useTranslations('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Verificar si el usuario es admin consultando la tabla users
        try {
          const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.role === 'admin') {
              localStorage.setItem('isAdmin', 'true');
              localStorage.setItem('adminToken', data.session.access_token);
              localStorage.setItem('userName', userData.first_name);
              
              await new Promise(resolve => setTimeout(resolve, 1500));
              router.push("/dashboard");
            } else {
              console.error('Usuario no tiene permisos de administrador');
              setIsLoading(false);
            }
          } else {
            console.error('Error al verificar usuario:', userResponse.status);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error al verificar rol de usuario:', error);
          setIsLoading(false);
        }
      } else {
        console.error('Error signing in:', response.statusText);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(response => {
        if (response.ok) {
          router.push("/dashboard");
        } else {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('isAdmin');
        }
      }).catch(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
      });
    }
  }, [router]);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Video de fondo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/assets/intro.mp4" type="video/mp4" />
      </video>

      {/* Overlay para mejorar la legibilidad */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />

      {isLoading && <LoadingScreen />}
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          {/* Logo y Título */}
          <div className="text-center mb-8">
            <div className="relative w-24 h-24 mx-auto mb-4 bg-white dark:bg-gray-800 rounded-full shadow-lg ring-4 ring-blue-50 dark:ring-blue-900">
              <Image
                src="/assets/Matchlylogo.png"
                alt={t('appTitle')}
                fill
                priority
                sizes="96px"
                className="object-contain p-2 rounded-full"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('appTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
              {t('appDescription')}
            </p>
            <div className="mt-4 inline-block px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-full">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{t('adminPortal')}</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t('email')}
            </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg text-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t('emailPlaceholder')}
                required
              />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t('password')}
            </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t('passwordPlaceholder')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 font-semibold"
            >
              <FaLock size={16} />
                <span>{t('loginButton')}</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('needHelp')}{' '}
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                {t('contactSupport')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
