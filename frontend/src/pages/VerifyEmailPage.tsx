import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    apiClient.get(`users/verify-email/${token}/`)
      .then(() => {
        setStatus('success');
        setMessage('Email подтверждён! Теперь вы можете войти.');
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Неверная или истёкшая ссылка.');
      });
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1419]">
      <div className="bg-[#1a2332] rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Подтверждаем email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-white mb-2">Готово!</h2>
            <p className="text-gray-400">{message}</p>
            <p className="text-gray-600 text-sm mt-3">Переход на страницу входа...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">✗</div>
            <h2 className="text-xl font-bold text-white mb-2">Ошибка</h2>
            <p className="text-gray-400">{message}</p>
            <button
              onClick={() => navigate('/register')}
              className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
            >
              Зарегистрироваться заново
            </button>
          </>
        )}
      </div>
    </div>
  );
}
