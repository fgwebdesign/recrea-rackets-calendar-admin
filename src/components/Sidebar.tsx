"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon as CogIcon,
  TrophyIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  Bars3Icon,
  XMarkIcon,
  PhotoIcon as ImageIcon,
  PlusIcon,
  TableCellsIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  TagIcon,
  CubeIcon,
  TvIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Image from 'next/image';
import LoadingScreen from './LoadingScreen';
import { useTranslations } from '@/contexts/TranslationContext';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconColor?: string;
  hoverColor?: string;
  submenu?: {
    name: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    iconColor?: string;
    textColor?: string;
  }[];
}


const MenuItem = ({ 
  item, 
  isHovered, 
  onHover,
  isSubmenuOpen,
  onToggleSubmenu,
  onMobileMenuClose
}: { 
  item: MenuItem;
  isHovered: boolean;
  onHover: (name: string | null) => void;
  isSubmenuOpen: boolean;
  onToggleSubmenu: () => void;
  onMobileMenuClose?: () => void;
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (item.submenu) {
      onToggleSubmenu();
    } else {
      router.push(item.href);
      onMobileMenuClose?.();
    }
  };

  return (
    <div>
      <div
        className={`flex items-center justify-between p-2.5 rounded-lg transition-all duration-300 ease-in-out cursor-pointer
          ${isHovered || isSubmenuOpen 
            ? 'bg-gradient-to-r from-gray-50 to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50' 
            : item.hoverColor || 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }
        `}
        onMouseEnter={() => onHover(item.name)}
        onMouseLeave={() => onHover(null)}
        onClick={handleClick}
      >
        <div className="flex items-center">
          <item.icon
            className={`w-4 h-4 mr-2.5 transition-colors ${item.iconColor || 'text-gray-400 dark:text-gray-500'}`}
          />
          <span className={`text-sm tracking-wide uppercase text-gray-700 dark:text-gray-100 ${
            item.submenu ? 'font-bold' : 'font-semibold'
          }`}>
            {item.name}
          </span>
        </div>
        {item.submenu && (
          <ChevronDown 
            className={`w-3.5 h-3.5 transition-transform duration-200 text-gray-400 dark:text-gray-500
              ${isSubmenuOpen ? 'rotate-180' : ''}`} 
          />
        )}
      </div>
      
      {item.submenu && (
        <div className={`ml-3 space-y-0.5 overflow-hidden transition-all duration-200
          ${isSubmenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          {item.submenu.map((subItem, index) => (
            <Link 
              key={`${item.href}-${subItem.name}-${index}`} 
              href={subItem.href}
              onClick={() => onMobileMenuClose?.()}
              className="flex items-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <subItem.icon className={`w-3.5 h-3.5 mr-2 ${subItem.iconColor || 'text-gray-400 dark:text-gray-500'}`} />
              <span className={`text-xs font-medium tracking-wide uppercase ${subItem.textColor || ''}`}>
                {subItem.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const LogoCard = ({ t }: { t: (key: string) => string }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:shadow-xl">
    <div className="relative w-full h-28 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 dark:from-blue-700 dark:via-blue-600 dark:to-blue-500 flex items-center justify-center p-3">
      <div className="relative w-20 h-20 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg ring-4 ring-white/50 dark:ring-gray-700/50 transform transition-transform duration-300 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-white dark:from-blue-900 dark:to-gray-800 rounded-full animate-pulse-slow" />
        <Image
          src="/assets/Matchlylogo.png"
          alt="BayPadel San Francisco"
          fill
          priority
          sizes="(max-width: 768px) 80px, 80px"
          className="object-contain p-1.5 rounded-full relative z-10"
          style={{ 
            objectFit: 'contain',
            background: 'white',
          }}
        />
      </div>
    </div>
    <div className="p-3 bg-white dark:bg-gray-800">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-0.5">{t('club')}</h3>
      <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 bg-clip-text text-transparent">
        {t('clubName')}
      </p>
    </div>
  </div>
);

const Sidebar = () => {
  const t = useTranslations('sidebar');
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Generar menú dinámicamente con traducciones
  // Ordenado por prioridad y agrupación lógica
  const getMenuItems = (): MenuItem[] => [
    // 1. INICIO - Dashboard principal (siempre primero)
    { 
      name: t('home'), 
      href: '/dashboard', 
      icon: HomeIcon,
      iconColor: 'text-blue-500',
      hoverColor: 'hover:bg-blue-50'
    },
    
    // 2. OPERACIONES PRINCIPALES DEL CLUB
    { 
      name: t('tournaments'), 
      href: '/tournaments', 
      icon: TrophyIcon,
      iconColor: 'text-orange-500',
      hoverColor: 'hover:bg-orange-50',
      submenu: [
        { 
          name: t('viewTournaments'), 
          href: '/tournaments', 
          icon: TrophyIcon,
          iconColor: 'text-orange-500' 
        },
        { 
          name: t('createTournament'), 
          href: '/tournaments/create', 
          icon: PlusIcon,
          iconColor: 'text-green-600',
          textColor: 'text-green-600 font-bold'
        },
        { 
          name: t('tvDisplay'), 
          href: '/tv', 
          icon: TvIcon,
          iconColor: 'text-blue-500',
          textColor: 'text-blue-500 font-medium'
        },
      ]
    },
    { 
      name: t('leagues'), 
      href: '/leagues', 
      icon: TableCellsIcon,
      iconColor: 'text-green-500',
      hoverColor: 'hover:bg-green-50',
      submenu: [
        { 
          name: t('viewLeagues'), 
          href: '/leagues', 
          icon: TableCellsIcon,
          iconColor: 'text-green-500' 
        },
        { 
          name: t('createLeague'), 
          href: '/leagues/create', 
          icon: PlusIcon,
          iconColor: 'text-emerald-500',
          textColor: 'text-emerald-600 font-medium'
        },
      ]
    },
    { 
      name: t('venues'), 
      href: '/venues', 
      icon: BuildingOfficeIcon,
      iconColor: 'text-purple-500',
      hoverColor: 'hover:bg-purple-50',
      submenu: [
        { 
          name: t('viewVenues'), 
          href: '/venues', 
          icon: BuildingOfficeIcon,
          iconColor: 'text-purple-500' 
        },
        { 
          name: t('courts'), 
          href: '/venues', 
          icon: BuildingOfficeIcon,
          iconColor: 'text-purple-600',
          textColor: 'text-purple-600 font-medium'
        },
      ]
    },
    
    // 3. GESTIÓN DE PRODUCTOS Y VENTAS
    { 
      name: t('kiosk'), 
      href: '/kiosk', 
      icon: ShoppingCartIcon,
      iconColor: 'text-indigo-500',
      hoverColor: 'hover:bg-indigo-50',
      submenu: [
        { 
          name: t('registerSale'), 
          href: '/kiosk', 
          icon: ShoppingCartIcon,
          iconColor: 'text-indigo-500' 
        },
        { 
          name: t('products'), 
          href: '/kiosk/products', 
          icon: CubeIcon,
          iconColor: 'text-indigo-600',
          textColor: 'text-indigo-600 font-medium'
        },
        { 
          name: t('categories'), 
          href: '/kiosk/categories', 
          icon: TagIcon,
          iconColor: 'text-indigo-600',
          textColor: 'text-indigo-600 font-medium'
        },
        { 
          name: t('sales'), 
          href: '/kiosk/sales', 
          icon: DocumentTextIcon,
          iconColor: 'text-indigo-600',
          textColor: 'text-indigo-600 font-medium'
        },
        { 
          name: t('reports'), 
          href: '/kiosk/reports', 
          icon: ChartBarIcon,
          iconColor: 'text-indigo-600',
          textColor: 'text-indigo-600 font-medium'
        },
      ]
    },
    
    // 4. GESTIÓN DE PERSONAS - Profesores
    { 
      name: t('professors'), 
      href: '/professors', 
      icon: AcademicCapIcon,
      iconColor: 'text-indigo-500',
      hoverColor: 'hover:bg-indigo-50',
      submenu: [
        { 
          name: t('viewProfessors'), 
          href: '/professors', 
          icon: AcademicCapIcon,
          iconColor: 'text-indigo-500' 
        },
        { 
          name: t('professorClasses'), 
          href: '/professors/classes', 
          icon: ClockIcon,
          iconColor: 'text-indigo-600',
          textColor: 'text-indigo-600 font-medium'
        },
      ]
    },
    
    // 5. GESTIÓN DE CONTENIDO
    { 
      name: t('categories'), 
      href: '/categories', 
      icon: TagIcon,
      iconColor: 'text-blue-500',
      hoverColor: 'hover:bg-blue-50'
    },
    { 
      name: t('users'), 
      href: '/users', 
      icon: UsersIcon,
      iconColor: 'text-cyan-500',
      hoverColor: 'hover:bg-cyan-50'
    },
    
    // 6. MARKETING Y PROMOCIÓN
    { 
      name: t('sponsors'), 
      href: '/sponsors', 
      icon: ImageIcon,
      iconColor: 'text-pink-500',
      hoverColor: 'hover:bg-pink-50'
    },
    
    // 7. CONFIGURACIÓN Y AYUDA
    { 
      name: t('settings'), 
      href: '/settings', 
      icon: CogIcon,
      iconColor: 'text-gray-500',
      hoverColor: 'hover:bg-gray-50'
    },
    { 
      name: t('guide'), 
      href: '/guide', 
      icon: BookOpenIcon,
      iconColor: 'text-indigo-500',
      hoverColor: 'hover:bg-indigo-50'
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      localStorage.removeItem('adminToken');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userName');
      
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
      } catch (error) {
        console.error('Error al cerrar sesión en el backend:', error);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push('/');
      window.location.reload();
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      localStorage.clear();
      router.push('/');
    }
  };

  const handleSubmenuToggle = (itemName: string) => {
    setOpenSubmenu(openSubmenu === itemName ? null : itemName);
  };

  return (
    <>
      {isLoggingOut && <LoadingScreen message={t('loggingOut')} />}
      
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
        aria-label={isMobileMenuOpen ? t('closeMenu') : t('openMenu')}
      >
        {isMobileMenuOpen ? 
          <XMarkIcon className="w-6 h-6" /> : 
          <Bars3Icon className="w-6 h-6" />
        }
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Content */}
      <div
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-40 w-[85%] sm:w-72 md:w-64 bg-white dark:bg-gray-900 h-screen transform transition-transform duration-300 ease-in-out shadow-xl md:shadow-none ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-b-2xl shadow-sm">
            <LogoCard t={t} />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-none">
            {getMenuItems().map((item) => (
              <MenuItem
                key={item.href}
                item={item}
                isHovered={hoveredItem === item.name}
                onHover={setHoveredItem}
                isSubmenuOpen={openSubmenu === item.name}
                onToggleSubmenu={() => handleSubmenuToggle(item.name)}
                onMobileMenuClose={() => setIsMobileMenuOpen(false)}
              />
            ))}
          </div>

          <div className="p-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors group"
            >
              <LogoutIcon className="w-4 h-4 mr-2.5 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
              <span className="font-medium text-sm">{t('logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;