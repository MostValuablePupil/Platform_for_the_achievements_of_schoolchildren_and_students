// frontend/src/pages/AchievementsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Filter, Trophy, Award, Calendar, Medal, GraduationCap } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import RsrDiplomaSearch from '../components/RsrDiplomaSearch';

const ALL_BADGES = [
  { id: '1', name: 'Первая победа', icon: '🏆', category: 'Олимпиады', description: 'За 1 место в олимпиаде' },
  { id: '2', name: 'Призёр', icon: '🥈', category: 'Олимпиады', description: 'За 2-3 место в олимпиаде' },
  { id: '3', name: 'Участник', icon: '📜', category: 'Олимпиады', description: 'За участие в олимпиаде' },
  { id: '4', name: 'Олимпиадный боец', icon: '⚔️', category: 'Олимпиады', description: '5+ подтвержденных олимпиад' },
  { id: '5', name: 'Лидер вуза', icon: '🎓', category: 'Олимпиады', description: 'Победа на вузовском уровне' },
  { id: '6', name: 'Региональный эксперт', icon: '🌟', category: 'Олимпиады', description: 'Победа на региональном уровне' },
  { id: '7', name: 'Всероссийский чемпион', icon: '🏆', category: 'Олимпиады', description: 'Победа на всероссийском уровне' },
  { id: '8', name: 'Инноватор', icon: '💡', category: 'Хакатоны', description: '3+ подтвержденных хакатона' },
  { id: '9', name: 'Проектировщик', icon: '🔧', category: 'Проекты', description: 'Первый завершенный проект/хакатон' },
  { id: '10', name: 'Командный игрок', icon: '👥', category: 'Проекты', description: '5+ командных проектов' },
  { id: '11', name: 'Технолидер', icon: '🦄', category: 'Хакатоны', description: 'Победа на всероссийском хакатоне' },
  { id: '15', name: 'Марафонец', icon: '🏃', category: 'Курсы', description: '10+ пройденных курсов' },
  { id: '16', name: 'Сертифицирован', icon: '✅', category: 'Курсы', description: 'Получение сертификата' },
  { id: '20', name: 'Помощник', icon: '🤲', category: 'Волонтерство', description: 'Первая волонтерская активность' },
  { id: '22', name: 'Социальный лидер', icon: '📢', category: 'Волонтерство', description: '3+ волонтерских события' },
  { id: '23', name: 'Исследователь', icon: '🔬', category: 'Наука', description: 'Публикация статьи в сборнике' },
  { id: '24', name: 'Научный автор', icon: '📄', category: 'Наука', description: 'Публикация ВАК/РИНЦ' },
  { id: '27', name: 'Участник (Спорт/Творчество)', icon: '🎭', category: 'Спорт/Творчество', description: 'Участие в мероприятии' },
  { id: '28', name: 'Талант', icon: '✨', category: 'Спорт/Творчество', description: 'Призовое место' },
  { id: '29', name: 'Чемпион', icon: '🥇', category: 'Спорт/Творчество', description: 'Победа в соревновании' },
  { id: '30', name: 'Разносторонний', icon: '🎨', category: 'Спорт/Творчество', description: '5+ достижений в спорте или творчестве' },
];

