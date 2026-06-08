// frontend/src/components/Layout.tsx
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Trophy, TrendingUp, LogOut, Calendar, Menu, X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { telegramAPI, TELEGRAM_BOT_USERNAME } from '../api/client';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { logout, currentUser } = useGameStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // --- ЛОГИКА TELEGRAM ДЛЯ САЙДБАРА ---
  const [tgStatus, setTgStatus] = useState<{ is_linked: boolean; telegram_username: string | null } | null>(null);
  const [tgCode, setTgCode] = useState<{ code: string } | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgShowCode, setTgShowCode] = useState(false);

  // Загрузка статуса при монтировании
  useEffect(() => {
    telegramAPI.getStatus()
      .then(r => setTgStatus(r.data))
      .catch(() => setTgStatus({ is_linked: false, telegram_username: null }));
  }, []);

  // Проверка привязки по таймеру, если есть код
  useEffect(() => {
    if (!tgCode) return;
    const timer = setInterval(async () => {
      try {
        const r = await telegramAPI.getStatus();
        if (r.data.is_linked) { 
          setTgStatus(r.data); 
          setTgCode(null); 
        }
      } catch {}
    }, 4000);
    return () => clearInterval(timer);
  }, [tgCode]);

  const handleLinkTelegram = async () => {
    setTgLoading(true);
    try {
      const r = await telegramAPI.generateLink();
      setTgCode({ code: r.data.code });
      window.open(`https://t.me/${TELEGRAM_BOT_USERNAME}?start=${r.data.code}`, '_blank');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка генерации ссылки');
    } finally {
      setTgLoading(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!confirm('Отвязать Telegram от аккаунта?')) return;
    setTgLoading(true);
    try {
      await telegramAPI.unlink();
      setTgStatus({ is_linked: false, telegram_username: null });
      setTgCode(null);
    } catch {
      alert('Ошибка при отвязке');
    } finally {
      setTgLoading(false);
    }
  };
  // --- КОНЕЦ ЛОГИКИ TELEGRAM ---

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
      {/* === МОБИЛЬНЫЙ ВЕРХНИЙ БАР === */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-dark-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yandex-blue to-yandex-cyan rounded-lg flex items-center justify-center shadow-lg shadow-yandex-blue/20">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold bg-gradient-to-r from-yandex-cyan to-yandex-purple bg-clip-text text-transparent tracking-tight">
              MVP
            </span>
          </div>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-800"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* ✅ ВЫПАДАЮЩЕЕ МЕНЮ ДЛЯ МОБИЛЬНЫХ С TELEGRAM И ВЫХОДОМ */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up p-4">
                
                {/* --- БЛОК TELEGRAM ДЛЯ МОБИЛЬНЫХ --- */}
                <div className="mb-4 pb-4 border-b border-dark-700/50">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
                    <Send className="w-3 h-3" /> Telegram-уведомления
                  </label>
                  
                  {tgStatus === null ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin" /> Загрузка...
                    </div>
                  ) : tgStatus.is_linked ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-xs text-gray-300 truncate">
                          {tgStatus.telegram_username ? `@${tgStatus.telegram_username}` : 'Подключено'}
                        </span>
                      </div>
                      <button 
                        onClick={handleUnlinkTelegram} 
                        disabled={tgLoading}
                        className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors ml-2"
                      >
                        {tgLoading ? '...' : 'Отвязать'}
                      </button>
                    </div>
                  ) : tgCode ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-400" /> Ожидание...
                      </p>
                      <button 
                        onClick={() => setTgShowCode(v => !v)} 
                        className="text-[10px] text-gray-500 hover:text-gray-300 underline block"
                      >
                        {tgShowCode ? 'Скрыть код' : 'Не открылся бот?'}
                      </button>
                      {tgShowCode && (
                        <div className="bg-dark-900 rounded p-2 text-center">
                          <p className="font-mono text-white text-xs font-bold tracking-widest">/link {tgCode.code}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={handleLinkTelegram} 
                      disabled={tgLoading}
                      className="w-full flex items-center justify-center gap-2 px-2 py-1.5 bg-yandex-blue/10 hover:bg-yandex-blue/20 border border-yandex-blue/30 disabled:opacity-50 text-yandex-blue rounded-lg text-xs font-medium transition-colors"
                    >
                      {tgLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Привязать Telegram
                    </button>
                  )}
                </div>

                {/* --- КНОПКА ВЫХОДА --- */}
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-2 text-sm text-gray-300 hover:bg-dark-700 hover:text-white flex items-center gap-3 transition-colors rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>
        </div>
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

      {/* === ДЕСКТОПНЫЙ САЙДБАР === */}
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

        {/* User Info & Telegram Block */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 rounded-2xl p-4">
            
            {/* Инфо о пользователе */}
            <div className="flex items-center gap-3 mb-4">
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

            {/* БЛОК TELEGRAM В САЙДБАРЕ */}
            <div className="border-t border-dark-700/50 pt-3 mb-3">
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
                <Send className="w-3 h-3" /> Подпишись на Telegram
              </label>
              
              {tgStatus === null ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Загрузка...
                </div>
              ) : tgStatus.is_linked ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-xs text-gray-300 truncate">
                      {tgStatus.telegram_username ? `@${tgStatus.telegram_username}` : 'Подключено'}
                    </span>
                  </div>
                  <button 
                    onClick={handleUnlinkTelegram} 
                    disabled={tgLoading}
                    className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors ml-2"
                  >
                    {tgLoading ? '...' : 'Отвязать'}
                  </button>
                </div>
              ) : tgCode ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-400" /> Ожидание...
                  </p>
                  <button 
                    onClick={() => setTgShowCode(v => !v)} 
                    className="text-[10px] text-gray-500 hover:text-gray-300 underline block"
                  >
                    {tgShowCode ? 'Скрыть код' : 'Не открылся бот?'}
                  </button>
                  {tgShowCode && (
                    <div className="bg-dark-900 rounded p-2 text-center">
                      <p className="font-mono text-white text-xs font-bold tracking-widest">/link {tgCode.code}</p>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={handleLinkTelegram} 
                  disabled={tgLoading}
                  className="w-full flex items-center justify-center gap-2 px-2 py-1.5 bg-yandex-blue/10 hover:bg-yandex-blue/20 border border-yandex-blue/30 disabled:opacity-50 text-yandex-blue rounded-lg text-xs font-medium transition-colors"
                >
                  {tgLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Привязать Telegram
                </button>
              )}
            </div>

            {/* Кнопка выхода */}
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
      <main className="md:ml-64 p-4 md:p-8 pt-[120px] md:pt-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}