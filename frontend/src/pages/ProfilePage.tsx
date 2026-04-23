// frontend/src/pages/ProfilePage.tsx
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Award, CheckCircle2, GraduationCap, Mail, ArrowUpRight, ArrowRight, BarChart3, Activity, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Добавляем массив всех бейджей для подгрузки иконок
const ALL_BADGES = [
  { id: '1', name: 'Первая победа', icon: '🏆', description: 'За 1 место в олимпиаде' },
  { id: '2', name: 'Призёр', icon: '🥈', description: 'За 2-3 место в олимпиаде' },
  { id: '3', name: 'Участник', icon: '📜', description: 'За участие в олимпиаде' },
  { id: '4', name: 'Олимпиадный боец', icon: '⚔️', description: '5+ подтвержденных олимпиад' },
  { id: '5', name: 'Лидер вуза', icon: '🎓', description: 'Победа на вузовском уровне' },
  { id: '6', name: 'Региональный эксперт', icon: '🌟', description: 'Победа на региональном уровне' },
  { id: '7', name: 'Всероссийский чемпион', icon: '🏆', description: 'Победа на всероссийском уровне' },
  { id: '8', name: 'Инноватор', icon: '💡', description: '3+ подтвержденных хакатона' },
  { id: '9', name: 'Проектировщик', icon: '🔧', description: 'Первый завершенный проект' },
  { id: '10', name: 'Командный игрок', icon: '👥', description: '5+ командных проектов' },
  { id: '11', name: 'Технолидер', icon: '🦄', description: 'Победа на всероссийском хакатоне' },
  { id: '15', name: 'Марафонец', icon: '🏃', description: '10+ пройденных курсов' },
  { id: '16', name: 'Сертифицирован', icon: '✅', description: 'Получение сертификата' },
  { id: '20', name: 'Помощник', icon: '🤲', description: 'Первая волонтерская активность' },
  { id: '22', name: 'Социальный лидер', icon: '📢', description: '3+ волонтерских события' },
  { id: '23', name: 'Исследователь', icon: '🔬', description: 'Публикация статьи в сборнике' },
  { id: '24', name: 'Научный автор', icon: '📄', description: 'Публикация ВАК/РИНЦ' },
  { id: '27', name: 'Участник (Спорт/Творчество)', icon: '🎭', description: 'Участие в мероприятии' },
  { id: '28', name: 'Талант', icon: '✨', description: 'Призовое место' },
  { id: '29', name: 'Чемпион', icon: '🥇', description: 'Победа в соревновании' },
  { id: '30', name: 'Разносторонний', icon: '🎨', description: '5+ достижений в спорте или творчестве' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, achievements, fetchCurrentUser, fetchAchievements, skills: allSkills, fetchSkills } = useGameStore();
  const [showContactPopup, setShowContactPopup] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      fetchCurrentUser(currentUser.id);
      fetchAchievements({ student: currentUser.id });
    }
    if (allSkills.length === 0) {
      fetchSkills();
    }
  }, [currentUser?.id]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1419]">
        <div className="text-gray-500">Загрузка профиля...</div>
      </div>
    );
  }

