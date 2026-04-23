// frontend/src/pages/EmployerStudentProfilePage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Award, TrendingUp, CheckCircle, Download, Share2, Calendar, Building2, GraduationCap } from 'lucide-react';

interface Achievement {
  id: number;
  title: string;
  description: string;
  points: number;
  created: string;
  organization: string;
}

const MOCK_STUDENT = {
  id: 1,
  first_name: 'Анна',
  last_name: 'Соколова',
  educational_institution: 'МГТУ им. Баумана',
  course: '4',
  future_profession: 'Data Scientist',
  total_xp: 2450,
  level: 7,
  achievements_count: 12,
  avatar_initials: 'АС',
  email: 'anna.sokolova@bmstu.ru',
  skills: ['Python', 'Machine Learning', 'SQL', 'Pandas', 'Scikit-learn'],
};

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    title: 'Победа в олимпиаде по программированию',
    description: 'Призёр 2 степени в региональном этапе Всероссийской олимпиады',
    points: 250,
    created: '2025-11-15',
    organization: 'МГТУ им. Баумана',
  },
  {
    id: 2,
    title: 'Хакатон AI Solutions',
    description: 'Разработка модели прогнозирования спроса для ритейла',
    points: 350,
    created: '2025-10-20',
    organization: 'Яндекс',
  },
  {
    id: 3,
    title: 'Курс по Machine Learning',
    description: 'Профессиональная переподготовка по направлению Data Science',
    points: 400,
    created: '2025-09-01',
    organization: 'Coursera',
  },
  {
    id: 4,
    title: 'Волонтёрство в образовательном проекте',
    description: 'Проведение мастер-классов по программированию для школьников',
    points: 180,
    created: '2025-08-10',
    organization: 'CodeForGood',
  },
];

export default function EmployerStudentProfilePage() {
  useParams();
  const navigate = useNavigate();
  
  const student = MOCK_STUDENT;
  const achievements = MOCK_ACHIEVEMENTS;
  const progress = ((student.total_xp % 350) / 350) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 via-blue-500/10 to-cyan-500/20 border border-blue-500/30 rounded-3xl p-8 text-white animate-fade-in-up backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        <button
          onClick={() => navigate('/employer/students')}
          className="flex items-center gap-2 text-blue-200/80 hover:text-blue-200 mb-6 transition-colors relative z-10"
        >
          <ArrowLeft className="w-5 h-5" />
          Вернуться к списку
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-500/30 animate-scale-in">
              {student.avatar_initials}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 animate-fade-in-up delay-100">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-blue-200 mb-3 flex items-center gap-2 animate-fade-in-up delay-200">
                <GraduationCap className="w-4 h-4" />
                Студент {student.course} курса • {student.educational_institution}
              </p>
              <div className="flex items-center gap-4 text-sm text-blue-300/60 animate-fade-in-up delay-300">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {student.achievements_count} достижений
                </span>
                <span>•</span>
                <span>Уровень {student.level}</span>
                <span>•</span>
                <span>{student.total_xp} XP</span>
              </div>
              {student.future_profession && (
                <p className="text-sm text-blue-200/80 mt-2 animate-fade-in-up delay-400">
                  <span className="text-blue-300/60">Цель:</span> {student.future_profession}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 animate-fade-in-up delay-500">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl text-sm font-medium transition-all flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Поделиться
            </button>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm rounded-xl text-sm font-medium transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              Скачать
            </button>
            <button className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Связаться
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Progress */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-100">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Прогресс
            </h3>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Уровень {student.level}</span>
                <span className="text-sm text-blue-400 font-bold">{student.total_xp} XP</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 animate-fade-in delay-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                До следующего уровня: {Math.max(0, 350 - (student.total_xp % 350))} XP
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-200">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Активность</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Достижений</span>
                <span className="text-sm font-bold text-blue-400">{student.achievements_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Уровень</span>
                <span className="text-sm font-bold text-purple-400">{student.level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Всего XP</span>
                <span className="text-sm font-bold text-orange-400">{student.total_xp}</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-300">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Навыки</h3>
            <div className="flex flex-wrap gap-2">
              {student.skills.map((skill: string, index: number) => (
                <span 
                  key={skill}
                  className="px-3 py-1.5 bg-[#0f1419] rounded-lg text-sm text-gray-300 animate-fade-in"
                  style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Achievements */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 animate-fade-in-up delay-300">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              Верифицированные достижения
            </h3>

            {achievements.length > 0 ? (
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div 
                    key={achievement.id} 
                    className="bg-[#0f1419] border border-gray-800/50 rounded-xl p-4 hover:border-blue-500/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white">{achievement.title}</h4>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Верифицировано
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(achievement.created).toLocaleDateString('ru-RU')}
                      </span>
                      <span>•</span>
                      <span className="text-orange-400 font-medium">+{achievement.points} XP</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {achievement.organization}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">Пока нет верифицированных достижений</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
