"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
    )
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <div className="relative">
      {/* Theme Switch Container */}
      <button
        onClick={toggleTheme}
        className={`
          relative w-10 h-10 rounded-full transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-4 focus:ring-yellow-500/20
          ${theme === 'light' 
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/30' 
            : 'bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg shadow-slate-500/30'
          }
          hover:scale-105 active:scale-95
        `}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
        </div>

        {/* Icon Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`
            transition-all duration-300 ease-in-out
            ${theme === 'light' 
              ? 'text-yellow-100 scale-100' 
              : 'text-slate-200 scale-100'
            }
          `}>
            {theme === 'light' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </div>
        </div>

        {/* Inner glow effect */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
        </div>
      </button>

      {/* Tooltip */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {theme === 'light' ? 'Cambiar a modo oscuro' : 'Switch to light mode'}
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
      </div>
    </div>
  )
} 