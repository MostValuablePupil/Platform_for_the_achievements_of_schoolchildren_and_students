// frontend/src/pages/EmployerStudentProfilePage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Award, TrendingUp, CheckCircle, Calendar, Building2, GraduationCap, Loader2, Heart, Bell, FileText, ChevronDown, ChevronUp, Link2, Clock } from 'lucide-react';
import { userAPI, achievementAPI, subscriptionAPI } from '../api/client';
import type { User, Achievement } from '../types';

// Вспомогательные функции для отображения типов и уровней
const TYPE_LABELS: Record<string, string> = {
  OLYMPIAD: '🧠 Олимпиада',
  HACKATHON: '💻 Проект / Хакатон',
  COURSE: '📚 Курс / Обучение',
  VOLUNTEERING: '🤝 Волонтерство',
  SCIENCE: '🔬 Научная работа',
  SPORT_ART: '🏅 Спорт / Творчество',
};

const LEVEL_LABELS: Record<string, string> = {
  UNIVERSITY: 'Вузовская',
  REGIONAL: 'Региональная',
  ALL_RUSSIA: 'Всероссийская',
  INTERNAL: 'Внутривузовский',
  INTER_UNIVERSITY: 'Межвузовский',
  ONLINE_SHORT: 'Онлайн-курс (до 20 ч)',
  RETRAINING: 'Профессиональная переподготовка',
  SHORT: '1-10 часов',
  LONG: '10+ часов',
  ARTICLE: 'Статья в сборнике',
  VAK: 'Публикация в журнале ВАК',
};

const RESULT_LABELS: Record<string, string> = {
  PARTICIPANT: 'Участие',
  PRIZE: 'Призёр',
  WINNER: 'Победитель',
};

