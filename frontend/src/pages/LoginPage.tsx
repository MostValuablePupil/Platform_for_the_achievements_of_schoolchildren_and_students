import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Lock, Mail, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 p-4">
      <div className="w-full max-w-md">
        {/* Карточка входа */}
        <div className="glass-card p-8 shadow-2xl">
          {/* Логотип */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-yandex-blue to-yandex-cyan rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-yandex-blue/30">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100 text-center">
              Добро пожаловать!
            </h1>
            <p className="text-sm text-gray-400 mt-2 text-center">
              Войдите в свой аккаунт Most Valuable Pupil
            </p>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email/Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email или логин
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field pl-10"
                  placeholder="example@university.edu"
                  required
                />
              </div>
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500 hover:text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Запомнить меня и забыть пароль */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-yandex-blue focus:ring-yandex-blue"
                />
                <span className="text-gray-400">Запомнить меня</span>
              </label>
              <button type="button" className="text-yandex-blue hover:text-yandex-cyan transition-colors">
                Забыли пароль?
              </button>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="p-3 bg-yandex-red/10 border border-yandex-red/30 rounded-xl text-yandex-red text-sm">
                {error}
              </div>
            )}

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Ссылка на регистрацию */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Еще нет аккаунта?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-yandex-blue hover:text-yandex-cyan font-medium transition-colors"
            >
              Зарегистрироваться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}