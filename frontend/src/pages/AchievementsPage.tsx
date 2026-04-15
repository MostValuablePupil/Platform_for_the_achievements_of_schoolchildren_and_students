// frontend/src/pages/AchievementsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Filter, Trophy, Award, Calendar, Medal } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export default function AchievementsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { achievements, fetchAchievements, currentUser, userStats, fetchUserStats } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'VERIFIED' | 'PENDING'>('all');
  
  const [activeTab, setActiveTab] = useState<'achievements' | 'badges'>(
    (searchParams.get('tab') as 'achievements' | 'badges') || 'achievements'
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

  const allBadges = [
    { id: 1, name: 'Первая победа', description: 'Получена за первое место в олимпиаде', icon: '🏆', earned: true, earnedAt: '20 ноября 2025 г.' },
    { id: 2, name: 'Инноватор', description: 'Участие в 3 хакатонах', icon: '💡', earned: true, earnedAt: '15 января 2026 г.' },
    { id: 3, name: 'Командный игрок', description: 'Успешная работа в 5 командных проектах', icon: '👥', earned: true, earnedAt: '1 февраля 2026 г.' },
    { id: 4, name: 'Марафонец', description: 'Завершение 10 онлайн-курсов', icon: '🎯', earned: true, earnedAt: '28 февраля 2026 г.' },
    { id: 5, name: 'Наставник', description: 'Помощь 5 студентам младших курсов', icon: '🎓', earned: true, earnedAt: '5 марта 2026 г.' },
    { id: 6, name: 'Эксперт', description: 'Получение 50 верифицированных достижений', icon: '⭐', earned: false },
    { id: 7, name: 'Легенда', description: 'Достижение 100 уровня', icon: '👑', earned: false },
    { id: 8, name: 'Первопроходец', description: 'Добавление первого достижения', icon: '🚀', earned: achievements.length > 0 },
  ];

  const handleTabChange = (tab: 'achievements' | 'badges') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white mb-1">Достижения</h1>
        <p className="text-sm text-gray-500">
          Все ваши успехи, награды и сертификаты в одном месте
        </p>
      </div>

      {/* Stats Grid - с задержками для stagger-эффекта */}
      <div className="grid grid-cols-6 gap-4">
        {[
          { key: 'hackathon', label: 'Проектов', color: 'text-blue-500', delay: 'delay-100' },
          { key: 'olympiad', label: 'Олимпиад', color: 'text-purple-500', delay: 'delay-200' },
          { key: 'course', label: 'Курсов', color: 'text-cyan-400', delay: 'delay-300' },
          { key: 'sport_art', label: 'Хакатонов', color: 'text-green-500', delay: 'delay-400' },
          { key: 'volunteering', label: 'Волонтерств', color: 'text-white', delay: 'delay-500' },
          { key: 'science', label: 'Публикаций', color: 'text-red-500', delay: 'delay-600' },
        ].map((stat, index) => (
          <div 
            key={stat.key}
            className={`bg-[#1a2332] rounded-2xl p-5 text-center animate-scale-in ${stat.delay}`}
          >
            <p className={`text-2xl font-bold ${stat.color} mb-1`}>{counts[stat.key as keyof typeof counts]}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-4 animate-fade-in-up delay-300">
        <button
          onClick={() => handleTabChange('achievements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'achievements'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Достижения
        </button>
        <button
          onClick={() => handleTabChange('badges')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'badges'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Medal className="w-4 h-4" />
          Награды и бейджи
          <span className="px-2 py-0.5 bg-gray-800 rounded-full text-xs">
            {badges.length}
          </span>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'achievements' ? (
        <>
          {/* Filters & Add Button */}
          <div className="flex items-center justify-between animate-fade-in-up delay-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Filter className="w-4 h-4" />
                <span className="text-sm">Фильтр:</span>
              </div>
              <div className="flex gap-1">
                {['all', 'VERIFIED', 'PENDING'].map((f, i) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors animate-fade-in delay-${500 + i * 100} ${
                      filter === f
                        ? 'bg-[#1a2332] text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {f === 'all' ? 'Все' : f === 'VERIFIED' ? 'Верифицированные' : 'На проверке'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/achievements/new')}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/25 animate-fade-in-up delay-800"
            >
              <Plus className="w-4 h-4" />
              Добавить достижение
            </button>
          </div>

          {/* Achievements List */}
          <div className="space-y-3">
            {filtered.length > 0 ? (
              filtered.map((achievement, index) => (
                <div
                  key={achievement.id}
                  onClick={() => navigate(`/achievements/${achievement.id}`)}
                  className="bg-[#1a2332] rounded-2xl p-6 hover:bg-[#1e2738] transition-all cursor-pointer group border border-transparent hover:border-gray-700 animate-fade-in-up"
                  style={{ animationDelay: `${0.5 + (index * 0.1)}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-scale-in">
                      <Trophy className="w-5 h-5 text-green-500" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {achievement.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          achievement.status === 'VERIFIED'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : achievement.status === 'PENDING'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {achievement.status === 'VERIFIED' ? '✓ Верифицировано' :
                           achievement.status === 'PENDING' ? '○ На проверке' : '✕ Отклонено'}
                        </span>
                      </div>

                      <p className="text-base text-gray-400 mb-4 leading-relaxed">
                        {achievement.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {achievement.skills && achievement.skills.slice(0, 3).map((skill: any, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-[#0f1419] rounded-lg text-sm text-gray-400 animate-fade-in"
                              style={{ animationDelay: `${0.1 * i}s` }}
                            >
                              {typeof skill === 'object' ? skill.name : skill}
                            </span>
                          ))}
                          {achievement.organization && (
                            <span className="px-3 py-1.5 bg-[#0f1419] rounded-lg text-sm text-gray-400">
                              {achievement.organization}
                            </span>
                          )}
                          <span className="px-3 py-1.5 bg-cyan-500/10 rounded-lg text-sm text-cyan-400 font-medium">
                            +{achievement.points} XP
                          </span>
                        </div>

                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {new Date(achievement.created).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#1a2332] rounded-2xl p-16 text-center animate-fade-in-up delay-500">
                <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3 animate-scale-in" />
                <p className="text-gray-500 text-sm">Пока нет достижений</p>
                <p className="text-gray-600 text-xs mt-1">Добавьте своё первое достижение</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Badges Tab */
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-400">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                Прогресс наград
              </h3>
              <span className="text-sm text-gray-400">
                {badges.length} / {allBadges.length}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 animate-fade-in delay-500"
                style={{ width: `${(badges.length / allBadges.length) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              Продолжайте добавлять достижения, чтобы получить новые награды и бейджи!
            </p>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allBadges.map((badge, index) => (
              <div
                key={badge.id}
                className={`bg-[#1a2332] border rounded-2xl p-6 transition-all animate-scale-in ${
                  badge.earned
                    ? 'border-purple-500/30 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10'
                    : 'border-gray-800 opacity-60'
                }`}
                style={{ animationDelay: `${0.5 + (index * 0.1)}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl animate-scale-in ${
                    badge.earned
                      ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                      : 'bg-gray-800'
                  }`}>
                    {badge.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${
                      badge.earned ? 'text-white' : 'text-gray-500'
                    }`}>
                      {badge.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      {badge.description}
                    </p>
                    {badge.earned && badge.earnedAt && (
                      <p className="text-xs text-purple-400 animate-fade-in delay-300">
                        Получено: {badge.earnedAt}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}