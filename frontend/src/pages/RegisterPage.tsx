import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, Mail, User, Building2, Eye, EyeOff, GraduationCap } from 'lucide-react';
import apiClient, { specialtyAPI } from '../api/client';
import { useGameStore } from '../store/useGameStore'; // ✅ ИМПОРТИРУЕМ STORE
import type { Specialty } from '../types';

type UserRole = 'student' | 'school' | 'employer';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useGameStore(); // ✅ БЕРЕМ ФУНКЦИЮ ВХОДА ИЗ STORE

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    confirmPassword: '',
    educationalInstitution: '',
    course: '',        
    className: '',     
    specialtyId: null as number | null,
  });

  // Специальности с бэкенда
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);

  useEffect(() => {
    specialtyAPI.getAll()
      .then(res => setSpecialties(res.data))
      .catch(err => console.error('Ошибка загрузки специальностей:', err));
  }, []);

  // Генерация массивов для выпадающих списков
  const classOptions = Array.from({ length: 11 }, (_, i) => (i + 1).toString());
  const courseOptions = Array.from({ length: 5 }, (_, i) => (i + 1).toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Валидация
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (formData.password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return;
    }

    setIsLoading(true);

    try {
      const roleMap = {
        student: 'STUDENT',
        school: 'STUDENT',
        employer: 'EMPLOYER',
      };

      const userData: any = {
        username: formData.email,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName || '',
        password: formData.password,
        role: roleMap[selectedRole],
        educational_institution: formData.educationalInstitution,
        course: selectedRole === 'school' ? formData.className : formData.course,
      };

      if (formData.specialtyId) {
        userData.specialty = formData.specialtyId;
      }

      console.log('📤 Отправляем на регистрацию:', userData);

      // 1. Регистрируем пользователя (тут оставляем прямой запрос, т.к. в сторе нет register)
      await apiClient.post('users/', userData);
      console.log('✅ Регистрация успешна');

      // 2. ✅ ВАЖНОЕ ИЗМЕНЕНИЕ: Используем login из Store
      // Эта функция сама сохранит токен в localStorage И установит isAuthenticated = true
      console.log('🔑 Выполняем вход через Store...');
      await login(formData.email, formData.password);
      console.log('✅ Store обновлен: isAuthenticated = true');
      
      // 3. Переходим на главную
      console.log('🚀 Перенаправляем на главную...');
      navigate('/');

    } catch (err: any) {
      console.error('❌ Ошибка:', err);
      const errorMsg = err.response?.data;
      if (errorMsg) {
        const messages = Object.values(errorMsg).flat().join(', ');
        setError(messages);
      } else {
        setError('Ошибка сети. Проверьте подключение.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 p-4">
      <div className="w-full max-w-2xl">
        {/* Карточка регистрации */}
        <div className="glass-card p-8 shadow-2xl">
          {/* Логотип */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-yandex-blue to-yandex-cyan rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-yandex-blue/30">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100 text-center">
              Создать аккаунт
            </h1>
            <p className="text-sm text-gray-400 mt-2 text-center max-w-md">
              Присоединяйтесь к Most Valuable Pupil и начните отслеживать свои успехи
            </p>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ФИО - три отдельных поля */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Фамилия *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input-field pl-10"
                    placeholder="Иванов"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Имя *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input-field pl-10"
                    placeholder="Иван"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Отчество
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="input-field pl-10"
                    placeholder="Иванович"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="example@university.edu"
                  required
                />
              </div>
            </div>

            {/* Выбор роли */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Кто вы? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedRole === 'student'
                      ? 'border-yandex-blue bg-yandex-blue/10 text-white'
                      : 'border-dark-600 bg-dark-800/50 text-gray-400 hover:border-yandex-blue/50'
                  }`}
                >
                  <GraduationCap className="w-6 h-6" />
                  <span className="font-medium">Студент</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('school')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedRole === 'school'
                      ? 'border-yandex-blue bg-yandex-blue/10 text-white'
                      : 'border-dark-600 bg-dark-800/50 text-gray-400 hover:border-yandex-blue/50'
                  }`}
                >
                  <GraduationCap className="w-6 h-6" />
                  <span className="font-medium">Школьник</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('employer')}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedRole === 'employer'
                      ? 'border-yandex-blue bg-yandex-blue/10 text-white'
                      : 'border-dark-600 bg-dark-800/50 text-gray-400 hover:border-yandex-blue/50'
                  }`}
                >
                  <Building2 className="w-6 h-6" />
                  <span className="font-medium">Работодатель</span>
                </button>
              </div>
            </div>

            {/* Учебное заведение */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Учебное заведение *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={formData.educationalInstitution}
                  onChange={(e) => setFormData({ ...formData, educationalInstitution: e.target.value })}
                  className="input-field pl-10"
                  placeholder={selectedRole === 'school' ? 'Школа №123' : 'МГТУ им. Баумана'}
                  required
                />
              </div>
            </div>

            {/* Курс/Класс и Направление */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {selectedRole === 'school' ? 'Класс *' : 'Курс *'}
                </label>
                
                <select
                  value={selectedRole === 'school' ? formData.className : formData.course}
                  onChange={(e) => 
                    selectedRole === 'school' 
                      ? setFormData({ ...formData, className: e.target.value })
                      : setFormData({ ...formData, course: e.target.value })
                  }
                  className="input-field appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>
                    Выберите {selectedRole === 'school' ? 'класс' : 'курс'}
                  </option>
                  {(selectedRole === 'school' ? classOptions : courseOptions).map((num) => (
                    <option key={num} value={num} className="bg-dark-800 text-gray-100">
                      {selectedRole === 'school' ? `${num} класс` : `${num} курс`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRole === 'student' && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Направление <span className="text-gray-500">(необязательно)</span>
                  </label>
                  <input
                    type="text"
                    value={specialtySearch}
                    onChange={(e) => {
                      setSpecialtySearch(e.target.value);
                      setShowSpecialtyDropdown(true);
                      if (!e.target.value) {
                        setFormData({ ...formData, specialtyId: null });
                      }
                    }}
                    onFocus={() => setShowSpecialtyDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSpecialtyDropdown(false), 200)}
                    className="input-field"
                    placeholder="Начните вводить код или название..."
                  />
                  {showSpecialtyDropdown && (
                    <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-dark-800 border border-dark-600 rounded-xl shadow-lg">
                      {specialties
                        .filter(s =>
                          s.code.toLowerCase().includes(specialtySearch.toLowerCase()) ||
                          s.name.toLowerCase().includes(specialtySearch.toLowerCase())
                        )
                        .map(s => (
                          <button
                            key={s.id}
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-dark-700 transition-colors"
                            onMouseDown={() => {
                              setFormData({ ...formData, specialtyId: s.id });
                              setSpecialtySearch(`${s.code} — ${s.name}`);
                              setShowSpecialtyDropdown(false);
                            }}
                          >
                            <span className="font-medium text-yandex-blue">{s.code}</span>{' '}
                            <span>{s.name}</span>
                          </button>
                        ))}
                      {specialties.filter(s =>
                        s.code.toLowerCase().includes(specialtySearch.toLowerCase()) ||
                        s.name.toLowerCase().includes(specialtySearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500">Ничего не найдено</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Пароль и подтверждение */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Пароль *
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Подтвердите пароль *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500 hover:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Согласие */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreement"
                className="w-4 h-4 mt-1 rounded border-dark-600 bg-dark-800 text-yandex-blue focus:ring-yandex-blue"
                required
              />
              <label htmlFor="agreement" className="text-sm text-gray-400">
                Я согласен с{' '}
                <button type="button" className="text-yandex-blue hover:text-yandex-cyan underline">
                  условиями использования
                </button>{' '}
                и{' '}
                <button type="button" className="text-yandex-blue hover:text-yandex-cyan underline">
                  политикой конфиденциальности
                </button>
              </label>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="p-3 bg-yandex-red/10 border border-yandex-red/30 rounded-xl text-yandex-red text-sm">
                {error}
              </div>
            )}

            {/* Кнопка регистрации */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          {/* Ссылка на вход */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Уже есть аккаунт?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-yandex-blue hover:text-yandex-cyan font-medium transition-colors"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}