// frontend/src/pages/EmployerStudentProfilePage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Award, TrendingUp, CheckCircle, Download, Share2, Calendar, Building2, GraduationCap, Loader2 } from 'lucide-react';
import { userAPI, achievementAPI } from '../api/client';
import type { User, Achievement } from '../types';

export default function EmployerStudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [userRes, achievementsRes] = await Promise.all([
          userAPI.getById(Number(id)),
          achievementAPI.getAll({ student: Number(id), status: 'VERIFIED' })
        ]);
        setStudent(userRes.data);
        setAchievements(achievementsRes.data);
      } catch (err) {
        console.error('Error fetching student profile:', err);
        setError('Не удалось загрузить профиль студента');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="bg-[#1a2332] border border-red-500/30 rounded-2xl p-6 text-center text-red-400">
        {error || 'Студент не найден'}
        <button
          onClick={() => navigate('/employer/students')}
          className="block mx-auto mt-4 text-blue-400 hover:underline text-sm"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  const progress = ((student.total_xp % 350) / 350) * 100;
  const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase() || student.username?.[0]?.toUpperCase() || 'СТ';
  const achievementsCount = student.achievements_count || achievements.length;

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-cyan-500/20 border border-blue-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white animate-fade-in-up backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <button
          onClick={() => navigate('/employer/students')}
          className="flex items-center gap-2 text-blue-200/80 hover:text-blue-200 mb-4 sm:mb-6 transition-colors relative z-10 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Вернуться к списку
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
            {student.avatar_details?.image ? (
              <img 
                src={student.avatar_details.image} 
                alt="avatar" 
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover shadow-lg shadow-blue-500/30 animate-scale-in flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg shadow-blue-500/30 animate-scale-in flex-shrink-0">
                {initials}
              </div>
            )}
            
            <div className="flex-1 sm:flex-initial">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 animate-fade-in-up delay-100">
                {student.first_name || student.username} {student.last_name}
              </h1>
              <p className="text-blue-200 mb-2 sm:mb-3 flex items-center gap-2 animate-fade-in-up delay-200 text-xs sm:text-sm">
                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                Студент {student.course ? `${student.course} курса` : ''} {student.educational_institution ? `• ${student.educational_institution}` : ''}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-blue-300/60 animate-fade-in-up delay-300">
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                  {achievementsCount} достижений
                </span>
                <span>•</span>
                <span>Уровень {student.level}</span>
                <span>•</span>
                <span>{student.total_xp} XP</span>
              </div>
              {student.future_profession && (
                <p className="text-xs sm:text-sm text-blue-200/80 mt-2 animate-fade-in-up delay-400">
                  <span className="text-blue-300/60">Цель: </span> {student.future_profession}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 animate-fade-in-up delay-500 w-full sm:w-auto">
            <button className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2">
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Поделиться</span>
              <span className="sm:hidden">Share</span>
            </button>
            <button className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2">
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Скачать</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <a 
              href={`mailto:${student.email}`}
              className="px-3 sm:px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
              Связаться
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Progress */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fade-in-up delay-100">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 sm:mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Прогресс
            </h3>
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-400">Уровень {student.level}</span>
                <span className="text-xs sm:text-sm text-blue-400 font-bold">{student.total_xp} XP</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 animate-fade-in delay-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                До следующего уровня: {Math.max(0, 350 - (student.total_xp % 350))} XP
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fade-in-up delay-200">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 sm:mb-4">Активность</h3>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-400">Достижений</span>
                <span className="text-xs sm:text-sm font-bold text-blue-400">{achievementsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-400">Уровень</span>
                <span className="text-xs sm:text-sm font-bold text-purple-400">{student.level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-400">Всего XP</span>
                <span className="text-xs sm:text-sm font-bold text-orange-400">{student.total_xp}</span>
              </div>
            </div>
          </div>

          {/* Button to Skills Tracking */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fade-in-up delay-300 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Навыки и компетенции</h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
              Подробная визуализация сильных сторон, радар-график и статистика по всем направлениям
            </p>
            <button
              onClick={() => navigate(`/employer/students/${id}/skills`)}
              className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Трекинг навыков
            </button>
          </div>
        </div>

        {/* Right Column - Achievements */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-[#1a2332] border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fade-in-up delay-300">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 sm:mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              Верифицированные достижения
            </h3>

            {achievements.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {achievements.map((achievement, index) => (
                  <div 
                    key={achievement.id} 
                    className="bg-[#0f1419] border border-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-blue-500/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-white text-sm sm:text-base">{achievement.title}</h4>
                      <span className="px-2 sm:px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        Верифицировано
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">{achievement.description || 'Нет описания'}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(achievement.created).toLocaleDateString('ru-RU')}
                      </span>
                      <span>•</span>
                      <span className="text-orange-400 font-medium">+{achievement.points} XP</span>
                      {achievement.organization && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            {achievement.organization}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Award className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Пока нет верифицированных достижений</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
