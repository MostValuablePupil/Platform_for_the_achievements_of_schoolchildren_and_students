// frontend/src/components/Layout.tsx
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Trophy, TrendingUp, LogOut, Calendar, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { logout, currentUser } = useGameStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/', icon: Home, label: 'Профиль' },
    { path: '/achievements', icon: Trophy, label: 'Достижения' },
    { path: '/skills', icon: TrendingUp, label: 'Навыки' },
    { path: '/events', icon: Calendar, label: 'Мероприятия' },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      
      {/* === МОБИЛЬНЫЙ/ПЛАНШЕТНЫЙ ВЕРХНИЙ БАР === */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-dark-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Уменьшенный логотип и надпись MVP */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yandex-blue to-yandex-cyan rounded-lg flex items-center justify-center shadow-lg shadow-yandex-blue/20">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold bg-gradient-to-r from-yandex-cyan to-yandex-purple bg-clip-text text-transparent tracking-tight">
              MVP
            </span>
          </div>

          {/* Бургер-меню с кнопкой выхода */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-800"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-dark-700 hover:text-white flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Навигационные плашки (слева, ближе к логотипу) */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                (item.path === '/' && window.location.pathname === '/') || window.location.pathname === item.path
                  ? 'bg-yandex-blue/20 text-yandex-blue border border-yandex-blue/30'
                  : 'text-gray-400 hover:text-white hover:bg-dark-800/50'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* === ДЕСКТОПНЫЙ САЙДБАР (скрыт на мобильных) === */}
      <aside className="hidden md:block w-64 min-h-screen bg-dark-900/50 border-r border-dark-700/50 p-6 fixed left-0 top-0 z-40">
        <div className="mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-yandex-blue to-yandex-cyan rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-yandex-blue/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-yandex-cyan to-yandex-purple bg-clip-text text-transparent">
            Most Valuable Pupil
          </h1>
          <p className="text-sm text-gray-500 mt-1">Цифровое портфолио</p>
        </div>

        <nav className="space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-yandex-blue/20 to-yandex-cyan/20 text-white border border-yandex-blue/30' 
                  : 'text-gray-400 hover:bg-dark-800/50 hover:text-gray-100'
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span>Мой профиль</span>
          </NavLink>
          
          <NavLink
            to="/achievements"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-yandex-blue/20 to-yandex-cyan/20 text-white border border-yandex-blue/30' 
                  : 'text-gray-400 hover:bg-dark-800/50 hover:text-gray-100'
              }`
            }
          >
            <Trophy className="w-5 h-5" />
            <span>Достижения</span>
          </NavLink>
          
          <NavLink
            to="/skills"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-yandex-blue/20 to-yandex-cyan/20 text-white border border-yandex-blue/30' 
                  : 'text-gray-400 hover:bg-dark-800/50 hover:text-gray-100'
              }`
            }
          >
            <TrendingUp className="w-5 h-5" />
            <span>Трекинг навыков</span>
          </NavLink>

          <NavLink
            to="/events"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-yandex-blue/20 to-yandex-cyan/20 text-white border border-yandex-blue/30' 
                  : 'text-gray-400 hover:bg-dark-800/50 hover:text-gray-100'
              }`
            }
          >
            <Calendar className="w-5 h-5" />
            <span>Мероприятия</span>
          </NavLink>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              {currentUser?.avatar_details?.image ? (
                <img 
                  src={currentUser.avatar_details.image} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-yandex-blue to-yandex-cyan rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-100">
                  {currentUser?.first_name} {currentUser?.last_name}
                </p>
                <p className="text-xs text-gray-500">Уровень {currentUser?.level || 1}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      {/* ✅ УВЕЛИЧЕН ОТСТУП СВЕРХУ: pt-[100px] -> pt-[160px] */}
      <main className="md:ml-64 p-4 md:p-8 pt-[120px] md:pt-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}