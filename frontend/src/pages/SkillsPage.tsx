// frontend/src/pages/SkillsPage.tsx
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Code, Briefcase } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { skillAPI } from '../api/client';
import type { SkillProfile, SkillCategory } from '../types';

export default function SkillsPage() {
  const { achievements, skills: allSkills, fetchSkills } = useGameStore();
  const [profiles, setProfiles] = useState<SkillProfile[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [activeCategoryName, setActiveCategoryName] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    skillAPI.getProfiles().then(res => {
      setProfiles(res.data);
      if (res.data.length > 0) setActiveProfileId(res.data[0].id);
    });
    skillAPI.getCategories().then(res => setCategories(res.data));
    if (allSkills.length === 0) {
      fetchSkills();
    }
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  const totalProjects = achievements.length;
  const verifiedAchievements = achievements.filter(a => a.status === 'VERIFIED');
  const verifiedProjectsCount = verifiedAchievements.length;

  const skillsWithCounts = allSkills.map(skill => {
    const count = verifiedAchievements.filter(ach =>
      ach.skill_names?.includes(skill.name) || ach.skills?.some((s: any) => typeof s === 'object' && s.name === skill.name)
    ).length;
    return { ...skill, count };
  });

  const activeProfileCategories = categories.filter(c => c.profile === activeProfileId);
  const activeProfileCategoryNames = activeProfileCategories.map(c => c.name);
  const activeProfileSkills = skillsWithCounts.filter(s => activeProfileCategoryNames.includes(s.category_name));
  const displaySkills = activeProfileSkills
    .filter(s => activeCategoryName ? s.category_name === activeCategoryName : true)
    .sort((a, b) => b.count - a.count);

  const radarData = activeProfileCategories.map(category => {
    const userSkillsInCategory = activeProfileSkills.filter(comp => comp.category_name === category.name && comp.count > 0);
    const categoryScore = Math.min(userSkillsInCategory.length * 20, 100);
    return {
      subject: category.name,
      A: categoryScore,
      fullMark: 100
    };
  });

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
            <text x={x} y={y - 8} textAnchor={textAnchor} className={`cursor-pointer transition-all duration-300 text-xs font-medium ${isSelected ? 'fill-cyan-400' : 'fill-gray-400 hover:fill-white'}`} onClick={() => setActiveCategoryName(activeCategoryName === payload.value ? null : payload.value)}>
              {words.slice(0, Math.ceil(words.length / 2)).join(' ')}
            </text>
            <text x={x} y={y + 8} textAnchor={textAnchor} className={`cursor-pointer transition-all duration-300 text-xs font-medium ${isSelected ? 'fill-cyan-400' : 'fill-gray-400 hover:fill-white'}`} onClick={() => setActiveCategoryName(activeCategoryName === payload.value ? null : payload.value)}>
              {words.slice(Math.ceil(words.length / 2)).join(' ')}
            </text>
          </>
        ) : (
          <text x={x} y={y} dy={4} textAnchor={textAnchor} className={`cursor-pointer transition-all duration-300 text-xs font-medium ${isSelected ? 'fill-cyan-400' : 'fill-gray-400 hover:fill-white'}`} onClick={() => setActiveCategoryName(activeCategoryName === payload.value ? null : payload.value)}>
            {payload.value}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100 mb-1 sm:mb-2">Трекинг навыков</h1>
        <p className="text-gray-400">Отслеживайте развитие компетенций и получайте аналитику</p>
      </div>

      {/* Профили - исправленные стили */}
      <div className={`flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto scrollbar-hide transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {profiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => { setActiveProfileId(profile.id); setActiveCategoryName(null); }}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0 text-sm ${
              activeProfileId === profile.id 
                ? 'bg-[#1a2332] text-blue-400 border-b-2 border-blue-500' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            {profile.name}
          </button>
        ))}
      </div>

      {/* Stats Grid - исправленные стили */}
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

      {/* Main Content Grid - исправленная сетка */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart - карта компетенций */}
        <div className={`bg-[#1a2332] border border-gray-800 rounded-xl p-6 transition-all duration-700 delay-400 relative ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-lg font-semibold text-white mb-4">Карта компетенций</h2>
          {activeProfileCategories.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">Нет категорий в этом профиле</div>
          ) : (
            <>
              <div className="h-80">
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
        {/* Skills Progress - список навыков */}
        <div className={`bg-[#1a2332] border border-gray-800 rounded-xl p-6 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-lg font-semibold text-white mb-6">
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
                    <span className="text-gray-200 font-medium text-sm">{skill.name}</span>
                    <span className="text-sm font-medium text-cyan-400">{skillProjectsCount} / {verifiedProjectsCount} проектов</span>
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