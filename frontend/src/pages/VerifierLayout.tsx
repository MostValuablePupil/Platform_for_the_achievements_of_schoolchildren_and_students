// frontend/src/pages/VerifierLayout.tsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, CheckSquare, Trophy } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export default function VerifierLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useGameStore();

  const menuItems = [
    { 
      path: '/verifier/achievements', 
      icon: CheckSquare, 
      label: 'Верификация достижений', 
      active: location.pathname === '/verifier/achievements' 
    },
  ];

  const verifier = {
    name: 'Верификатор',
    role: 'Администратор',
    avatar: 'В',
  };

  return (
    <div className="min-h-screen bg-[#0f1419] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a2332] border-r border-gray-800 p-6 fixed left-0 top-0 h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Most Valuable Pupil</h1>
            <p className="text-xs text-gray-500">Панель верификатора</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
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

        {/* User Info */}
        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-sm font-bold text-white">
              {verifier.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{verifier.name}</p>
              <p className="text-xs text-gray-500 truncate">{verifier.role}</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <Outlet />
      </main>
    </div>
  );
}