// --- БЕЗОПАСНЫЙ РАСЧЕТ УРОВНЯ (ФРОНТЕНД) ---
  const totalXp = currentUser.total_xp || 0;
  const currentLevel = Math.floor(totalXp / 350) + 1; // Всегда честно берём из XP, игнорируя старый левел из БД

  // 1. Опыт, с которого начался текущий уровень
  const xpAtCurrentLevelStart = Math.max(0, (currentLevel - 1) * 350);

  // 2. Опыт, набранный именно на текущем уровне
  const currentLevelXP = Math.max(0, totalXp - xpAtCurrentLevelStart);

  // 3. Процент заполнения шкалы (строго от 0 до 100)
  const progress = Math.max(0, Math.min((currentLevelXP / 350) * 100, 100));
  
  // 4. Опыт до следующего уровня
  const xpToNextLevel = Math.max(0, 350 - currentLevelXP);

  // Статистика достижений
  const stats = {
    projects: achievements.filter(a => a.event_type === 'HACKATHON').length,
    olympiads: achievements.filter(a => a.event_type === 'OLYMPIAD').length,
    courses: achievements.filter(a => a.event_type === 'COURSE').length,
    hackathons: achievements.filter(a => a.event_type === 'SPORT_ART').length,
    volunteering: achievements.filter(a => a.event_type === 'VOLUNTEERING').length,
  };

  // --- ЛОГИКА ДЛЯ НАГРАД (ПОСЛЕДНИЕ 4 ШТУКИ) ---
  const userBadges = currentUser.earned_badges || [];
  
  const latestBadges = [...userBadges]
    .sort((a: any, b: any) => new Date(b.earned_at || b.created_at || 0).getTime() - new Date(a.earned_at || a.created_at || 0).getTime())
    .slice(0, 4)
    .map((earnedBadge: any) => {
      // Ищем иконку в нашем главном списке. Добавлено (b: any) для TS
      const badgeInfo = ALL_BADGES.find((b: any) => b.name === (earnedBadge.badge_name || earnedBadge.name));
      return {
        ...earnedBadge,
        icon: badgeInfo?.icon || '🏆',
      };
    });

  const recentAchievements = achievements.slice(0, 6);

  const verifiedAchievements = achievements.filter(a => a.status === 'VERIFIED');
  const verifiedProjectsCount = verifiedAchievements.length;

  // Сортируем навыки по популярности (по кол-ву проектов)
  const skillsWithCounts = allSkills.map(skill => {
    const count = verifiedAchievements.filter(ach => 
      ach.skill_names?.includes(skill.name) || ach.skills?.some((s: any) => typeof s === 'object' && s.name === skill.name)
    ).length;
    return { ...skill, count };
  });

  const displaySkills = [...skillsWithCounts].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-fade-in">
      
      {/* === HEADER: ПРОЗРАЧНО-ГОЛУБОЙ === */}
      {/* ИСПРАВЛЕНИЕ: Добавлен z-50, чтобы хедер был выше контента */}
      <div className="relative z-50 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-cyan-500/20 border border-blue-500/30 rounded-3xl p-8 text-white animate-fade-in-up shadow-lg shadow-blue-900/20 backdrop-blur-sm overflow-visible">
        
        {/* Фоновое свечение */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-500/30 animate-scale-in">
              {currentUser.first_name?.[0]}{currentUser.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 animate-fade-in-up delay-100">
                {currentUser.first_name} {currentUser.last_name}
              </h1>
              <div className="flex items-center gap-3 text-blue-200 text-sm flex-wrap animate-fade-in-up delay-200">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  Студент • {currentUser.course || '1'} курс
                </span>
                <span className="text-blue-400/50">•</span>
                <span>{currentUser.educational_institution || 'Факультет ИТ'}</span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-blue-300/60 animate-fade-in-up delay-300">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-blue-400" />
                  Уровень {currentLevel}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  {achievements.filter(a => a.status === 'VERIFIED').length} верифицированных навыков
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-yellow-400" />
                  {achievements.length} достижений
                </span>
              </div>
            </div>
          </div>

          {/* Кнопки действий справа */}
          <div className="flex items-center gap-3 animate-fade-in-up delay-400">
            {/* Кнопка Связаться */}
            <div className="relative">
              <button 
                onClick={() => setShowContactPopup(!showContactPopup)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl text-sm font-medium transition-all hover:text-blue-200"
              >
                <MessageCircle className="w-4 h-4" />
                Связаться
              </button>

              {/* Всплывающее окно с почтой */}
              {/* ИСПРАВЛЕНИЕ: z-[60] ставит окно выше остального контента */}
              {showContactPopup && (
                <div className="absolute right-0 top-full mt-3 w-72 p-4 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-cyan-500/20 border border-blue-500/30 backdrop-blur-md rounded-xl shadow-xl animate-fade-in-up z-[60]">
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-blue-300/70 uppercase tracking-wider font-semibold mb-1">
                      Контактная информация
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-gray-400 block mb-0.5">Почта:</span>
                        <span className="text-sm text-white font-medium break-all">
                          {currentUser.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Стрелочка сверху */}
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border-l border-t border-blue-500/30 rotate-45"></div>
                </div>
              )}
            </div>

            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl text-sm font-medium transition-all hidden md:block">
              Скачать PDF
            </button>
          </div>
        </div>
      </div>

      {/* === ОСНОВНОЙ КОНТЕНТ: СЕТКА === */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Прогресс развития */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-100">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Прогресс развития
            </h3>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Уровень {currentLevel}</span>
                <span className="text-sm text-blue-400 font-bold">{totalXp} XP</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 animate-fade-in delay-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                До следующего уровня: {xpToNextLevel} XP
              </p>
            </div>
          </div>

          {/* Статистика активности */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-200">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Статистика активности
            </h3>
            
            <div className="space-y-3">
              {[
                { label: 'Проекты', value: stats.projects, color: 'text-blue-500' },
                { label: 'Олимпиады', value: stats.olympiads, color: 'text-purple-500' },
                { label: 'Пройденные курсы', value: stats.courses, color: 'text-cyan-400' },
                { label: 'Хакатоны', value: stats.hackathons, color: 'text-green-500' },
                { label: 'Волонтерство', value: stats.volunteering, color: 'text-yellow-500' },
              ].map((stat, index) => (
                <div key={stat.label} className="flex items-center justify-between group animate-fade-in" style={{ animationDelay: `${0.3 + (index * 0.1)}s` }}>
                  <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{stat.label}</span>
                  <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Награды */}
          <div 
            onClick={() => navigate('/achievements?tab=badges')}
            className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-blue-500/30 transition-all group animate-fade-in-up delay-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                Награды
              </h3>
              <span className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors flex items-center gap-1">
                Смотреть все <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {latestBadges.length > 0 ? (
                // Если награды есть, выводим реальные данные
                latestBadges.map((badge: any, index: number) => (
                  <div 
                    key={badge.id || index}
                    className="aspect-square bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform animate-scale-in relative group/badge"
                    style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}
                  >
                    {badge.icon || '🏆'}
                    
                    {/* Всплывающая подсказка с названием */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg border border-gray-700">
                      {badge.badge_name || badge.name}
                    </div>
                  </div>
                ))
              ) : (
                // Если наград еще нет, выводим 4 серые заглушки
                [1, 2, 3, 4].map((item, index) => (
                  <div 
                    key={item}
                    className="aspect-square bg-gray-800/30 border border-gray-800/50 rounded-full flex items-center justify-center text-2xl animate-scale-in grayscale opacity-30"
                    style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}
                  >
                    🏆
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Верифицированные навыки */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-200">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Верифицированные навыки
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {displaySkills.slice(0, 6).map((skill: any, index: number) => (
                <div 
                  key={skill.name}
                  className="flex items-center justify-between p-3 bg-[#0f1419]/50 rounded-xl hover:bg-[#0f1419] transition-colors animate-fade-in"
                  style={{ animationDelay: `${0.3 + (index * 0.1)}s` }}
                >
                  <span className="text-sm text-gray-300">{skill.name}</span>
                  <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-500">{skill.category_name}</span>
                </div>
              ))}
            </div>

            <button className="text-sm text-blue-500 hover:text-blue-400 font-medium flex items-center gap-1 transition-colors mb-6">
              Посмотреть все <ArrowRight className="w-4 h-4" />
            </button>

            {/* Уровень владения */}
            <div className="border-t border-gray-800 pt-6">
              <h4 className="text-sm font-semibold text-gray-300 mb-4">Уровень владения</h4>
              
              {displaySkills.length === 0 && (
                <p className="text-xs text-gray-500">Добавьте подтвержденные достижения, чтобы увидеть развитие навыков.</p>
              )}

              <div className="space-y-4">
                {displaySkills.slice(0, 5).map((skill: any, index: number) => {
                  const skillProjectsCount = skill.count;
                  const skillProgress = verifiedProjectsCount > 0 ? (skillProjectsCount / verifiedProjectsCount) * 100 : 0;

                  return (
                    <div key={skill.name} className="animate-fade-in" style={{ animationDelay: `${0.5 + (index * 0.1)}s` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">
                          {skill.name}
                        </span>
                        <span className="text-xs font-medium text-blue-400">{skillProjectsCount} / {verifiedProjectsCount} проектов</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
                          style={{ width: `${skillProgress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Верифицированные достижения */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Верифицированные достижения
              </h3>
              <button 
                onClick={() => navigate('/achievements')}
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
              >
                Смотреть все <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentAchievements.length > 0 ? (
              <div className="space-y-3">
                {recentAchievements.map((achievement, index) => (
                  <div 
                    key={achievement.id}
                    onClick={() => navigate(`/achievements/${achievement.id}`)}
                    className="bg-[#0f1419]/50 border border-gray-800/50 rounded-xl p-4 hover:border-blue-500/30 hover:bg-[#0f1419] transition-all group cursor-pointer animate-fade-in-up"
                    style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                          {achievement.title}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {achievement.skill_names && achievement.skill_names.slice(0, 2).map((skill: any, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-800 rounded text-[10px] text-gray-500">
                              {typeof skill === 'object' ? skill.name : skill}
                            </span>
                          ))}
                          <span className="text-[10px] text-gray-600">
                            {new Date(achievement.created).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${
                        achievement.status === 'VERIFIED'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : achievement.status === 'PENDING'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {achievement.status === 'VERIFIED' ? '✓ Подтверждено' : 
                        achievement.status === 'PENDING' ? '○ На проверке' : '✕ Отклонено'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 animate-fade-in">
                <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Пока нет достижений</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
