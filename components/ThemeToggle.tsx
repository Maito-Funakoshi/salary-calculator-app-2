'use client'

import { useTheme } from '@/app/providers'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-16 h-8 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300 flex items-center justify-between px-2"
      aria-label="テーマ切り替え"
    >
      {/* 太陽アイコン */}
      <Sun className="h-3 w-3 ml-1 text-yellow-500 z-10" />
      
      {/* 月アイコン */}
      <Moon className="h-3 w-3 mr-1 text-gray-600 dark:text-gray-400 z-10" />
      
      {/* スライディングサークル */}
      <div
        className={`
          absolute h-6 w-6 rounded-full bg-white dark:bg-gray-800 
          transition-transform duration-300 ease-in-out
          ${theme === 'light' ? '-translate-x-0.5' : 'translate-x-6.5'}
          shadow-md
        `}
      />
      
      {/* 背景のグラデーション */}
      <div
        className={`
          absolute inset-0 rounded-full 
          transition-opacity duration-300
          bg-gradient-to-r from-yellow-400 to-orange-400
          dark:bg-gradient-to-r dark:from-blue-800 dark:to-purple-800
          opacity-50
        `}
      />
    </button>
  )
} 