import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    password_confirm: '',
    role: '',  // student/schoolchild/employer/teacher
    institution: '',
    faculty: '',
    course: '',
    grade: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Валидация
    if (formData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Пароли не совпадают');
      return;
    }

    if (!formData.role) {
      setError('Выберите статус');
      return;
    }

    // Валидация полей для студента
    if (formData.role === 'STUDENT') {
      if (!formData.institution) {
        setError('Укажите учебное заведение');
        return;
      }
      if (!formData.course) {
        setError('Укажите курс');
        return;
      }
    }

    // Валидация полей для школьника
    if (formData.role === 'SCHOOLCHILD') {
      if (!formData.institution) {
        setError('Укажите учебное заведение');
        return;
      }
      if (!formData.grade) {
        setError('Укажите класс');
        return;
      }
    }

    setLoading(true);

    try {
      // Разделяем полное имя
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Пользователь';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const registerData = {
        username: formData.email,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: firstName,
        last_name: lastName,
        role: formData.role,
        institution: formData.institution,
        faculty: formData.faculty || '',
        course: formData.course || '',
        grade: formData.grade || '',
      };

      console.log('📤 Отправка регистрации:', registerData);
      
      await register(registerData);
      console.log('✅ Успешная регистрация!');
      navigate('/profile');
      
    } catch (err) {
      console.error('❌ Ошибка регистрации:', err);
      console.error('Ответ сервера:', err.response?.data);
      
      setError(
        err.response?.data?.detail || 
        err.response?.data?.email?.[0] ||
        err.response?.data?.password?.[0] ||
        'Ошибка регистрации. Проверьте данные.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <img src="/logo.svg" alt="MVP Logo" className="auth-logo" />
        <h1>Создать аккаунт</h1>
        <p className="auth-subtitle">
          Присоединяйтесь к Most Valuable Pupil и начните строить своё цифровое портфолио
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Полное имя */}
          <div className="form-group">
            <label>Полное имя *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Иван Иванов"
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@university.edu"
              required
            />
          </div>

          {/* Пароль и подтверждение */}
          <div className="form-row">
            <div className="form-group">
              <label>Пароль *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-group">
              <label>Подтвердите пароль *</label>
              <input
                type="password"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Статус (роль) */}
          <div className="form-group">
            <label>Статус *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Выберите статус</option>
              <option value="STUDENT">Студент</option>
              <option value="SCHOOLCHILD">Школьник</option>
              <option value="EMPLOYER" disabled>Работодатель (скоро)</option>
              <option value="TEACHER" disabled>Преподаватель (скоро)</option>
            </select>
          </div>

          {/* Поля для СТУДЕНТА */}
          {formData.role === 'STUDENT' && (
            <>
              <div className="form-group">
                <label>Учебное заведение *</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="Например: Уральский Государственный Университет"
                  required
                />
              </div>

              <div className="form-group">
                <label>Факультет</label>
                <input
                  type="text"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  placeholder="Например: Факультет компьютерных наук"
                />
              </div>

              <div className="form-group">
                <label>Курс *</label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите курс</option>
                  <option value="1">1 курс</option>
                  <option value="2">2 курс</option>
                  <option value="3">3 курс</option>
                  <option value="4">4 курс</option>
                  <option value="5">5 курс</option>
                  <option value="6">6 курс</option>
                </select>
              </div>
            </>
          )}

          {/* Поля для ШКОЛЬНИКА */}
          {formData.role === 'SCHOOLCHILD' && (
            <>
              <div className="form-group">
                <label>Учебное заведение *</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="Например: Школа №123"
                  required
                />
              </div>

              <div className="form-group">
                <label>Класс *</label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите класс</option>
                  {[...Array(11)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} класс
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Кнопка регистрации */}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;