// frontend/src/pages/EmployerStudentSkillsPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Code, Briefcase, Loader2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { skillAPI, achievementAPI, userAPI } from '../api/client';
import type { SkillProfile, SkillCategory, Skill, Achievement, User } from '../types';

export default function EmployerStudentSkillsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [profiles, setProfiles] = useState<SkillProfile[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [activeCategoryName, setActiveCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Загружаем данные параллельно
        const [userRes, achRes, skillsRes, profilesRes, catRes] = await Promise.all([
          userAPI.getById(Number(id)),
          achievementAPI.getAll({ student: Number(id), status: 'VERIFIED' }),
          skillAPI.getAll(),
          skillAPI.getProfiles(),
          skillAPI.getCategories()
        ]);

        setStudent(userRes.data);
        setAchievements(achRes.data);
        setAllSkills(skillsRes.data);
        setProfiles(profilesRes.data);
        setCategories(catRes.data);

        if (profilesRes.data.length > 0) {
          setActiveProfileId(profilesRes.data[0].id);
        }
        
        // Небольшая задержка для анимации появления
        setTimeout(() => setIsLoaded(true), 100);
      } catch (error) {
        console.error("Error fetching skills tracking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Студент не найден</p>
      </div>
    );
  }

  const verifiedAchievements = achievements.filter(a => a.status === 'VERIFIED');
  const totalProjects = achievements.length; // Всего достижений (для контекста)
  const verifiedProjectsCount = verifiedAchievements.length;

  // Подсчитываем проекты для всех навыков
  const skillsWithCounts = allSkills.map(skill => {
    const count = verifiedAchievements.filter(ach =>
      ach.skill_names?.includes(skill.name) || ach.skills?.some((s: any) => typeof s === 'object' && s.name === skill.name)
    ).length;
    return { ...skill, count };
  });

  // Фильтруем категории по активному профилю
  const activeProfileCategories = categories.filter(c => c.profile === activeProfileId);
  const activeProfileCategoryNames = activeProfileCategories.map(c => c.name);

  // Навыки, относящиеся к активному профилю
  const activeProfileSkills = skillsWithCounts.filter(s => activeProfileCategoryNames.includes(s.category_name));
  const displaySkills = activeProfileSkills
    .filter(s => activeCategoryName ? s.category_name === activeCategoryName : true)
    .sort((a, b) => b.count - a.count);

  // Подготавливаем данные для Радар-графика
  const radarData = activeProfileCategories.map(category => {
    const userSkillsInCategory = activeProfileSkills.filter(comp => comp.category_name === category.name && comp.count > 0);
    const categoryScore = Math.min(userSkillsInCategory.length * 20, 100);
    return {
      subject: category.name,
      A: categoryScore,
      fullMark: 100
    };
  });

  // --- КОМПОНЕНТЫ ГРАФИКА (как в SkillsPage.tsx) ---

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a2332] border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-white font-medium text-sm mb-1">{data.subject}</p>
          <p className="text-cyan-400 text-xs">Прогресс: <span className="text-white">{Math.round(data.A)}%</span></p>
        </div>
      );
    }
    return null;
  };

  const CustomTick = ({ payload, x, y, textAnchor }: any) => {
    const isSelected = payload.value === activeCategoryName;
    const words = payload.value.split(' ');
    const isLongLabel = payload.value.length > 15;
    
    return (
      <g>
        {isLongLabel && words.length >= 2 ? (
          <>
            <text x={x} y={y - 8} textAnchor={textAnchor} className={`cursor-pointer transition-all duration-300 text-[10px] sm:text-xs font-medium ${isSelected ? 'fill-cyan-400' : 'fill-gray-400 hover:fill-white'}`} onClick={() => setActiveCategoryName(activeCategoryName === payload.value ? null : payload.value)}>
              {words.slice(0, Math.ceil(words.length / 2)).join(' ')}
            </text>
            <text x={x} y={y + 8} textAnchor={textAnchor} className={`cursor-pointer transition-all duration-300 text-[10px] sm:text-xs font-medium ${isSelected ? 'fill-cyan-400' : 'fill-gray-400 hover:fill-white'}`} onClick={() => setActiveCategoryName(activeCategoryName === payload.value ? null : payload.value)}>
              {words.slice(Math.ceil(words.length / 2)).join(' ')}
            </text>
          </>
        ) : (
          <text x={x} y={y} dy={4} textAnchor={textAnchor} className={`cursor-pointer transition-all duration-300 text-[10px] sm:text-xs font-medium ${isSelected ? 'fill-cyan-400' : 'fill-gray-400 hover:fill-white'}`} onClick={() => setActiveCategoryName(activeCategoryName === payload.value ? null : payload.value)}>
            {payload.value}
          </text>
        )}
      </g>
    );
  };

  const studentName = `${student.first_name || student.username} ${student.last_name || ''}`.trim();

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in px-4 md:px-0">
      
      {/* Header */}
      <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <button
          onClick={() => navigate(`/employer/students/${id}`)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-3 md:mb-6 transition-colors text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          Вернуться в профиль
        </button>
        <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">Трекинг навыков: {studentName}</h1>
        <p className="text-gray-500 text-sm md:text-base">Детальная аналитика по компетенциям и проектам кандидата</p>
      </div>

      {/* Переключение профилей */}
      <div className={`flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto scrollbar-hide transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {profiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => { setActiveProfileId(profile.id); setActiveCategoryName(null); }}
            className={`px-3 py-2 md:px-4 md:py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0 text-sm md:text-base ${
              activeProfileId === profile.id 
                ? 'bg-[#1a2332] text-blue-400 border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            {profile.name}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`bg-[#1a2332] border border-gray-800 rounded-xl p-4 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">Навыков</span>
          </div>
          <p className="text-2xl font-bold text-white">{activeProfileSkills.length}</p>
        </div>

        <div className={`bg-[#1a2332] border border-gray-800 rounded-xl p-4 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-gray-400 text-sm">Одобрено проектов</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {verifiedProjectsCount} <span className="text-base text-gray-500 font-normal">/ {totalProjects}</span>
          </p>
        </div>
      </div>

      {/* Main Content Grid - ПОМЕНЯЛИ МЕСТАМИ: Сначала График, потом Список */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Radar Chart - Карта компетенций (Теперь слева/сверху) */}
        <div className={`bg-[#1a2332] border border-gray-800 rounded-xl p-4 md:p-6 transition-all duration-700 delay-400 relative ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-lg font-semibold text-white mb-4">Карта компетенций</h2>
          {activeProfileCategories.length === 0 ? (
            <div className="h-64 sm:h-80 flex items-center justify-center text-gray-500">Нет категорий в этом профиле</div>
          ) : (
            <>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <defs>
                      <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="#374151" strokeWidth={1} strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={<CustomTick />} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Radar
                      name="Профиль навыков"
                      dataKey="A"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#colorA)"
                      fillOpacity={1}
                      dot={{ r: 4, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 1.5 }}
                      activeDot={{ r: 6, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Skills Progress - Список навыков (Теперь справа/снизу) */}
        <div className={`bg-[#1a2332] border border-gray-800 rounded-xl p-4 md:p-6 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-lg font-semibold text-white mb-4 md:mb-6">
            Уровень владения навыками {activeCategoryName && <span className="text-cyan-400 text-sm ml-2">({activeCategoryName})</span>}
          </h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {activeProfileSkills.length === 0 && (
              <div className="text-center py-8 text-gray-500">В этом профиле пока нет навыков.</div>
            )}
            {displaySkills.map((skill: any, index: number) => {
              const skillProjectsCount = skill.count;
              const skillProgress = verifiedProjectsCount > 0 ? (skillProjectsCount / verifiedProjectsCount) * 100 : 0;
              return (
                <div key={skill.id} className="transition-all duration-500" style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateX(0)' : 'translateX(-20px)', transitionDelay: `${0.4 + (index * 0.05)}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-200 font-medium text-sm truncate mr-2">{skill.name}</span>
                    <span className="text-xs md:text-sm font-medium text-cyan-400 flex-shrink-0">{skillProjectsCount} / {verifiedProjectsCount} проектов</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000" 
                      style={{ width: isLoaded ? `${skillProgress}%` : '0%', transitionDelay: `${0.6 + (index * 0.05)}s` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}