export default function EmployerStudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для отслеживания развернутых достижений (по ID)
  const [expandedAchievementId, setExpandedAchievementId] = useState<number | null>(null);

  // Состояние для кнопки подписки
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const studentId = Number(id);
        
        const [userRes, achievementsRes, subStatusRes] = await Promise.all([
          userAPI.getById(studentId),
          achievementAPI.getAll({ student: studentId, status: 'VERIFIED' }),
          userAPI.isFollowed(studentId)
        ]);
        
        setStudent(userRes.data);
        setAchievements(achievementsRes.data);
        setIsSubscribed(subStatusRes.data.is_followed);
      } catch (err) {
        console.error('Error fetching student profile:', err);
        setError('Не удалось загрузить профиль студента');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const toggleSubscription = async () => {
    if (!id) return;
    setSubLoading(true);
    try {
      const studentId = Number(id);
      if (isSubscribed) {
        await subscriptionAPI.unsubscribe(studentId);
        setIsSubscribed(false);
      } else {
        await subscriptionAPI.subscribe(studentId);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
      alert('Ошибка при изменении подписки');
    } finally {
      setSubLoading(false);
    }
  };

  const toggleExpandAchievement = (achievementId: number) => {
    setExpandedAchievementId(expandedAchievementId === achievementId ? null : achievementId);
  };

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
          className="block mx-auto mt-4 text-blue-400 hover:underline"
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
    <div className="space-y-4 md:space-y-6 animate-fade-in px-4 md:px-0">
      
      {/* Header - Адаптивный (без изменений) */}
      <div className="bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-cyan-500/20 border border-blue-500/30 rounded-2xl md:rounded-3xl p-4 md:p-8 text-white animate-fade-in-up backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <button
          onClick={() => navigate('/employer/students')}
          className="flex items-center gap-2 text-blue-200/80 hover:text-blue-200 mb-4 md:mb-6 transition-colors relative z-10 text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Вернуться к списку</span>
          <span className="sm:hidden">Назад</span>
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 relative z-10">
          <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto">
            {student.avatar_details?.image ? (
              <img 
                src={student.avatar_details.image} 
                alt="avatar" 
                className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl object-cover shadow-lg shadow-blue-500/30 animate-scale-in flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl font-bold text-white shadow-lg shadow-blue-500/30 animate-scale-in flex-shrink-0">
                {initials}
              </div>
            )}
            
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 truncate animate-fade-in-up delay-100">
                {student.first_name || student.username} {student.last_name}
              </h1>
              
              <p className="text-xs md:text-sm text-blue-200 mb-2 md:mb-3 flex items-center gap-1 md:gap-2 flex-wrap animate-fade-in-up delay-200">
                <GraduationCap className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="truncate">
                  {student.specialty ? 'Студент' : 'Школьник'} 
                  {student.course && ` ${student.course} ${student.specialty ? 'курс' : 'класс'}`}
                  {student.educational_institution && ` • ${student.educational_institution}`}
                </span>
              </p>

              <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm text-blue-300/60 animate-fade-in-up delay-300 flex-wrap">
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 md:w-4 md:h-4" />
                  {achievementsCount} дост.
                </span>
                <span className="hidden sm:inline">•</span>
                <span>Ур. {student.level}</span>
                <span className="hidden sm:inline">•</span>
                <span>{student.total_xp} XP</span>
              </div>
              {student.future_profession && (
                <p className="text-[10px] md:text-sm text-blue-200/80 mt-1 md:mt-2 truncate animate-fade-in-up delay-400">
                  <span className="text-blue-300/60">Цель: </span> {student.future_profession}
                </p>
              )}
            </div>
          </div>

          {/* Кнопки действий - Адаптивные (без изменений) */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto justify-end animate-fade-in-up delay-500">
            <button 
              onClick={toggleSubscription}
              disabled={subLoading}
              className={`flex-1 md:flex-none px-3 py-2 md:px-4 md:py-2 border rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                isSubscribed 
                  ? 'bg-pink-500/20 text-pink-400 border-pink-500/50 hover:bg-pink-500/30' 
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isSubscribed ? <Bell className="w-3 h-3 md:w-4 md:h-4 fill-current" /> : <Heart className="w-3 h-3 md:w-4 md:h-4" />}
              <span className="hidden sm:inline">{subLoading ? '...' : (isSubscribed ? 'Подписаны' : 'Подписаться')}</span>
              <span className="sm:hidden">{subLoading ? '...' : (isSubscribed ? 'Отписка' : 'Подп.')}</span>
            </button>

            <div className="relative group">
              <button 
                className="flex-1 md:flex-none px-3 py-2 md:px-4 md:py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-2"
                onClick={() => window.location.href = `mailto:${student.email}`}
              >
                <Mail className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Написать</span>
                <span className="sm:hidden">Email</span>
              </button>
              
              {/* Всплывающая подсказка с email адресом */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg border border-gray-700">
                {student.email}
                {/* Стрелочка вниз */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Адаптивная сетка */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        
        {/* Left Column - Статистика и Прогресс (без изменений) */}
        <div className="col-span-1 lg:col-span-4 space-y-4 md:space-y-6">
          
          {/* Progress */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 animate-fade-in-up delay-100">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 md:mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Прогресс
            </h3>
            <div className="mb-2 md:mb-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <span className="text-xs md:text-sm text-gray-400">Уровень {student.level}</span>
                <span className="text-xs md:text-sm text-blue-400 font-bold">{student.total_xp} XP</span>
              </div>
              <div className="w-full h-1.5 md:h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 animate-fade-in delay-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2">
                До след. уровня: {Math.max(0, 350 - (student.total_xp % 350))} XP
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 animate-fade-in-up delay-200">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 md:mb-4">Активность</h3>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-gray-400">Достижений</span>
                <span className="text-xs md:text-sm font-bold text-blue-400">{achievementsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-gray-400">Уровень</span>
                <span className="text-xs md:text-sm font-bold text-purple-400">{student.level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-gray-400">Всего XP</span>
                <span className="text-xs md:text-sm font-bold text-orange-400">{student.total_xp}</span>
              </div>
            </div>
          </div>

          {/* Button to Skills Tracking */}
          <div className="hidden md:flex bg-[#1a2332] border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 animate-fade-in-up delay-300 flex-col items-center justify-center text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 md:mb-4">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-white mb-1 md:mb-2">Навыки</h3>
            <p className="text-xs md:text-sm text-gray-400 mb-4 md:mb-6 line-clamp-2">
              Визуализация сильных сторон и статистика по направлениям
            </p>
            <button
              onClick={() => navigate(`/employer/students/${id}/skills`)}
              className="w-full py-2.5 md:py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-medium transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 md:w-5 md:h-5" />
              Подробнее
            </button>
          </div>
        </div>

        {/* Right Column - Achievements с разворачиванием */}
        <div className="col-span-1 lg:col-span-8">
          <div className="bg-[#1a2332] border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 animate-fade-in-up delay-300">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 md:mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              Верифицированные достижения
            </h3>

            {achievements.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {achievements.map((achievement, index) => {
                  const isExpanded = expandedAchievementId === achievement.id;
                  
                  return (
                    <div 
                      key={achievement.id} 
                      className={`bg-[#0f1419] border border-gray-800/50 rounded-lg md:rounded-xl overflow-hidden transition-all animate-fade-in ${
                        isExpanded ? 'border-blue-500/30' : 'hover:border-blue-500/30'
                      }`}
                      style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}
                    >
                      {/* Заголовок карточки (всегда виден) */}
                      <div 
                        className="p-3 md:p-4 cursor-pointer flex items-start justify-between"
                        onClick={() => toggleExpandAchievement(achievement.id)}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-white text-sm md:text-base line-clamp-1">{achievement.title}</h4>
                            <span className="px-2 py-0.5 md:px-3 md:py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-[10px] md:text-xs font-medium flex items-center gap-1 flex-shrink-0 ml-2">
                              <CheckCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">Верифицировано</span>
                              <span className="sm:hidden">OK</span>
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-400 mb-2 line-clamp-1">{achievement.description || 'Нет описания'}</p>
                          <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(achievement.created).toLocaleDateString('ru-RU')}
                            </span>
                            <span>•</span>
                            <span className="text-orange-400 font-medium">+{achievement.points} XP</span>
                            {achievement.organization && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1 max-w-[150px] truncate">
                                  <Building2 className="w-3 h-3 flex-shrink-0" />
                                  {achievement.organization}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Стрелка разворачивания */}
                        <div className="flex-shrink-0 ml-2 self-center">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Развернутая информация (видна только если isExpanded) */}
                      {isExpanded && (
                        <div className="border-t border-gray-800/50 p-3 md:p-4 bg-[#0f1419]/50 animate-fade-in">
                          
                          {/* Тип и уровень */}
                          <div className="mb-3 md:mb-4">
                            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-400 mb-2">
                              {/* Используем ?. и || для безопасного доступа */}
                              <span>{TYPE_LABELS[achievement.event_type] || achievement.event_type}</span>
                              
                              {achievement.level_category && (
                                <>
                                  <span className="w-1 h-1 bg-gray-600 rounded-full hidden sm:inline"></span>
                                  <span>{LEVEL_LABELS[achievement.level_category] || achievement.level_category}</span>
                                </>
                              )}
                              
                              {achievement.achievement_level && achievement.achievement_level !== 'PARTICIPANT' && (
                                <>
                                  <span className="w-1 h-1 bg-gray-600 rounded-full hidden sm:inline"></span>
                                  <span>{RESULT_LABELS[achievement.achievement_level] || achievement.achievement_level}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Полное описание */}
                          <div className="mb-3 md:mb-4">
                            <h5 className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1 md:mb-2">Описание</h5>
                            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                              {achievement.description || 'Нет описания'}
                            </p>
                          </div>

                          {/* Дополнительная информация (часы, сертификат) */}
                          {(achievement.hours_count || achievement.has_certificate) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
                              {achievement.hours_count && (
                                <div className="bg-[#1a2332] rounded-lg p-2 md:p-3">
                                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                    <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="text-[10px] md:text-xs uppercase tracking-wider">Количество часов</span>
                                  </div>
                                  <p className="text-sm text-white">{achievement.hours_count} ч.</p>
                                </div>
                              )}
                              {achievement.has_certificate && (
                                <div className="bg-[#1a2332] rounded-lg p-2 md:p-3">
                                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                    <FileText className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="text-[10px] md:text-xs uppercase tracking-wider">Сертификат</span>
                                  </div>
                                  <p className="text-sm text-green-400">Есть сертификат/диплом</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Ссылка */}
                          {achievement.link && (
                            <div className="mb-3 md:mb-4">
                              <h5 className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1 md:mb-2">Ссылка</h5>
                              <a 
                                href={achievement.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm md:text-base text-blue-400 hover:text-blue-300 transition-colors break-all"
                              >
                                <Link2 className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                                {achievement.link}
                              </a>
                            </div>
                          )}

                          {/* Навыки */}
                          {achievement.skill_names && achievement.skill_names.length > 0 && (
                            <div>
                              <h5 className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1 md:mb-2">Навыки</h5>
                              <div className="flex flex-wrap gap-1.5 md:gap-2">
                                {achievement.skill_names.map((skill: any, i: number) => (
                                  <span 
                                    key={i}
                                    className="px-2 md:px-3 py-1 md:py-1.5 bg-gray-800 rounded-lg text-xs md:text-sm text-gray-300"
                                  >
                                    {typeof skill === 'object' ? skill.name : skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12">
                <Award className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Пока нет верифицированных достижений</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}