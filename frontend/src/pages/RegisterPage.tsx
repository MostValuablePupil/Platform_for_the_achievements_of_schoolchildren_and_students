// frontend/src/pages/RegisterPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, Mail, User, Building2, Eye, EyeOff, GraduationCap, ShieldCheck } from 'lucide-react';
import apiClient, { specialtyAPI } from '../api/client';
import type { Specialty } from '../types';
import CustomSelect from '../components/CustomSelect';
import AnimatedBackground from '../components/AnimatedBackground';

type UserRole = 'student' | 'school' | 'employer' | 'curator';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [secretCode, setSecretCode] = useState('');
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
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);

  useEffect(() => {
    specialtyAPI.getAll()
      .then(res => setSpecialties(res.data))
      .catch(err => console.error('Ошибка загрузки специальностей:', err));
  }, []);

  const classOptions = Array.from({ length: 11 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1} класс`
  }));

  const courseOptions = Array.from({ length: 5 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1} курс`
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (formData.password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return;
    }
    if (selectedRole === 'curator' && !secretCode.trim()) {
      setError('Для регистрации куратора необходимо ввести секретный код');
      return;
    }

    setIsLoading(true);

    try {
      const roleMap: Record<UserRole, string> = {
        student: 'STUDENT',
        school: 'STUDENT',
        employer: 'EMPLOYER',
        curator: 'CURATOR',
      };

      const userData: any = {
        username: formData.email,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName || '',
        password: formData.password,
        role: roleMap[selectedRole],
      };

      if (selectedRole === 'curator') {
        userData.curator_registration_code = secretCode;
      }

      if (formData.specialtyId) {
        userData.specialty = formData.specialtyId;
      }

      if (selectedRole !== 'employer') {
        userData.educational_institution = formData.educationalInstitution;
        userData.course = selectedRole === 'school' ? formData.className : formData.course;
      }

      console.log('📤 Отправляем на регистрацию:', userData);

      await apiClient.post('users/', userData);
      setRegistered(true);

    } catch (err: any) {
      console.error('❌ Ошибка:', err);
      const errorMsg = err.response?.data;
      if (errorMsg) {
        if (errorMsg.curator_registration_code) {
          setError(Array.isArray(errorMsg.curator_registration_code) 
            ? errorMsg.curator_registration_code.join(', ') 
            : 'Неверный секретный код куратора');
        } else {
          const messages = Object.values(errorMsg).flat().join(', ');
          setError(messages);
        }
      } else {
        setError('Ошибка сети. Проверьте подключение.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Опции для курса/класса
  const gradeOptions = selectedRole === 'school' ? classOptions : courseOptions;
  const gradeValue = selectedRole === 'school' ? formData.className : formData.course;
  const gradeLabel = selectedRole === 'school' ? 'Класс' : 'Курс';

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Карточка регистрации — делаем полупрозрачной для эффекта стекла */}
        <div className="bg-[#1a2332]/80 backdrop-blur-xl border border-gray-800/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl animate-fade-in-up">

          {registered ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-100 mb-3">Подтвердите почту</h2>
              <p className="text-gray-400 text-sm mb-6">
                Письмо со ссылкой для активации аккаунта отправлено на <span className="text-white font-medium">{formData.email}</span>.
                Перейдите по ссылке в письме, чтобы завершить регистрацию.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 rounded-xl font-semibold text-sm transition-all"
              >
                Перейти ко входу
              </button>
            </div>
          ) : (
          <>
          {/* Логотип */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-blue-500/20">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100 mb-1 sm:mb-2">Создать аккаунт</h1>
            <p className="text-xs sm:text-sm text-gray-400">Присоединяйтесь к Most Valuable Pupil и начинайте отслеживать свои успехи</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            
            {/* ФИО */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Фамилия *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Иванов"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Имя *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Иван"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Отчество</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Иванович"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="example@university.edu"
                  required
                />
              </div>
            </div>

            {/* Выбор роли */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Кто вы? *</label>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {[
                  { id: 'student', label: 'Студент', icon: <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" /> },
                  { id: 'school', label: 'Школьник', icon: <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" /> },
                  { id: 'employer', label: 'Работодатель', icon: <Building2 className="w-5 h-5 sm:w-6 sm:h-6" /> },
                  { id: 'curator', label: 'Куратор', icon: <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" /> },
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id as UserRole)}
                    className={`p-3 sm:p-4 w-full sm:w-[48%] lg:w-[22%] rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 sm:gap-2 ${
                      selectedRole === role.id
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-blue-500/50'
                    }`}
                  >
                    {role.icon}
                    <span className="font-medium text-xs sm:text-sm">{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Поле секретного кода (только для куратора) */}
            {selectedRole === 'curator' && (
              <div className="animate-fade-in-up">
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Секретный код *</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  <input
                    type="text"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all border-yellow-500/30"
                    placeholder="Введите секретный код для куратора"
                    required
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Код выдается администратором платформы</p>
              </div>
            )}

            {/* Учебные поля (Студент/Школьник) */}
            {selectedRole !== 'employer' && selectedRole !== 'curator' && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Учебное заведение *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <input
                      type="text"
                      value={formData.educationalInstitution}
                      onChange={(e) => setFormData({ ...formData, educationalInstitution: e.target.value })}
                      className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={selectedRole === 'school' ? 'Школа №123' : 'МГТУ им. Баумана'}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* ✅ КАСТОМНЫЙ ВЫБОР КУРСА/КЛАССА */}
                  <CustomSelect
                    label={gradeLabel}
                    options={gradeOptions}
                    value={gradeValue}
                    onChange={(value) => 
                      selectedRole === 'school' 
                        ? setFormData({ ...formData, className: value })
                        : setFormData({ ...formData, course: value })
                    }
                    placeholder={`Выберите ${selectedRole === 'school' ? 'класс' : 'курс'}`}
                    required
                  />

                  {selectedRole === 'student' && (
                    <div className="relative">
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                        Направление <span className="text-gray-500">(необязательно)</span>
                      </label>
                      <input
                        type="text"
                        value={specialtySearch}
                        onChange={(e) => {
                          setSpecialtySearch(e.target.value);
                          setShowSpecialtyDropdown(true);
                          if (!e.target.value) setFormData({ ...formData, specialtyId: null });
                        }}
                        onFocus={() => setShowSpecialtyDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSpecialtyDropdown(false), 200)}
                        className="w-full px-4 py-2.5 sm:py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Поиск направления..."
                      />
                      {showSpecialtyDropdown && (
                        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-[#1a2332] border border-gray-700 rounded-xl shadow-lg">
                          {specialties
                            .filter(s =>
                              s.code.toLowerCase().includes(specialtySearch.toLowerCase()) ||
                              s.name.toLowerCase().includes(specialtySearch.toLowerCase())
                            )
                            .map(s => (
                              <button
                                key={s.id}
                                type="button"
                                className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                                onMouseDown={() => {
                                  setFormData({ ...formData, specialtyId: s.id });
                                  setSpecialtySearch(`${s.code} — ${s.name}`);
                                  setShowSpecialtyDropdown(false);
                                }}
                              >
                                <span className="font-medium text-blue-400">{s.code}</span>{' '}
                                <span>{s.name}</span>
                              </button>
                            ))}
                          {specialties.filter(s =>
                            s.code.toLowerCase().includes(specialtySearch.toLowerCase()) ||
                            s.name.toLowerCase().includes(specialtySearch.toLowerCase())
                          ).length === 0 && (
                            <div className="px-4 py-2 text-xs sm:text-sm text-gray-500">Ничего не найдено</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Пароли */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Пароль *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Подтвердите пароль *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Согласие */}
            <div className="flex items-start gap-2 sm:gap-3">
              <input type="checkbox" id="agreement" className="w-4 h-4 mt-1 rounded border-gray-700 bg-[#0f1419] text-blue-500 focus:ring-blue-500" required />
              <label htmlFor="agreement" className="text-xs sm:text-sm text-gray-400">
                Я согласен с{' '}
                <button type="button" className="text-blue-400 hover:text-blue-300 underline">условиями использования</button>{' '}
                и{' '}
                <button type="button" className="text-blue-400 hover:text-blue-300 underline">политикой конфиденциальности</button>
              </label>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Кнопка */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/25"
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          {/* Ссылка на вход */}
          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-400">
            Уже есть аккаунт?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Войти
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}