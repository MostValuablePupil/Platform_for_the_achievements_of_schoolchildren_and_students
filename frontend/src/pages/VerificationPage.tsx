import { useState } from 'react';
import { 
  Clock, CheckCircle, XCircle, ChevronRight, 
  Award, Calendar, Building2, Link as LinkIcon,
  Search, Filter, Trophy
} from 'lucide-react';

interface Achievement {
  id: number;
  title: string;
  student: {
    id: number;
    name: string;
    email: string;
  };
  type: string;
  date: string;
  description: string;
  organization: string;
  link?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  proofFile?: string;
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    title: 'Победа в олимпиаде по программированию',
    student: { id: 1, name: 'Иван Петров', email: 'ivan@mail.ru' },
    type: 'Олимпиада',
    date: '2026-03-15',
    description: 'Первое место в региональной олимпиаде по программированию среди школьников',
    organization: 'Министерство образования',
    link: 'https://example.com/olympiad',
    status: 'PENDING',
  },
  {
    id: 2,
    title: 'Сертификат курса Python для начинающих',
    student: { id: 2, name: 'Мария Сидорова', email: 'maria@mail.ru' },
    type: 'Курс',
    date: '2026-04-10',
    description: 'Прошел курс Python на платформе Coursera с оценкой 95%',
    organization: 'Coursera',
    status: 'PENDING',
  },
  {
    id: 3,
    title: 'Волонтерская помощь в приюте для животных',
    student: { id: 3, name: 'Алексей Смирнов', email: 'alex@mail.ru' },
    type: 'Волонтерство',
    date: '2026-03-01',
    description: 'Помогал в приюте каждые выходные в течение 3 месяцев',
    organization: 'Приют "Добрые руки"',
    status: 'PENDING',
  },
  {
    id: 4,
    title: 'Разработка мобильного приложения',
    student: { id: 4, name: 'Екатерина Волкова', email: 'katya@mail.ru' },
    type: 'Проект',
    date: '2026-02-20',
    description: 'Создал приложение для отслеживания привычек на React Native',
    organization: 'Самостоятельный проект',
    status: 'PENDING',
  },
];

export default function VerificationPage() {
  const [achievements, setAchievements] = useState<Achievement[]>(MOCK_ACHIEVEMENTS);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');

  const stats = {
    pending: achievements.filter(a => a.status === 'PENDING').length,
    verified: achievements.filter(a => a.status === 'VERIFIED').length,
    rejected: achievements.filter(a => a.status === 'REJECTED').length,
  };

  const filteredAchievements = achievements.filter(ach => {
    const matchesFilter = filter === 'all' || ach.status === filter;
    const matchesSearch = search === '' || 
      ach.title.toLowerCase().includes(search.toLowerCase()) ||
      ach.student.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleVerify = (id: number, status: 'VERIFIED' | 'REJECTED') => {
    setAchievements(prev => prev.map(ach => 
      ach.id === id ? { ...ach, status } : ach
    ));
    setSelectedAchievement(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-medium rounded-full">Ожидает проверки</span>;
      case 'VERIFIED':
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-medium rounded-full">Подтверждено</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium rounded-full">Отклонено</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* Header */}
      <div className="bg-[#1a2332] border-b border-gray-800 px-8 py-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Верификация достижений</h1>
        </div>
        <p className="text-gray-400">Проверьте и подтвердите достижения студентов</p>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-sm text-gray-400">Ожидают проверки</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.verified}</p>
                <p className="text-sm text-gray-400">Подтверждено</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                <p className="text-sm text-gray-400">Отклонено</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Поиск по названию или студенту..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
            >
              <option value="PENDING">Ожидают проверки</option>
              <option value="all">Все</option>
              <option value="VERIFIED">Подтверждено</option>
              <option value="REJECTED">Отклонено</option>
            </select>
          </div>
        </div>

        {/* Achievements List */}
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Недавно добавленные достижения</h2>
          </div>

          <div className="divide-y divide-gray-800">
            {filteredAchievements.length > 0 ? (
              filteredAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  onClick={() => setSelectedAchievement(achievement)}
                  className="px-6 py-5 hover:bg-[#1e2738] cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-white">{achievement.title}</h3>
                        {getStatusBadge(achievement.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                        <span className="font-medium text-blue-400">{achievement.student.name}</span>
                        <span>•</span>
                        <span>{achievement.type}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(achievement.date).toLocaleDateString('ru-RU', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>

                      <p className="text-gray-400 text-sm line-clamp-2">{achievement.description}</p>
                      
                      {achievement.organization && (
                        <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          Организация: {achievement.organization}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0 ml-4" />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                <Award className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p>Достижения не найдены</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
          onVerify={() => handleVerify(selectedAchievement.id, 'VERIFIED')}
          onReject={() => handleVerify(selectedAchievement.id, 'REJECTED')}
        />
      )}
    </div>
  );
}

// Modal Component
interface AchievementDetailModalProps {
  achievement: Achievement;
  onClose: () => void;
  onVerify: () => void;
  onReject: () => void;
}

function AchievementDetailModal({ achievement, onClose, onVerify, onReject }: AchievementDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a2332] border border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#1a2332]">
          <h2 className="text-xl font-bold text-white">Детали достижения</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Student Info */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Студент:</p>
            <p className="font-medium text-blue-400">{achievement.student.name}</p>
            <p className="text-sm text-gray-500">{achievement.student.email}</p>
          </div>

          {/* Achievement Title */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Название достижения</p>
            <h3 className="text-lg font-semibold text-white">{achievement.title}</h3>
          </div>

          {/* Type and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Тип достижения</p>
              <p className="font-medium text-white">{achievement.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Дата получения</p>
              <p className="font-medium text-white">
                {new Date(achievement.date).toLocaleDateString('ru-RU', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-gray-400 mb-1">Описание</p>
            <p className="text-gray-300">{achievement.description}</p>
          </div>

          {/* Organization */}
          {achievement.organization && (
            <div>
              <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Организация
              </p>
              <p className="font-medium text-white">{achievement.organization}</p>
            </div>
          )}

          {/* Link */}
          {achievement.link && (
            <div>
              <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                <LinkIcon className="w-4 h-4" />
                Ссылка
              </p>
              <a
                href={achievement.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all"
              >
                {achievement.link}
              </a>
            </div>
          )}

          {/* Proof File */}
          {achievement.proofFile && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Файл подтверждения</p>
              <a
                href={achievement.proofFile}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <Award className="w-4 h-4" />
                Скачать файл
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-800 flex gap-3 sticky bottom-0 bg-[#1a2332]">
          <button
            onClick={onVerify}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Подтвердить
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 border border-gray-700 hover:bg-[#0f1419] text-gray-300 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            Редактировать
          </button>
          
          <button
            onClick={onReject}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}