// frontend/src/pages/EmployerLayout.tsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Users, LogOut, Menu, X } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { useState } from 'react';

export default function EmployerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useGameStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    {
      path: '/employer/students',
      icon: Users,
      label: 'Студенты',
      active: location.pathname === '/employer/students'
    },
  ];

  const employerName = currentUser
    ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()
    : 'Иван Иванов';
  const employerInitials = employerName.split(' ').map(n => n[0]).join('').toUpperCase() || 'ИИ';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0f1419] flex relative">
      
      {/* === МОБИЛЬНАЯ ШАПКА (Только для телефона) === */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#1a2332] border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">MVP</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* === ЗАТЕМНЕНИЕ ФОНА ПРИ ОТКРЫТОМ МЕНЮ === */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* === САЙДБАР (Адаптивный) === */}
      <aside className={`
        fixed md:static top-0 left-0 h-full md:h-screen w-64 bg-[#1a2332] border-r border-gray-800 p-6 z-50 
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">MVP</h1>
            <p className="text-xs text-gray-500">Работодатель</p>
          </div>
        </div>

        <nav className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsSidebarOpen(false); // Закрываем меню при клике на телефоне
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-sm font-bold text-white">
              {employerInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{employerName}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* === ОСНОВНОЙ КОНТЕНТ === */}
      {/* pt-16 на мобильных для отступа под шапку, ml-64 на десктопе для сайдбара */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}