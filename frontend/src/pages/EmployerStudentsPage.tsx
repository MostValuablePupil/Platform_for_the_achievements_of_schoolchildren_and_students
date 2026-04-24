// frontend/src/pages/EmployerStudentsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Award, TrendingUp, CheckCircle, ExternalLink, GraduationCap, Loader2 } from 'lucide-react';
import { userAPI } from '../api/client';
import type { User } from '../types';

interface StudentData {
  id: number;
  first_name: string;
  last_name: string;
  educational_institution: string;
  course: string;
  future_profession?: string | null;
  total_xp: number;
  level: number;
  achievements_count: number;
  avatar_initials: string;
  avatar_url?: string;
  skills: string[];
}

export default function EmployerStudentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ faculty: '', min_level: '' });
  
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getAll();
        
        // Фильтруем только студентов
        const studentsList = response.data.filter((u: User) => u.role === 'STUDENT');
        
        // Преобразуем в формат для отображения
        const formattedStudents: StudentData[] = studentsList.map((u: User) => {
          const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() || 'СТ';
          const skillsList = u.competencies ? u.competencies.map(c => c.name) : [];
          
          return {
            id: u.id,
            first_name: u.first_name || u.username || 'Без имени',
            last_name: u.last_name || '',
            educational_institution: u.educational_institution || 'Не указано',
            course: u.course || '-',
            future_profession: u.future_profession,
            total_xp: u.total_xp || 0,
            level: u.level || 1,
            achievements_count: u.achievements_count || 0,
            avatar_initials: initials,
            avatar_url: u.avatar_details?.image,
            skills: skillsList
          };
        });

        setStudents(formattedStudents);
      } catch (err: any) {
        console.error('Error fetching students:', err);
        setError('Не удалось загрузить список студентов');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter(s => {
    const matchesSearch = search === '' || 
      s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.future_profession && s.future_profession.toLowerCase().includes(search.toLowerCase())) ||
      s.skills.some(skill => skill.toLowerCase().includes(search.toLowerCase()));
    
    const matchesFaculty = filters.faculty === '' || 
      s.educational_institution.includes(filters.faculty);
    
    const matchesLevel = filters.min_level === '' || 
      s.level >= parseInt(filters.min_level);
    
    return matchesSearch && matchesFaculty && matchesLevel;
  });

  const stats = {
    total: students.length,
    avgLevel: students.length > 0 
      ? Math.round(students.reduce((acc, s) => acc + s.level, 0) / students.length) 
      : 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white mb-2">Поиск студентов</h1>
        <p className="text-gray-500">Найдите талантливых студентов с подтвержденными навыками</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 animate-fade-in-up delay-100">
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-5">
          <p className="text-2xl font-bold text-blue-400 mb-1">{stats.total}</p>
          <p className="text-sm text-gray-500">Студентов в базе</p>
        </div>
        <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-5">
          <p className="text-2xl font-bold text-purple-400 mb-1">{stats.avgLevel}</p>
          <p className="text-sm text-gray-500">Средний уровень</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-4 animate-fade-in-up delay-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Поиск по имени, навыкам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={filters.faculty}
            onChange={(e) => setFilters({...filters, faculty: e.target.value})}
            className="px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          >
            <option value="">Все вузы</option>
            <option value="МГТУ">МГТУ им. Баумана</option>
            <option value="МГУ">МГУ им. Ломоносова</option>
            <option value="СПбГУ">СПбГУ</option>
            <option value="ИТМО">ИТМО</option>
            <option value="ВШЭ">ВШЭ</option>
          </select>
          <select
            value={filters.min_level}
            onChange={(e) => setFilters({...filters, min_level: e.target.value})}
            className="px-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 min-w-[140px]"
          >
            <option value="">Все уровни</option>
            <option value="5">5+ уровень</option>
            <option value="7">7+ уровень</option>
            <option value="10">10+ уровень</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-[#1a2332] border border-red-500/30 rounded-2xl p-6 text-center text-red-400">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 animate-fade-in">
            Найдено: {filteredStudents.length} студентов
          </p>
          
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, index) => (
              <div
                key={student.id}
                className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 hover:bg-[#1e2738] transition-all cursor-pointer group animate-fade-in-up"
                style={{ animationDelay: `${0.3 + (index * 0.05)}s` }}
                onClick={() => navigate(`/employer/students/${student.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {student.avatar_url ? (
                      <img 
                        src={student.avatar_url} 
                        alt="avatar" 
                        className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                        {student.avatar_initials}
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {student.first_name} {student.last_name}
                        </h3>
                        {student.achievements_count > 0 && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" />
                        {student.educational_institution} • {student.course} курс
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm mb-2">
                        <span className="flex items-center gap-1 text-purple-400">
                          <TrendingUp className="w-4 h-4" />
                          Уровень: {student.level}
                        </span>
                        <span className="flex items-center gap-1 text-orange-400">
                          <Award className="w-4 h-4" />
                          Достижений: {student.achievements_count}
                        </span>
                      </div>

                      {student.future_profession && (
                        <p className="text-sm text-gray-500">
                          <span className="text-gray-400">Цель:</span> {student.future_profession}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-2">
                        {student.skills.slice(0, 3).map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#0f1419] rounded text-xs text-gray-400">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button className="px-4 py-2 border border-gray-700 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:border-blue-500/30 hover:bg-[#0f1419] transition-all flex items-center gap-2">
                    Профиль
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-12 text-center animate-fade-in">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Студенты не найдены</p>
              <p className="text-gray-600 text-sm mt-1">Попробуйте изменить фильтры</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
