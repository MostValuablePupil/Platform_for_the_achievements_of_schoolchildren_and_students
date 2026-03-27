import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/logo.svg" alt="MVP Logo" className="auth-logo" />
        <h1>Добро пожаловать!</h1>
        <p>Войдите в свой аккаунт Most Valuable Pupil</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@university.edu"
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-row">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Запомнить меня</span>
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Забыли пароль?
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Вход...' : '🔐 Войти'}
          </button>
        </form>

        <p className="auth-footer">
          Еще нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
