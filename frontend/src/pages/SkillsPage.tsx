// frontend/src/pages/SkillsPage.tsx
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Code, Briefcase } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { skillAPI } from '../api/client';
import type { SkillProfile, SkillCategory } from '../types';

export default function SkillsPage() {
  const { achievements, skills: allSkills, fetchSkills } = useGameStore();

  const [profiles, setProfiles] = useState<SkillProfile[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [activeCategoryName, setActiveCategoryName] = useState<string | null>(null);

  useEffect(() => {
    // Получаем профили и категории
    skillAPI.getProfiles().then(res => {
      setProfiles(res.data);
      if (res.data.length > 0) setActiveProfileId(res.data[0].id);
    });
    skillAPI.getCategories().then(res => setCategories(res.data));
    
    if (allSkills.length === 0) {
      fetchSkills();
    }
  }, []);

  // Все проекты и подтвержденные
  const totalProjects = achievements.length;
  const verifiedAchievements = achievements.filter(a => a.status === 'VERIFIED');
  const verifiedProjectsCount = verifiedAchievements.length;

  // Подсчитываем проекты для всех навыков
  const skillsWithCounts = allSkills.map(skill => {
    const count = verifiedAchievements.filter(ach => 
      ach.skill_names?.includes(skill.name) || ach.skills?.includes(skill.name) || ach.skills?.some((s:any) => s.name === skill.name)
    ).length;
    return { ...skill, count };
  });

  // Фильтруем категории по активному профилю
  const activeProfileCategories = categories.filter(c => c.profile === activeProfileId);
  const activeProfileCategoryNames = activeProfileCategories.map(c => c.name);
  
  // Навыки, относящиеся к активному профилю
  const activeProfileSkills = skillsWithCounts.filter(s => activeProfileCategoryNames.includes(s.category_name));
  const displaySkills = activeProfileSkills.filter(s => activeCategoryName ? s.category_name === activeCategoryName : true).sort((a, b) => b.count - a.count);

  // Подготавливаем данные для Радар-графика
  const radarData = activeProfileCategories.map(category => {
    const userSkillsInCategory = activeProfileSkills.filter(comp => comp.category_name === category.name && comp.count > 0);
    
    // Считаем количество навыков в этой категории для Радара
    let categoryScore = Math.min(userSkillsInCategory.length * 20, 100); 

    return {
      subject: category.name,
      A: categoryScore,
      fullMark: 100
    };
  });

  // Кастомный компонент текста на осях графика (кликабельный)
  const CustomTick = ({ payload, x, y, textAnchor, stroke, radius }: any) => {
    const isSelected = payload.value === activeCategoryName;
    return (
      <text 
        radius={radius} 
        stroke={stroke} 
        x={x} 
        y={y} 
        className={`cursor-pointer transition-colors ${isSelected ? 'fill-yandex-blue font-bold' : 'fill-gray-400 font-medium hover:fill-yandex-cyan'}`}
        textAnchor={textAnchor} 
        onClick={() => {
          // Если кликаем по той же категории - сбрасываем фильтр
          if (activeCategoryName === payload.value) {
            setActiveCategoryName(null);
          } else {
            setActiveCategoryName(payload.value);
          }
        }}
      >
        {payload.value}
      </text>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Трекинг навыков</h1>
        <p className="text-gray-400">Отслеживайте развитие компетенций и получайте аналитику</p>
      </div>

      {/* Переключение профилей */}
      <div className="flex gap-4 border-b border-dark-600 pb-2">
        {profiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => {
              setActiveProfileId(profile.id);
              setActiveCategoryName(null); // Сбрасываем фильтр при смене профиля
            }}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeProfileId === profile.id
                ? 'bg-dark-800 text-yandex-blue border-b-2 border-yandex-blue'
                : 'text-gray-400 hover:text-gray-200 hover:bg-dark-800/50'
            }`}
          >
            {profile.name}
          </button>
        ))}
      </div>

      {/* Stats Grid (Только Навыки и Проекты) */}
      <div className="grid grid-cols-2 gap-6">
        <div className="stat-card animate-fade-in-up delay-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yandex-blue/20 rounded-lg flex items-center justify-center animate-scale-in delay-200">
              <Code className="w-5 h-5 text-yandex-blue" />
            </div>
            <span className="text-gray-400">Навыков</span>
          </div>
          <p className="text-3xl font-bold text-gray-100 animate-fade-in delay-300">
            {activeProfileSkills.length}
          </p>
        </div>

        <div className="stat-card animate-fade-in-up delay-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yandex-purple/20 rounded-lg flex items-center justify-center animate-scale-in delay-300">
              <Briefcase className="w-5 h-5 text-yandex-purple" />
            </div>
            <span className="text-gray-400">Одобрено проектов</span>
          </div>
          <p className="text-3xl font-bold text-gray-100 animate-fade-in delay-400">
            {verifiedProjectsCount} <span className="text-xl text-gray-500 font-normal">/ {totalProjects}</span>
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Skills Progress */}
        <div className="glass-card p-6 animate-fade-in-up delay-400">
          <h2 className="text-lg font-semibold text-gray-100 mb-6">
            Уровень владения навыками {activeCategoryName && <span className="text-yandex-cyan text-sm ml-2">({activeCategoryName})</span>}
          </h2>
          
          <div className="space-y-5">
            {activeProfileSkills.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                В этом профиле пока нет навыков.
              </div>
            )}
            
            {displaySkills.map((skill: any, index: number) => {
              const skillProjectsCount = skill.count;
              const skillProgress = verifiedProjectsCount > 0 ? (skillProjectsCount / verifiedProjectsCount) * 100 : 0;

              return (
                <div 
                  key={index} 
                  className="animate-fade-in" 
                  style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 font-medium">{skill.name}</span>
                    </div>
                    {/* Текст: X / Y проектов */}
                    <span className="text-sm font-medium text-yandex-cyan">
                      {skillProjectsCount} / {verifiedProjectsCount} проектов
                    </span>
                  </div>
                  
                  {/* Прогресс-бар с правильной шириной */}
                  <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yandex-blue to-yandex-cyan rounded-full transition-all duration-1000 animate-fade-in"
                      style={{ 
                        width: `${skillProgress}%`, 
                        animationDelay: `${0.3 + (index * 0.1)}s` 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass-card p-6 animate-fade-in-up delay-500 relative">
          <h2 className="text-lg font-semibold text-gray-100 mb-6">
            Карта компетенций
          </h2>
          {activeProfileCategories.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Нет категорий в этом профиле
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 absolute top-6 right-6">
                * Кликните на категорию для фильтрации
              </p>
              <div className="h-80 animate-scale-in delay-600">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={<CustomTick />} 
                    />
                    <Radar
                      name="Профиль навыков"
                      dataKey="A"
                      stroke="#005bff"
                      fill="#005bff"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
