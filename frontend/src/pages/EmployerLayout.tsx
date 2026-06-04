// frontend/src/pages/EmployerLayout.tsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Users, LogOut, Menu, X, Heart, Trophy, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { useState, useRef, useEffect } from 'react';
import { telegramAPI, TELEGRAM_BOT_USERNAME } from '../api/client';

export default function EmployerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useGameStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [tgStatus, setTgStatus] = useState<{ is_linked: boolean; telegram_username: string | null } | null>(null);
  const [tgCode, setTgCode] = useState<{ code: string } | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgShowCode, setTgShowCode] = useState(false);

  useEffect(() => {
    telegramAPI.getStatus()
      .then(r => setTgStatus(r.data))
      .catch(() => setTgStatus({ is_linked: false, telegram_username: null }));
  }, []);

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

  const menuItems = [
    {
      path: '/employer/students',
      icon: Users,
      label: 'Студенты',
      active: location.pathname === '/employer/students'
    },
    {
      path: '/employer/subscriptions',
      icon: Heart,
      label: 'Мои подписки',
      active: location.pathname === '/employer/subscriptions'
    },
  ];

  const employerName = currentUser
    ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()
    : 'Работодатель';
  
  const employerInitials = employerName.split(' ').map(n => n[0]).join('').toUpperCase() || 'РБ';

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsSidebarOpen(false);
  };

  // Закрываем меню при клике вне его (для мобильной версии)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1419] flex relative">
      
      {/* === МОБИЛЬНЫЙ ВЕРХНИЙ БАР (как в Layout.tsx) === */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a2332]/90 backdrop-blur-md border-b border-gray-800/50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Логотип MVP */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
              MVP Employer
            </span>
          </div>

          {/* Бургер-меню */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* Выпадающее меню выхода для мобильных */}
            {isSidebarOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a2332] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Навигационные плашки для мобильных (горизонтальный скролл) */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                item.active
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* === ДЕСКТОПНЫЙ САЙДБАР (Стилизован под Layout.tsx) === */}
      <aside className="hidden md:block w-64 min-h-screen bg-[#1a2332]/50 border-r border-gray-800/50 p-6 fixed left-0 top-0 z-40">
        {/* Логотип и название */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Most Valuable Pupil
          </h1>
          <p className="text-sm text-gray-500 mt-1">Кабинет работодателя</p>
        </div>

        {/* Навигация */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                item.active
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border border-blue-500/30'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Инфо о пользователе внизу (как в Layout.tsx) */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {employerInitials}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-100 truncate">{employerName}</p>
                <p className="text-xs text-gray-500">Работодатель</p>
              </div>
            </div>
            {/* БЛОК TELEGRAM */}
            <div className="border-t border-gray-700/50 pt-3 mb-3">
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
                    <div className="bg-[#0f1419] rounded p-2 text-center">
                      <p className="font-mono text-white text-xs font-bold tracking-widest">/link {tgCode.code}</p>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleLinkTelegram}
                  disabled={tgLoading}
                  className="w-full flex items-center justify-center gap-2 px-2 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 disabled:opacity-50 text-blue-400 rounded-lg text-xs font-medium transition-colors"
                >
                  {tgLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Привязать Telegram
                </button>
              )}
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

      {/* === ОСНОВНОЙ КОНТЕНТ === */}
      {/* pt-[120px] для мобильных (чтобы не перекрывалось верхним баром), md:pt-8 для десктопа */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-[120px] md:pt-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}