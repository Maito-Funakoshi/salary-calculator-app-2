import { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import Image from 'next/image';
import { LogOut, User as UserIcon } from 'lucide-react';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative h-8" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full overflow-hidden transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
        aria-label="ユーザーメニューを開く"
      >
        <Image
          src={user.photoURL || '/default-avatar.png'}
          alt="User avatar"
          width={40}
          height={40}
          className="object-cover"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-black rounded-xl shadow-xl py-2 z-10 border border-gray-200 dark:border-gray-700 transform transition-all duration-200 origin-top-right">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
              <Image
                src={user.photoURL || '/default-avatar.png'}
                alt="User avatar"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2 mt-1"
          >
            <LogOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span>ログアウト</span>
          </button>
        </div>
      )}
    </div>
  );
}
