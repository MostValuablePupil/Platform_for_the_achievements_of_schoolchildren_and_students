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
    <div className="space-y-4 md:space-y-6 animate-fade-in px-4 md:px-0">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">Мои подписки</h1>
        <p className="text-xs md:text-base text-gray-500">
          Студенты, за которыми вы следите.
        </p>
      </div>

      {/* Content */}
      {students.length > 0 ? (
        <div className="space-y-3 md:space-y-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="bg-[#1a2332] border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-blue-500/30 transition-all group relative"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                
                {/* Левая часть: Аватар + Инфо */}
                <div className="flex items-start gap-3 md:gap-4 w-full sm:w-auto">
                  {/* Avatar */}
                  {student.avatar_details?.image ? (
                     <img src={student.avatar_details.image} alt="avatar" className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl font-bold text-white flex-shrink-0">
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base md:text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                        {student.first_name} {student.last_name}
                      </h3>
                    </div>
                    
                    <p className="text-xs md:text-sm text-gray-400 mb-2 flex items-center gap-1 truncate">
                      <GraduationCap className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      {student.educational_institution} • {student.course} курс
                    </p>
                    
                    <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm mb-2 flex-wrap">
                      <span className="flex items-center gap-1 text-purple-400">
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                        Ур. {student.level}
                      </span>
                      <span className="flex items-center gap-1 text-orange-400">
                        <Award className="w-3 h-3 md:w-4 md:h-4" />
                        {student.total_xp} XP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Правая часть: Кнопки */}
                <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                   <button 
                    onClick={() => navigate(`/employer/students/${student.id}`)}
                    className="flex-1 sm:flex-none px-3 py-2 md:px-4 md:py-2 border border-gray-700 rounded-lg md:rounded-xl text-xs md:text-sm font-medium text-gray-400 hover:text-white hover:border-blue-500/30 hover:bg-[#0f1419] transition-all flex items-center justify-center gap-2"
                   >
                    <span className="hidden sm:inline">Профиль</span>
                    <ExternalLink className="w-4 h-4" />
                   </button>
                   
                   <button 
                    onClick={() => handleUnsubscribe(student.id)}
                    className="flex-1 sm:flex-none px-3 py-2 md:px-4 md:py-2 border border-red-500/30 text-red-400 rounded-lg md:rounded-xl text-xs md:text-sm font-medium hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                   >
                    <span className="hidden sm:inline">Отписаться</span>
                    <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1a2332] border border-gray-800 rounded-xl md:rounded-2xl p-8 md:p-12 text-center animate-fade-in">
          <Award className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-sm md:text-lg text-gray-500">У вас пока нет подписок</p>
          <p className="text-xs md:text-sm text-gray-600 mt-1">Перейдите в раздел "Студенты", чтобы найти талантливых кандидатов</p>
          <button 
            onClick={() => navigate('/employer/students')}
            className="mt-4 md:mt-6 px-4 md:px-6 py-2 md:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-colors"
          >
            Найти студентов
          </button>
        </div>
      )}
    </div>
  );
}