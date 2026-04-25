// frontend/src/pages/EmployerStudentSkillsPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Code, Briefcase, Loader2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
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

  const CustomTick = ({ payload, x, y, textAnchor, stroke, radius }: any) => {
    const isSelected = payload.value === activeCategoryName;
    return (
      <text 
        radius={radius} 
        stroke={stroke} 
        x={x} 
        y={y} 
        className={`cursor-pointer transition-colors ${isSelected ? 'fill-blue-500 font-bold' : 'fill-gray-400 font-medium hover:fill-cyan-400'}`}
        textAnchor={textAnchor} 
        onClick={() => {
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

  const studentName = `${student.first_name || student.username} ${student.last_name || ''}`.trim();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-fade-in-up">
        <button
          onClick={() => navigate(`/employer/students/${id}`)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Вернуться в профиль
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Трекинг навыков: {studentName}</h1>
        <p className="text-gray-500">Детальная аналитика по компетенциям и проектам кандидата</p>
      </div>

      {/* Переключение профилей */}
      <div className="flex gap-4 border-b border-gray-800 pb-2">
        {profiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => {
              setActiveProfileId(profile.id);
              setActiveCategoryName(null);
            }}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeProfileId === profile.id
                ? 'bg-[#1a2332] text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            {profile.name}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-gray-400">Навыков в профиле</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {activeProfileSkills.length}
          </p>
        </div>

        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-gray-400">Одобрено проектов (Всего)</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {verifiedProjectsCount}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Skills Progress */}
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-400">
          <h2 className="text-lg font-semibold text-white mb-6">
            Уровень владения навыками {activeCategoryName && <span className="text-cyan-400 text-sm ml-2">({activeCategoryName})</span>}
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
                  key={skill.id} 
                  className="animate-fade-in" 
                  style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 font-medium">{skill.name}</span>
                    </div>
                    <span className="text-sm font-medium text-cyan-400">
                      {skillProjectsCount} проектов
                    </span>
                  </div>
                  
                  <div className="w-full h-2 bg-[#0f1419] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 animate-fade-in"
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
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-500 relative">
          <h2 className="text-lg font-semibold text-white mb-6">
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
                      stroke="#3b82f6"
                      fill="#3b82f6"
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
