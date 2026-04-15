// frontend/src/pages/SkillsPage.tsx
import { Code, CheckCircle, Briefcase } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function SkillsPage() {
  const radarData = [
    { subject: 'Python', A: 80, fullMark: 100 },
    { subject: 'React', A: 65, fullMark: 100 },
    { subject: 'Machine Learning', A: 55, fullMark: 100 },
    { subject: 'TypeScript', A: 50, fullMark: 100 },
    { subject: 'SQL', A: 70, fullMark: 100 },
    { subject: 'Node.js', A: 45, fullMark: 100 },
  ];

  const skills = [
    { name: 'Python', projects: 12, level: 85, verified: true },
    { name: 'React', projects: 8, level: 70, verified: true },
    { name: 'Machine Learning', projects: 6, level: 60, verified: true },
    { name: 'TypeScript', projects: 5, level: 50, verified: false },
    { name: 'SQL', projects: 10, level: 75, verified: true },
    { name: 'Node.js', projects: 4, level: 45, verified: false },
    { name: 'Docker', projects: 3, level: 40, verified: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Трекинг навыков</h1>
        <p className="text-gray-400">Отслеживайте развитие компетенций и получайте аналитику</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="stat-card animate-fade-in-up delay-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yandex-blue/20 rounded-lg flex items-center justify-center animate-scale-in delay-200">
              <Code className="w-5 h-5 text-yandex-blue" />
            </div>
            <span className="text-gray-400">Навыков</span>
          </div>
          <p className="text-3xl font-bold text-gray-100 animate-fade-in delay-300">8</p>
        </div>

        <div className="stat-card animate-fade-in-up delay-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yandex-green/20 rounded-lg flex items-center justify-center animate-scale-in delay-300">
              <CheckCircle className="w-5 h-5 text-yandex-green" />
            </div>
            <span className="text-gray-400">Верифицировано</span>
          </div>
          <p className="text-3xl font-bold text-gray-100 animate-fade-in delay-400">5</p>
        </div>

        <div className="stat-card animate-fade-in-up delay-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yandex-purple/20 rounded-lg flex items-center justify-center animate-scale-in delay-400">
              <Briefcase className="w-5 h-5 text-yandex-purple" />
            </div>
            <span className="text-gray-400">Проектов</span>
          </div>
          <p className="text-3xl font-bold text-gray-100 animate-fade-in delay-500">63</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Skills Progress */}
        <div className="glass-card p-6 animate-fade-in-up delay-400">
          <h2 className="text-lg font-semibold text-gray-100 mb-6">Уровень владения навыками</h2>
          
          <div className="space-y-5">
            {skills.map((skill, index) => (
              <div 
                key={index} 
                className="animate-fade-in" 
                style={{ animationDelay: `${0.5 + (index * 0.1)}s` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-200 font-medium">{skill.name}</span>
                    {skill.verified && (
                      <CheckCircle className="w-4 h-4 text-yandex-green animate-scale-in" />
                    )}
                  </div>
                  <span className="text-sm text-gray-400">{skill.projects} проектов</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill animate-fade-in"
                    style={{ 
                      width: `${skill.level}%`, 
                      animationDelay: `${0.6 + (index * 0.1)}s` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass-card p-6 animate-fade-in-up delay-500">
          <h2 className="text-lg font-semibold text-gray-100 mb-6">Карта компетенций</h2>
          
          <div className="h-80 animate-scale-in delay-600">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Radar
                  name="Навыки"
                  dataKey="A"
                  stroke="#005bff"
                  fill="#005bff"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
