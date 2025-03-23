"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserMenu } from "@/components/UserMenu"
import { User } from "firebase/auth"

interface HeaderProps {
  isBlur: boolean
  setIsBlur: (isBlur: boolean) => void
  user: User | null
  signInWithGoogle: () => void
  handleLogout: () => void
}

export const Header = ({ isBlur, setIsBlur, user, signInWithGoogle, handleLogout }: HeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-4">
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white">給料計算機</h1>
        <Button
          onClick={() => setIsBlur(!isBlur)}
          className="rounded-full h-8 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white duration-300 hover:scale-105"
        >
          {isBlur ? "表示する" : "ぼかす"}
        </Button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />
        {user ? (
          <UserMenu user={user} onLogout={handleLogout} />
        ) : (
          <Button 
            onClick={signInWithGoogle}
            className="w-16 h-8 text-xs sm:text-md"
          >
            ログイン
          </Button>
        )}
      </div>
    </div>
  )
}
