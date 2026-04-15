import type{ ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Trophy, TrendingUp, LogOut } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { logout, currentUser } = useGameStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-dark-900/50 border-r border-dark-700/50 p-6 fixed left-0 top-0">
          <div className="mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-yandex-blue to-yandex-cyan rounded-xl flex items-center justify-center mb-3">
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
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
