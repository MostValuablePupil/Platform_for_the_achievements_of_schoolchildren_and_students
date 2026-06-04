// frontend/src/pages/EmployerSubscriptionsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, TrendingUp, ExternalLink, GraduationCap, Loader2, Trash2 } from 'lucide-react';
import { subscriptionAPI } from '../api/client';
import type { User } from '../types';

export default function EmployerSubscriptionsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      // Используем эндпоинт followed_students
      const response = await subscriptionAPI.getSubscriptions();
      setStudents(response.data);
    } catch (err: any) {
      console.error('Error fetching subscriptions:', err);
      setError('Не удалось загрузить список подписок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleUnsubscribe = async (studentId: number) => {
    if (!window.confirm('Вы уверены, что хотите отписаться от этого студента?')) return;
    
    try {
      await subscriptionAPI.unsubscribe(studentId);
      // Удаляем студента из локального стейта
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) {
      alert('Ошибка при отписке');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a2332] border border-red-500/30 rounded-2xl p-6 text-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white mb-2">Мои подписки</h1>
        <p className="text-gray-500">
          Студенты, за которыми вы следите.
        </p>
      </div>

      {/* Content */}
      {students.length > 0 ? (
        <div className="space-y-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all group relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  {student.avatar_details?.image ? (
                     <img src={student.avatar_details.image} alt="avatar" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {student.first_name} {student.last_name}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      {student.educational_institution} • {student.course} курс
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <span className="flex items-center gap-1 text-purple-400">
                        <TrendingUp className="w-4 h-4" />
                        Уровень: {student.level}
                      </span>
                      <span className="flex items-center gap-1 text-orange-400">
                        <Award className="w-4 h-4" />
                        {student.total_xp} XP
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                   <button 
                    onClick={() => navigate(`/employer/students/${student.id}`)}
                    className="px-4 py-2 border border-gray-700 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:border-blue-500/30 hover:bg-[#0f1419] transition-all flex items-center gap-2"
                   >
                    Профиль
                    <ExternalLink className="w-4 h-4" />
                   </button>
                   
                   <button 
                    onClick={() => handleUnsubscribe(student.id)}
                    className="px-4 py-2 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-all flex items-center gap-2"
                   >
                    Отписаться
                    <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-12 text-center animate-fade-in">
          <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">У вас пока нет подписок</p>
          <p className="text-gray-600 text-sm mt-1">Перейдите в раздел "Студенты", чтобы найти талантливых кандидатов</p>
          <button 
            onClick={() => navigate('/employer/students')}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
          >
            Найти студентов
          </button>
        </div>
      )}
    </div>
  );
}