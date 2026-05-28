// frontend/src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useGameStore();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.username, formData.password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа. Проверьте логин и пароль.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Карточка входа */}
        <div className="bg-[#1a2332]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl">
          {/* Логотип */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-blue-500/20 animate-scale-in">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100 text-center">
              Добро пожаловать!
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 text-center">
              Войдите в свой аккаунт Most Valuable Pupil
            </p>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email/Username */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Email или логин
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 pl-9 sm:pl-10 text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="example@university.edu"
                  required
                />
              </div>
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 pl-9 sm:pl-10 pr-10 text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 hover:text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 hover:text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Запомнить меня и забыть пароль */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-700 bg-[#0f1419] text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-400">Запомнить меня</span>
              </label>
              <button type="button" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Забыли пароль?
              </button>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="p-2.5 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs sm:text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Ссылка на регистрацию */}
          <div className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-gray-400">
            Еще нет аккаунта?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Зарегистрироваться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}