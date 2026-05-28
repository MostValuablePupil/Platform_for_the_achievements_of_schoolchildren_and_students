// frontend/src/pages/ProfilePage.tsx
import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Award, CheckCircle2, GraduationCap, Mail, ArrowUpRight, ArrowRight, BarChart3, Activity, MessageCircle, Settings, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const { currentUser, achievements, fetchCurrentUser, fetchAchievements, skills: allSkills, fetchSkills, updateProfile } = useGameStore();
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const contactPopupRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    educational_institution: '',
    future_profession: '',
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showContactPopup && 
        contactPopupRef.current && 
        !contactPopupRef.current.contains(event.target as Node)
      ) {
        const contactButton = document.querySelector('[data-contact-button]');
        if (contactButton && !contactButton.contains(event.target as Node)) {
          setShowContactPopup(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContactPopup]);

  const handleOpenEditModal = () => {
    if (!currentUser) return;
    setEditFormData({
      first_name: currentUser.first_name || '',
      last_name: currentUser.last_name || '',
      educational_institution: currentUser.educational_institution || '',
      future_profession: currentUser.future_profession || '',
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      setIsSaving(true);
      await updateProfile(currentUser.id, editFormData);
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении профиля');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchCurrentUser(currentUser.id);
      fetchAchievements({ student: currentUser.id });
    }
    if (allSkills.length === 0) fetchSkills();
  }, [currentUser?.id]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f1419]">
        <div className="text-gray-500">Загрузка профиля...</div>
      </div>
    );
  }

  const totalXp = currentUser.total_xp || 0;
  const currentLevel = Math.floor(totalXp / 350) + 1;
  const xpAtCurrentLevelStart = Math.max(0, (currentLevel - 1) * 350);
  const currentLevelXP = Math.max(0, totalXp - xpAtCurrentLevelStart);
  const progress = Math.max(0, Math.min((currentLevelXP / 350) * 100, 100));
  const xpToNextLevel = Math.max(0, 350 - currentLevelXP);

  const stats = {
    projects: achievements.filter(a => a.event_type === 'HACKATHON').length,
    olympiads: achievements.filter(a => a.event_type === 'OLYMPIAD').length,
    courses: achievements.filter(a => a.event_type === 'COURSE').length,
    hackathons: achievements.filter(a => a.event_type === 'SPORT_ART').length,
    volunteering: achievements.filter(a => a.event_type === 'VOLUNTEERING').length,
  };

  const userBadges = currentUser.earned_badges || [];
  const latestBadges = [...userBadges]
    .sort((a: any, b: any) => new Date(b.earned_at || b.created_at || 0).getTime() - new Date(a.earned_at || a.created_at || 0).getTime())
    .slice(0, 4)
    .map((earnedBadge: any) => {
      const badgeInfo = ALL_BADGES.find((b: any) => b.name === (earnedBadge.badge_name || earnedBadge.name));
      return { ...earnedBadge, icon: badgeInfo?.icon || '🏆' };
    });

  const recentAchievements = achievements.slice(0, 6);
  const verifiedAchievements = achievements.filter(a => a.status === 'VERIFIED');
  const verifiedProjectsCount = verifiedAchievements.length;

  const verifiedSkillsMap = new Map<string, { name: string; category: string; count: number }>();
  verifiedAchievements.forEach(achievement => {
    if (achievement.skill_names) {
      achievement.skill_names.forEach((skillName: string) => {
        const skill = allSkills.find(s => s.name === skillName);
        const category = skill?.category_name || 'Без категории';
        if (verifiedSkillsMap.has(skillName)) {
          const existing = verifiedSkillsMap.get(skillName)!;
          verifiedSkillsMap.set(skillName, { ...existing, count: existing.count + 1 });
        } else {
          verifiedSkillsMap.set(skillName, { name: skillName, category, count: 1 });
        }
      });
    }
  });
  const verifiedSkills = Array.from(verifiedSkillsMap.values()).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 animate-fade-in px-4 md:px-0">
      
      {/* === МОБИЛЬНАЯ ШАПКА === */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-4 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
              {currentUser.first_name?.[0]}{currentUser.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{currentUser.first_name} {currentUser.last_name}</h1>
              <p className="text-xs text-blue-200 truncate">{currentUser.educational_institution || 'Факультет ИТ'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-blue-300/60 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-blue-400" /> Ур. {currentLevel}
                </span>
                <span className="text-[10px] text-green-400/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-400" /> {verifiedProjectsCount} достижений
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleOpenEditModal} className="p-2 bg-white/5 rounded-lg">
              <Settings className="w-4 h-4 text-gray-300" />
            </button>
            <div className="relative" ref={contactPopupRef}>
              <button 
                data-contact-button
                onClick={() => setShowContactPopup(!showContactPopup)}
                className="p-2 bg-white/5 rounded-lg"
              >
                <MessageCircle className="w-4 h-4 text-gray-300" />
              </button>
              {showContactPopup && currentUser?.email && (
                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-[#1a2332] border border-gray-700 backdrop-blur-md rounded-xl shadow-xl z-[60]">
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-blue-300/70 uppercase tracking-wider font-semibold mb-1">Контактная информация</div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-gray-400 block mb-0.5">Почта:</span>
                        <span className="text-sm text-white font-medium break-all">{currentUser.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#1a2332] border-l border-t border-gray-700 rotate-45"></div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-blue-200 mb-1">
            <span>XP: {totalXp}</span>
            <span>До ур. {currentLevel + 1}: {xpToNextLevel}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* === МОБИЛЬНАЯ СТАТИСТИКА (в одну строку без иконок) === */}
      <div className="lg:hidden bg-[#1a2332] border border-gray-800 rounded-2xl p-3 animate-fade-in-up delay-100">
        <h3 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-2">
          <Activity className="w-3 h-3 text-cyan-400" />
          Статистика
        </h3>
        <div className="flex justify-between gap-2">
          {[
            { label: 'Проекты', value: stats.projects, color: 'text-blue-400' },
            { label: 'Олимпиады', value: stats.olympiads, color: 'text-purple-400' },
            { label: 'Курсы', value: stats.courses, color: 'text-cyan-400' },
            { label: 'Хакатоны', value: stats.hackathons, color: 'text-green-400' },
            { label: 'Волонтерство', value: stats.volunteering, color: 'text-yellow-400' },
          ].map((stat, i) => (
            <div key={i} className="flex-1 text-center">
              <div className={`text-sm font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[9px] text-gray-500 truncate">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* === МОБИЛЬНЫЕ НАГРАДЫ === */}
      <div 
        className="lg:hidden bg-[#1a2332] border border-gray-800 rounded-2xl p-4 animate-fade-in-up delay-200"
        onClick={() => navigate('/achievements?tab=badges')}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-2">
            <Award className="w-3 h-3 text-yellow-400" />
            Награды
          </h3>
          <span className="text-[10px] text-blue-400 flex items-center gap-1">
            Смотреть все <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {latestBadges.length > 0 ? (
            latestBadges.map((badge: any, index: number) => (
              <div key={index} className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-xl">
                {badge.icon || '🏆'}
              </div>
            ))
          ) : (
            [1, 2, 3, 4].map((item) => (
              <div key={item} className="flex-shrink-0 w-14 h-14 bg-gray-800/30 rounded-full flex items-center justify-center text-xl opacity-30 grayscale">
                🏆
              </div>
            ))
          )}
        </div>
      </div>

      {/* === МОБИЛЬНЫЕ ДОСТИЖЕНИЯ === */}
      <div className="lg:hidden bg-[#1a2332] border border-gray-800 rounded-2xl p-4 animate-fade-in-up delay-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-2">
            <Trophy className="w-3 h-3 text-yellow-400" />
            Достижения
          </h3>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate('/achievements');
            }}
            className="text-[10px] text-blue-400 flex items-center gap-1"
          >
            Все <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {recentAchievements.length > 0 ? (
          <div className="space-y-2">
            {recentAchievements.slice(0, 3).map((achievement, index) => (
              <div 
                key={achievement.id}
                onClick={() => navigate(`/achievements/${achievement.id}`)}
                className="bg-[#0f1419]/50 border border-gray-800/50 rounded-xl p-3 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <h4 className="text-xs font-semibold text-white line-clamp-1 flex-1 mr-2">
                    {achievement.title}
                  </h4>
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium whitespace-nowrap ${
                    achievement.status === 'VERIFIED'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : achievement.status === 'PENDING'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {achievement.status === 'VERIFIED' ? '✓' : achievement.status === 'PENDING' ? '○' : '✕'}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 line-clamp-2 mb-1.5">
                  {achievement.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-400 font-medium">
                    +{achievement.points} XP
                  </span>
                  <span className="text-[9px] text-gray-600">
                    {new Date(achievement.created).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-gray-500 text-center py-4">Пока нет достижений</p>
        )}
      </div>

      {/* === ДЕСКТОПНАЯ ВЕРСИЯ === */}
      <div className="hidden lg:block">
        <div className="relative z-50 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-cyan-500/20 border border-blue-500/30 rounded-3xl p-8 text-white animate-fade-in-up shadow-lg shadow-blue-900/20 backdrop-blur-sm overflow-visible">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-500/30 animate-scale-in">
                {currentUser.first_name?.[0]}{currentUser.last_name?.[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2 animate-fade-in-up delay-100">{currentUser.first_name} {currentUser.last_name}</h1>
                <div className="flex items-center gap-3 text-blue-200 text-sm flex-wrap animate-fade-in-up delay-200">
                  <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" />Студент • {currentUser.course || '1'} курс</span>
                  <span className="text-blue-400/50">•</span>
                  <span>{currentUser.educational_institution || 'Факультет ИТ'}</span>
                </div>
                {currentUser.future_profession && (
                  <div className="text-sm text-cyan-400 mt-1 animate-fade-in-up delay-200">Цель: {currentUser.future_profession}</div>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-blue-300/60 animate-fade-in-up delay-300">
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-blue-400" />Уровень {currentLevel}</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-400" />{verifiedProjectsCount} достижений</span>
                  <span className="flex items-center gap-1"><Award className="w-3 h-3 text-yellow-400" />{achievements.length} достижений</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 animate-fade-in-up delay-400">
              <button onClick={handleOpenEditModal} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl text-gray-300 hover:text-white transition-all" title="Настройки профиля"><Settings className="w-5 h-5" /></button>
              <div className="relative" ref={contactPopupRef}>
                <button data-contact-button onClick={() => setShowContactPopup(!showContactPopup)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl text-sm font-medium transition-all hover:text-blue-200"><MessageCircle className="w-4 h-4" />Связаться</button>
                {showContactPopup && (
                  <div className="absolute right-0 top-full mt-3 w-72 p-4 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-cyan-500/20 border border-blue-500/30 backdrop-blur-md rounded-xl shadow-xl animate-fade-in-up z-[60]">
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-blue-300/70 uppercase tracking-wider font-semibold mb-1">Контактная информация</div>
                      <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" /><div><span className="text-xs text-gray-400 block mb-0.5">Почта:</span><span className="text-sm text-white font-medium break-all">{currentUser.email}</span></div></div>
                    </div>
                    <div className="absolute -top-1.5 right-4 w-3 h-3 bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border-l border-t border-blue-500/30 rotate-45"></div>
                  </div>
                )}
              </div>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl text-sm font-medium transition-all hidden md:block">Скачать PDF</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mt-6">
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-100">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400" />Прогресс развития</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-400">Уровень {currentLevel}</span><span className="text-sm text-blue-400 font-bold">{totalXp} XP</span></div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 animate-fade-in delay-500" style={{ width: `${progress}%` }} /></div>
                <p className="text-xs text-gray-500 mt-2">До следующего уровня: {xpToNextLevel} XP</p>
              </div>
            </div>
            <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-200">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400" />Статистика активности</h3>
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
            <div onClick={() => navigate('/achievements?tab=badges')} className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-blue-500/30 transition-all group animate-fade-in-up delay-300">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" />Награды</h3><span className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors flex items-center gap-1">Смотреть все <ArrowUpRight className="w-3 h-3" /></span></div>
              <div className="grid grid-cols-4 gap-3">
                {latestBadges.length > 0 ? latestBadges.map((badge: any, index: number) => (
                  <div key={badge.id || index} className="aspect-square bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform animate-scale-in relative group/badge" style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}>
                    {badge.icon || '🏆'}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg border border-gray-700">{badge.badge_name || badge.name}</div>
                  </div>
                )) : [1, 2, 3, 4].map((item, index) => (
                  <div key={item} className="aspect-square bg-gray-800/30 border border-gray-800/50 rounded-full flex items-center justify-center text-2xl animate-scale-in grayscale opacity-30" style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}>🏆</div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* ✅ УДАЛЕНО: Блок "Верифицированные навыки" */}

            <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-300">
              <div className="flex items-center justify-between mb-6"><h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" />Верифицированные достижения</h3><button onClick={() => navigate('/achievements')} className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">Смотреть все <ArrowRight className="w-3 h-3" /></button></div>
              {recentAchievements.length > 0 ? (
                <div className="space-y-3">
                  {recentAchievements.map((achievement, index) => (
                    <div key={achievement.id} onClick={() => navigate(`/achievements/${achievement.id}`)} className="bg-[#0f1419]/50 border border-gray-800/50 rounded-xl p-4 hover:border-blue-500/30 hover:bg-[#0f1419] transition-all group cursor-pointer animate-fade-in-up" style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">{achievement.title}</h4>
                          <p className="text-xs text-gray-400 line-clamp-2 mb-2">{achievement.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {achievement.skill_names && achievement.skill_names.slice(0, 2).map((skill: any, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-800 rounded text-[10px] text-gray-500">{typeof skill === 'object' ? skill.name : skill}</span>
                            ))}
                            <span className="text-[10px] text-gray-600">{new Date(achievement.created).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${achievement.status === 'VERIFIED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : achievement.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                          {achievement.status === 'VERIFIED' ? '✓ Подтверждено' : achievement.status === 'PENDING' ? '○ На проверке' : '✕ Отклонено'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 animate-fade-in"><Trophy className="w-12 h-12 text-gray-700 mx-auto mb-3" /><p className="text-gray-500 text-sm">Пока нет достижений</p></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === МОДАЛЬНОЕ ОКНО === */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-800"><h2 className="text-xl font-bold text-white">Редактирование профиля</h2><button onClick={() => setIsEditingProfile(false)} className="text-gray-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm text-gray-400 mb-1">Имя</label><input type="text" autoComplete="off" value={editFormData.first_name} onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div><div><label className="block text-sm text-gray-400 mb-1">Фамилия</label><input type="text" autoComplete="off" value={editFormData.last_name} onChange={e => setEditFormData({...editFormData, last_name: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" /></div></div>
              <div><label className="block text-sm text-gray-400 mb-1">Учебное заведение</label><input type="text" autoComplete="off" value={editFormData.educational_institution} onChange={e => setEditFormData({...editFormData, educational_institution: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="МГТУ им. Баумана" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Цель (Будущая профессия)</label><input type="text" autoComplete="off" value={editFormData.future_profession} onChange={e => setEditFormData({...editFormData, future_profession: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="Data Scientist" /></div>
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-800 mt-6"><button type="button" onClick={() => setIsEditingProfile(false)} className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors font-medium">Отмена</button><button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2">{isSaving && <Loader2 className="w-4 h-4 animate-spin" />}Сохранить</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}