export default function AchievementsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { achievements, fetchAchievements, currentUser, fetchUserStats } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'VERIFIED' | 'PENDING'>('all');
  const [activeTab, setActiveTab] = useState<'achievements' | 'badges' | 'rsosh'>(
    (searchParams.get('tab') as 'achievements' | 'badges' | 'rsosh') || 'achievements'
  );

  useEffect(() => {
    if (currentUser?.id) {
      fetchAchievements({ student: currentUser.id });
      fetchUserStats(currentUser.id);
    }
  }, [currentUser]);

  const filtered = filter === 'all'
    ? achievements
    : achievements.filter(a => a.status === filter);

  const counts = {
    hackathon: achievements.filter(a => a.event_type === 'HACKATHON').length,
    olympiad: achievements.filter(a => a.event_type === 'OLYMPIAD').length,
    course: achievements.filter(a => a.event_type === 'COURSE').length,
    sport_art: achievements.filter(a => a.event_type === 'SPORT_ART').length,
    volunteering: achievements.filter(a => a.event_type === 'VOLUNTEERING').length,
    science: achievements.filter(a => a.event_type === 'SCIENCE').length,
  };

  const badges = currentUser?.earned_badges || [];
  
  const allBadges = ALL_BADGES.map(badge => {
    const earnedInfo = badges.find(
      (ub: any) => (ub.badge_name || ub.name) === badge.name
    );
    const dateString = earnedInfo?.earned_at || earnedInfo?.awarded_at || earnedInfo?.created_at;

    return {
      ...badge,
      earned: !!earnedInfo,
      earnedAt: dateString 
        ? new Date(dateString).toLocaleDateString('ru-RU') 
        : null
    };
  });

  const earnedBadges = allBadges.filter(badge => badge.earned);
  const notEarnedBadges = allBadges.filter(badge => !badge.earned);

  const handleTabChange = (tab: 'achievements' | 'badges' | 'rsosh') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-10 animate-fade-in px-3 sm:px-4 md:px-6 lg:px-0">
      
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100 mb-1 sm:mb-2">Достижения</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-400">Все ваши успехи, награды и сертификаты в одном месте</p>
      </div>

      {/* Stats Grid - улучшенная адаптивная сетка */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
        {[
          { key: 'hackathon', label: 'Проектов', color: 'text-blue-500', delay: 'delay-100' },
          { key: 'olympiad', label: 'Олимпиад', color: 'text-purple-500', delay: 'delay-200' },
          { key: 'course', label: 'Курсов', color: 'text-cyan-400', delay: 'delay-300' },
          { key: 'sport_art', label: 'Спорт/Творч.', color: 'text-green-500', delay: 'delay-400' },
          { key: 'volunteering', label: 'Волонтерств', color: 'text-white', delay: 'delay-500' },
          { key: 'science', label: 'Публикаций', color: 'text-red-500', delay: 'delay-600' },
        ].map((stat) => (
          <div 
            key={stat.key}
            className={`bg-[#1a2332] rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-5 text-center animate-scale-in ${stat.delay}`}
          >
            <p className={`text-lg sm:text-xl md:text-2xl font-bold ${stat.color} mb-0.5 sm:mb-1`}>{counts[stat.key as keyof typeof counts]}</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs - улучшенная адаптация */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-800 pb-3 sm:pb-4 animate-fade-in-up delay-300 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => handleTabChange('achievements')}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'achievements'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Достижения</span>
          <span className="sm:hidden">Достижения</span>
        </button>
        <button
          onClick={() => handleTabChange('badges')}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'badges'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Medal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Награды</span>
          <span className="sm:hidden">Награды</span>
          <span className="px-1.5 sm:px-2 py-0.5 bg-gray-800 rounded-full text-[10px] sm:text-xs">
            {badges.length}
          </span>
        </button>
        <button
          onClick={() => handleTabChange('rsosh')}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'rsosh'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Дипломы РСОШ</span>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'achievements' ? (
        <>
          {/* Filters & Add Button - улучшенная адаптация */}
          <div className="flex flex-col gap-3 sm:gap-4 animate-fade-in-up delay-400">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
                  <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Фильтр:</span>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                  {['all', 'VERIFIED', 'PENDING'].map((f, i) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                        filter === f
                          ? 'bg-[#1a2332] text-white'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {f === 'all' ? 'Все' : f === 'VERIFIED' ? 'Подтвержденные' : 'На проверке'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/achievements/new')}
                className="flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/25 animate-fade-in-up delay-800 w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Добавить достижение</span>
                <span className="sm:hidden">Добавить</span>
              </button>
            </div>
          </div>

          {/* Achievements List */}
          <div className="space-y-2.5 sm:space-y-3">
            {filtered.length > 0 ? (
              filtered.map((achievement, index) => (
                <div
                  key={achievement.id}
                  onClick={() => navigate(`/achievements/${achievement.id}`)}
                  className="bg-[#1a2332] rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 hover:bg-[#1e2738] transition-all cursor-pointer group border border-transparent hover:border-gray-700 animate-fade-in-up"
                  style={{ animationDelay: `${0.5 + (index * 0.1)}s` }}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-scale-in">
                      <Trophy className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-green-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 md:mb-3">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                          {achievement.title}
                        </h3>
                        <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap self-start sm:self-auto ${
                          achievement.status === 'VERIFIED'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : achievement.status === 'PENDING'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {achievement.status === 'VERIFIED' ? '✓ Подтв.' :
                           achievement.status === 'PENDING' ? '○ Проверка' : '✕ Отклонено'}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm md:text-base text-gray-400 mb-2 sm:mb-3 md:mb-4 leading-relaxed line-clamp-2">
                        {achievement.description}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          {achievement.skill_names && achievement.skill_names.slice(0, 2).map((skill: any, i: number) => (
                            <span
                              key={i}
                              className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-[#0f1419] rounded text-[10px] sm:text-xs md:text-sm text-gray-400"
                            >
                              {typeof skill === 'object' ? skill.name : skill}
                            </span>
                          ))}
                          <span className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-cyan-500/10 rounded text-[10px] sm:text-xs md:text-sm text-cyan-400 font-medium">
                            +{achievement.points} XP
                          </span>
                        </div>

                        <span className="flex items-center gap-1 text-[10px] sm:text-xs md:text-sm text-gray-500">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                          {new Date(achievement.created).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#1a2332] rounded-lg sm:rounded-xl md:rounded-2xl p-6 sm:p-8 md:p-16 text-center animate-fade-in-up delay-500">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-700 mx-auto mb-2 sm:mb-3 animate-scale-in" />
                <p className="text-xs sm:text-sm text-gray-500">Пока нет достижений</p>
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">Добавьте своё первое достижение</p>
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'badges' ? (
        /* Badges Tab */
        <div className="space-y-4 sm:space-y-6">
          
          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
              {earnedBadges.map((badge, index) => (
                <div
                  key={badge.id}
                  className="bg-[#1a2332] border border-purple-500/30 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 animate-scale-in"
                  style={{ animationDelay: `${0.5 + (index * 0.1)}s` }}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-xl sm:text-2xl md:text-3xl flex-shrink-0 animate-scale-in">
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm md:text-base text-white mb-0.5 sm:mb-1 line-clamp-2">
                        {badge.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-400 mb-1 sm:mb-2 leading-relaxed line-clamp-2">
                        {badge.description}
                      </p>
                      {badge.earned && badge.earnedAt && (
                        <p className="text-[10px] sm:text-[11px] font-medium text-purple-400">
                          {badge.earnedAt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 animate-fade-in-up delay-400">
            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white flex items-center gap-1.5 sm:gap-2">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-400" />
                <span className="hidden sm:inline">Прогресс наград</span>
                <span className="sm:hidden">Прогресс</span>
              </h3>
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-400">
                {badges.length} / {allBadges.length}
              </span>
            </div>
            <div className="w-full h-1.5 sm:h-2 md:h-3 bg-gray-800 rounded-full overflow-hidden mb-1.5 sm:mb-2 md:mb-3">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 animate-fade-in delay-500"
                style={{ width: `${(badges.length / allBadges.length) * 100}%` }}
              />
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">
              Продолжайте добавлять достижения!
            </p>
          </div>

          {/* Not Earned Badges */}
          {notEarnedBadges.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-400 mb-3 sm:mb-4">Не получено</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                {notEarnedBadges.map((badge, index) => (
                  <div
                    key={badge.id}
                    className="bg-[#1a2332] border border-gray-800 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 transition-all opacity-40 grayscale animate-scale-in"
                    style={{ animationDelay: `${0.5 + (index * 0.1)}s` }}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl bg-gray-800 flex items-center justify-center text-xl sm:text-2xl md:text-3xl flex-shrink-0">
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-500 mb-0.5 sm:mb-1 line-clamp-2">
                          {badge.name}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed line-clamp-2">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'rsosh' ? (
        <RsrDiplomaSearch />
      ) : null}
    </div>
  );
}