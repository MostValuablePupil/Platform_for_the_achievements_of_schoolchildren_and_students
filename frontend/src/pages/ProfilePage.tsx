// frontend/src/pages/ProfilePage.tsx
import { useEffect, useState, useRef, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Award, CheckCircle2, GraduationCap, Mail, ArrowUpRight, ArrowRight, BarChart3, Activity, MessageCircle, Settings, X, Loader2, Medal, MapPin, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI, specialtyAPI } from '../api/client'; 
import type { User, Specialty } from '../types';
import CustomSelect from '../components/CustomSelect';

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
  
  // --- СОСТОЯНИЯ ДЛЯ ЛИДЕРБОРДА ---
  const [leaderboardUsers, setLeaderboardUsers] = useState<User[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  
  // Фильтры и сортировка
  const [sortBy, setSortBy] = useState<'xp' | 'achievements'>('xp');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('');
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterInstitution, setFilterInstitution] = useState<string>('');

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadData = async () => {
      setLeaderboardLoading(true);
      try {
        const specsRes = await specialtyAPI.getAll();
        setSpecialties(specsRes.data);
        await loadLeaderboard();
      } catch (err) {
        console.error("Ошибка загрузки данных", err);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadLeaderboard = async () => {
    try {
      const params: any = { sort_by: sortBy };
      
      if (currentUser?.specialty) {
        params.user_type = 'university';
      } else {
        params.user_type = 'school';
      }

      if (filterSpecialty) params.specialty = filterSpecialty;
      if (filterCourse) params.course = filterCourse;
      if (filterCity) params.city = filterCity;
      if (filterInstitution) params.educational_institution = filterInstitution;

      const res = await userAPI.getLeaderboard(params);
      setLeaderboardUsers(res.data);
    } catch (err) {
      console.error("Ошибка загрузки лидерборда", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadLeaderboard();
    }
  }, [sortBy, filterSpecialty, filterCourse, filterCity, filterInstitution, currentUser?.specialty]);

  const isUniversityStudent = !!currentUser?.specialty; 

  // --- Логика модальных окон ---
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const contactPopupRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    educational_institution: '',
    future_profession: '',
    birth_date: '',
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContactPopup && contactPopupRef.current && !contactPopupRef.current.contains(event.target as Node)) {
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
      middle_name: currentUser.middle_name || '',
      educational_institution: currentUser.educational_institution || '',
      future_profession: currentUser.future_profession || '',
      birth_date: currentUser.birth_date || '',
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
  const xpToNextLevel = 350 - (totalXp % 350);
  const progress = ((totalXp % 350) / 350) * 100;

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

  // Опции для селектов
  const specialtyOptions = useMemo(() => {
    return [
      { value: '', label: 'Все направления' },
      ...specialties.map(s => ({ value: String(s.id), label: `${s.code} — ${s.name}` }))
    ];
  }, [specialties]);

  const courseOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Все курсы' }];
    for (let i = 1; i <= 6; i++) {
      opts.push({ value: String(i), label: `${i} курс` });
    }
    return opts;
  }, []);

  const classOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Все классы' }];
    for (let i = 1; i <= 11; i++) {
      opts.push({ value: String(i), label: `${i} класс` });
    }
    return opts;
  }, []);

  const roleLabel = currentUser.specialty ? 'Студент' : 'Школьник';
  const courseLabel = currentUser.specialty ? 'курс' : 'класс';
  const institutionPlaceholder = currentUser.specialty ? 'Факультет ИТ' : 'Школа';

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 animate-fade-in px-4 md:px-0">
      
      {/* === ХЕДЕР ПРОФИЛЯ (Адаптивный) === */}
      <div className="relative z-50 bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-cyan-500/20 border border-blue-500/30 rounded-2xl md:rounded-3xl p-4 md:p-8 text-white animate-fade-in-up shadow-lg shadow-blue-900/20 backdrop-blur-sm overflow-visible">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4 md:gap-6">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold shadow-lg shadow-blue-500/30 animate-scale-in flex-shrink-0">
                  {currentUser.first_name?.[0]}{currentUser.last_name?.[0]}
               </div>
               <div>
                  <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2 animate-fade-in-up delay-100">{currentUser.first_name} {currentUser.last_name}</h1>
                  <div className="flex items-center gap-2 md:gap-3 text-blue-200 text-xs md:text-sm flex-wrap animate-fade-in-up delay-200">
                     <span className="flex items-center gap-1">
                       <GraduationCap className="w-3 h-3 md:w-4 md:h-4" />
                       {roleLabel} • {currentUser.course || '1'} {courseLabel}
                     </span>
                     <span className="text-blue-400/50 hidden md:inline">•</span>
                     <span>{currentUser.educational_institution || institutionPlaceholder}</span>
                  </div>
                  {currentUser.future_profession && (
                     <div className="text-xs md:text-sm text-cyan-400 mt-1 animate-fade-in-up delay-200">Цель: {currentUser.future_profession}</div>
                  )}
                  <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-3 text-[10px] md:text-xs text-blue-300/60 animate-fade-in-up delay-300">
                     <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />Уровень {currentLevel}</span>
                     <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{recentAchievements.filter(a => a.status === 'VERIFIED').length} дост.</span>
                  </div>
               </div>
            </div>
            
            {/* Кнопки действий */}
            <div className="flex items-center gap-2 md:gap-3 animate-fade-in-up delay-400 w-full md:w-auto justify-end">
               <button onClick={handleOpenEditModal} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl text-gray-300 hover:text-white transition-all" title="Настройки профиля"><Settings className="w-5 h-5" /></button>
               
               <div className="relative" ref={contactPopupRef}>
                  <button data-contact-button onClick={() => setShowContactPopup(!showContactPopup)} className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl text-xs md:text-sm font-medium transition-all hover:text-blue-200">
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Связаться</span>
                  </button>
                  {showContactPopup && (
                     <div className="absolute right-0 top-full mt-2 w-64 md:w-72 p-4 bg-[#1a2332] border border-blue-500/30 backdrop-blur-md rounded-xl shadow-xl animate-fade-in-up z-[60]">
                        <div className="flex flex-col gap-2">
                           <div className="text-[10px] md:text-xs text-blue-300/70 uppercase tracking-wider font-semibold mb-1">Контактная информация</div>
                           <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" /><div><span className="text-[10px] md:text-xs text-gray-400 block mb-0.5">Почта:</span><span className="text-xs md:text-sm text-white font-medium break-all">{currentUser.email}</span></div></div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* === ОСНОВНАЯ СЕТКА (Адаптивная: 1 колонка на мобильном, 12 на десктопе) === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mt-4 md:mt-6">
        
        {/* ЛЕВАЯ КОЛОНКА (Лидерборд + Прогресс) */}
        <div className="col-span-1 lg:col-span-4 space-y-4 md:space-y-6">
          
          {/* 1. ЛИДЕРБОРД */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-4 md:p-6 animate-fade-in-up delay-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Medal className="w-4 h-4 text-yellow-400" />
                Топ участников
              </h3>
              <div className="flex gap-2">
                 <button 
                  onClick={() => setSortBy('xp')}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${sortBy === 'xp' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                   По XP
                 </button>
                 <button 
                  onClick={() => setSortBy('achievements')}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${sortBy === 'achievements' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                   По наградам
                 </button>
              </div>
            </div>

            {/* ФИЛЬТРЫ */}
            <div className="mb-4 space-y-3">
               {isUniversityStudent ? (
                 <>
                   <CustomSelect label="" options={specialtyOptions} value={filterSpecialty} onChange={(val) => setFilterSpecialty(val)} placeholder="Направление" />
                   <CustomSelect label="" options={courseOptions} value={filterCourse} onChange={(val) => setFilterCourse(val)} placeholder="Курс" />
                 </>
               ) : (
                 <>
                   <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      <input type="text" placeholder="Город" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:border-blue-500 outline-none" />
                   </div>
                   <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      <input type="text" placeholder="Школа" value={filterInstitution} onChange={(e) => setFilterInstitution(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:border-blue-500 outline-none" />
                   </div>
                   <CustomSelect label="" options={classOptions} value={filterCourse} onChange={(val) => setFilterCourse(val)} placeholder="Класс" />
                 </>
               )}
            </div>

            {/* Список лидеров */}
            <div className="space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {leaderboardLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
              ) : leaderboardUsers.length > 0 ? (
                leaderboardUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                    <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' : index === 1 ? 'bg-gray-400/20 text-gray-300' : index === 2 ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500'}`}>
                      {index + 1}
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{user.first_name} {user.last_name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.educational_institution}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-blue-400">{user.total_xp} XP</p>
                      <p className="text-[10px] text-gray-500">{user.achievements_count} дост.</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">Нет участников</p>
              )}
            </div>
          </div>

          {/* 2. ПРОГРЕСС РАЗВИТИЯ */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-4 md:p-6 animate-fade-in-up delay-200">
             <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400" />Прогресс развития</h3>
             <div className="mb-2">
               <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-400">Уровень {currentLevel}</span><span className="text-sm text-blue-400 font-bold">{totalXp} XP</span></div>
               <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 animate-fade-in delay-500" style={{ width: `${progress}%` }} /></div>
               <p className="text-xs text-gray-500 mt-2">До следующего уровня: {xpToNextLevel} XP</p>
             </div>
          </div>

        </div>

        {/* ПРАВАЯ КОЛОНКА (Награды, Статистика, Достижения) */}
        <div className="col-span-1 lg:col-span-8 space-y-4 md:space-y-6">
          
          {/* 1. НАГРАДЫ */}
          <div onClick={() => navigate('/achievements?tab=badges')} className="bg-[#1a2332] border border-gray-800 rounded-2xl p-4 md:p-6 cursor-pointer hover:border-blue-500/30 transition-all group animate-fade-in-up delay-300">
             <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" />Награды</h3><span className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors flex items-center gap-1">Смотреть все <ArrowUpRight className="w-3 h-3" /></span></div>
             <div className="grid grid-cols-4 gap-2 md:gap-3">
               {latestBadges.length > 0 ? latestBadges.map((badge: any, index: number) => (
                 <div key={badge.id || index} className="aspect-square bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-xl md:text-2xl hover:scale-110 transition-transform animate-scale-in relative group/badge" style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}>
                   {badge.icon || '🏆'}
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg border border-gray-700">{badge.badge_name || badge.name}</div>
                 </div>
               )) : [1, 2, 3, 4].map((item, index) => (
                 <div key={item} className="aspect-square bg-gray-800/30 border border-gray-800/50 rounded-full flex items-center justify-center text-xl md:text-2xl animate-scale-in grayscale opacity-30" style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}>🏆</div>
               ))}
             </div>
          </div>

          {/* 2. СТАТИСТИКА АКТИВНОСТИ */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-4 md:p-6 animate-fade-in-up delay-200">
             <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400" />Статистика активности</h3>
             <div className="space-y-2 md:space-y-3">
               {[
                 { label: 'Проекты', value: stats.projects, color: 'text-blue-500' },
                 { label: 'Олимпиады', value: stats.olympiads, color: 'text-purple-500' },
                 { label: 'Курсы', value: stats.courses, color: 'text-cyan-400' },
                 { label: 'Хакатоны', value: stats.hackathons, color: 'text-green-500' },
                 { label: 'Волонтерство', value: stats.volunteering, color: 'text-yellow-500' },
               ].map((stat, index) => (
                 <div key={stat.label} className="flex items-center justify-between group animate-fade-in" style={{ animationDelay: `${0.3 + (index * 0.1)}s` }}>
                   <span className="text-xs md:text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{stat.label}</span>
                   <span className={`text-xs md:text-sm font-bold ${stat.color}`}>{stat.value}</span>
                 </div>
               ))}
             </div>
          </div>

          {/* 3. ВЕРИФИЦИРОВАННЫЕ ДОСТИЖЕНИЯ */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-4 md:p-6 animate-fade-in-up delay-300">
             <div className="flex items-center justify-between mb-4 md:mb-6"><h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" />Верифицированные достижения</h3><button onClick={() => navigate('/achievements')} className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">Смотреть все <ArrowRight className="w-3 h-3" /></button></div>
             {recentAchievements.length > 0 ? (
               <div className="space-y-3">
                 {recentAchievements.map((achievement, index) => (
                   <div key={achievement.id} onClick={() => navigate(`/achievements/${achievement.id}`)} className="bg-[#0f1419]/50 border border-gray-800/50 rounded-xl p-3 md:p-4 hover:border-blue-500/30 hover:bg-[#0f1419] transition-all group cursor-pointer animate-fade-in-up" style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}>
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
                       <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${achievement.status === 'VERIFIED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : achievement.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                         {achievement.status === 'VERIFIED' ? '✓ Подтверждено' : achievement.status === 'PENDING' ? '○ На проверке' : '✕ Отклонено'}
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-8 md:py-12 animate-fade-in"><Trophy className="w-10 h-10 md:w-12 md:h-12 text-gray-700 mx-auto mb-3" /><p className="text-gray-500 text-sm">Пока нет достижений</p></div>
             )}
          </div>

        </div>
      </div>

      {/* === МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ === */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-800"><h2 className="text-xl font-bold text-white">Редактирование профиля</h2><button onClick={() => setIsEditingProfile(false)} className="text-gray-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm text-gray-400 mb-1">Имя</label><input type="text" autoComplete="off" value={editFormData.first_name} onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none" /></div><div><label className="block text-sm text-gray-400 mb-1">Фамилия</label><input type="text" autoComplete="off" value={editFormData.last_name} onChange={e => setEditFormData({...editFormData, last_name: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none" /></div></div>
              <div><label className="block text-sm text-gray-400 mb-1">Отчество</label><input type="text" autoComplete="off" value={editFormData.middle_name} onChange={e => setEditFormData({...editFormData, middle_name: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none" placeholder="Иванович" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Учебное заведение</label><input type="text" autoComplete="off" value={editFormData.educational_institution} onChange={e => setEditFormData({...editFormData, educational_institution: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none" placeholder="МГТУ им. Баумана" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Цель (Будущая профессия)</label><input type="text" autoComplete="off" value={editFormData.future_profession} onChange={e => setEditFormData({...editFormData, future_profession: e.target.value})} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none" placeholder="Data Scientist" /></div>
              {currentUser.role === 'STUDENT' && (
                <div><label className="block text-sm text-gray-400 mb-1">Дата рождения</label><input type="date" value={editFormData.birth_date} onChange={e => setEditFormData({...editFormData, birth_date: e.target.value})} max={new Date().toISOString().split('T')[0]} className="w-full bg-[#0f1419] border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none" /></div>
              )}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-800 mt-2"><button type="button" onClick={() => setIsEditingProfile(false)} className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors font-medium">Отмена</button><button type="submit" disabled={isSaving} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2">{isSaving && <Loader2 className="w-4 h-4 animate-spin" />}Сохранить</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}