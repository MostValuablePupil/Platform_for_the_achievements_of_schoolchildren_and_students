// frontend/src/pages/EmployerStudentsPage.tsx
import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Award, TrendingUp, ExternalLink, GraduationCap, Loader2 } from 'lucide-react';
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
  specialty?: any;
}

export default function EmployerStudentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  
  // Изменяем тип фильтров, чтобы они соответствовали значениям CustomSelect (строки)
  const [filters] = useState({ 
    institution: '', // Было faculty, переименовали для ясности
    min_level: '' 
  });

  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getAll();
        const studentsList = response.data.filter((u: User) => u.role === 'STUDENT');
        
        const formattedStudents: StudentData[] = studentsList.map((u: User) => {
          const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase() || 'СТ';
          const skillsList = (u as any).competencies ? (u as any).competencies.map((c: any) => c.name) : [];
          
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
            avatar_url: (u as any).avatar_details?.image,
            skills: skillsList,
            specialty: u.specialty
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
      
    // Фильтрация по учреждению (точное совпадение или частичное, если нужно)
    const matchesInstitution = filters.institution === '' || 
      s.educational_institution === filters.institution;

    // Фильтрация по уровню (>= выбранного)
    const matchesLevel = filters.min_level === '' || 
      s.level >= parseInt(filters.min_level);

    return matchesSearch && matchesInstitution && matchesLevel;
  });

  const stats = {
    total: students.length,
    avgLevel: students.length > 0
      ? Math.round(students.reduce((acc, s) => acc + s.level, 0) / students.length)
      : 0,
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">
          Поиск учащихся
        </h1>
        <p className="text-xs md:text-base text-gray-500">
          Найдите талантливых школьников и студентов с подтвержденными навыками
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 animate-fade-in-up delay-100">
        <div className="bg-[#1a2332] border border-gray-800 rounded-xl p-3 md:p-5">
          <p className="text-lg md:text-2xl font-bold text-blue-400 mb-1">{stats.total}</p>
          <p className="text-xs md:text-sm text-gray-500">Учащихся в базе</p>
        </div>
        <div className="bg-[#1a2332] border border-gray-800 rounded-xl p-3 md:p-5">
          <p className="text-lg md:text-2xl font-bold text-purple-400 mb-1">{stats.avgLevel}</p>
          <p className="text-xs md:text-sm text-gray-500">Средний уровень</p>
        </div>
        <div className="hidden md:block bg-[#1a2332] border border-gray-800 rounded-xl p-5">
          <p className="text-2xl font-bold text-green-400 mb-1">
            {students.filter(s => s.achievements_count > 0).length}
          </p>
          <p className="text-sm text-gray-500">С достижениями</p>
        </div>
        <div className="hidden md:block bg-[#1a2332] border border-gray-800 rounded-xl p-5">
          <p className="text-2xl font-bold text-orange-400 mb-1">
             {Math.round(students.reduce((acc, s) => acc + s.total_xp, 0) / (students.length || 1))}
          </p>
          <p className="text-sm text-gray-500">Средний XP</p>
        </div>
      </div>

      {/* Filters - Используем CustomSelect */}
      <div className="bg-[#1a2332] border border-gray-800 rounded-xl p-3 md:p-4 animate-fade-in-up delay-200">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Поиск по имени, навыкам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0f1419] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-[#1a2332] border border-red-500/30 rounded-xl p-6 text-center text-red-400">
          {error}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          <p className="text-xs md:text-sm text-gray-500 animate-fade-in">
            Найдено: {filteredStudents.length} учащихся
          </p>
          
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, index) => (
              <div
                key={student.id}
                className="bg-[#1a2332] border border-gray-800 rounded-xl p-3 md:p-6 hover:border-blue-500/30 hover:bg-[#1e2738] transition-all cursor-pointer group animate-fade-in-up"
                style={{ animationDelay: `${0.3 + (index * 0.05)}s` }}
                onClick={() => navigate(`/employer/students/${student.id}`)}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  {student.avatar_url ? (
                    <img 
                      src={student.avatar_url} 
                      alt="avatar" 
                      className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl flex items-center justify-center text-base md:text-2xl font-bold text-white flex-shrink-0">
                      {student.avatar_initials}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm md:text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                        {student.first_name} {student.last_name}
                      </h3>
                      <button className="p-1.5 md:px-4 md:py-2 border border-gray-700 rounded-lg md:rounded-xl text-gray-400 hover:text-white hover:border-blue-500/30 hover:bg-[#0f1419] transition-all flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden md:inline ml-2">Профиль</span>
                      </button>
                    </div>
                    
                    <p className="text-xs md:text-sm text-gray-400 mb-2 flex items-center gap-1 truncate">
                      <GraduationCap className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      
                      {student.course && student.course !== '-' && (
                        <span>
                          {student.course} {student.specialty ? 'курс' : 'класс'}
                        </span>
                      )}
                      
                      {(student.course && student.course !== '-') && student.educational_institution && (
                        <span className="text-gray-600 hidden md:inline">•</span>
                      )}
                      
                      <span className="truncate">{student.educational_institution}</span>
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm mb-2">
                      <span className="flex items-center gap-1 text-purple-400">
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                        Ур. {student.level}
                      </span>
                      <span className="flex items-center gap-1 text-orange-400">
                        <Award className="w-3 h-3 md:w-4 md:h-4" />
                        {student.achievements_count} достижений
                      </span>
                      <span className="flex items-center gap-1 text-cyan-400">
                         {student.total_xp} XP
                      </span>
                    </div>

                    {student.future_profession && (
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        <span className="text-gray-400">Цель: </span> {student.future_profession}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 md:gap-2 mt-2">
                      {student.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-1.5 md:px-2 py-0.5 bg-[#0f1419] rounded text-[10px] md:text-xs text-gray-400">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[#1a2332] border border-gray-800 rounded-xl p-8 md:p-12 text-center animate-fade-in">
              <Search className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-sm md:text-base text-gray-500">Учащиеся не найдены</p>
              <p className="text-xs md:text-sm text-gray-600 mt-1">Попробуйте изменить фильтры</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}