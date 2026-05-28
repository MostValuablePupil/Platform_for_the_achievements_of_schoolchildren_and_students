// frontend/src/pages/EventsPage.tsx
import { useState, useEffect } from 'react';
import {
  Search, Trophy, Sparkles, MapPin, GraduationCap, Calendar,
  ExternalLink, Filter, ChevronDown, Loader2, BookOpen,
  Star, X
} from 'lucide-react';
import { parsedEventAPI } from '../api/client';
import { useGameStore } from '../store/useGameStore';
import type { ParsedEvent, RecommendedEvent, EventFilters } from '../types';

export default function EventsPage() {
  const { currentUser } = useGameStore();
  const [activeTab, setActiveTab] = useState<'all' | 'recommended'>('all');
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [recommended, setRecommended] = useState<RecommendedEvent[]>([]);
  const [filters, setFilters] = useState<EventFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  
  // Активные фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Загрузка фильтров
  useEffect(() => {
    parsedEventAPI.getFilters()
      .then(res => setFilters(res.data))
      .catch(err => console.error('Ошибка загрузки фильтров:', err));
  }, []);

  // Загрузка событий при изменении фильтров
  useEffect(() => {
    loadEvents();
  }, [selectedSubject, selectedRegion, selectedYear, selectedGrade, searchQuery]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedSubject) params.subject_area = selectedSubject;
      if (selectedRegion) params.region = selectedRegion;
      if (selectedYear) params.year = selectedYear;
      if (selectedGrade) params.grade = selectedGrade;

      const res = await parsedEventAPI.getAll(params);
      setEvents(res.data);
    } catch (err) {
      console.error('Ошибка загрузки мероприятий:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommended = async () => {
    try {
      setRecLoading(true);
      setRecError(null);
      const res = await parsedEventAPI.getRecommended();
      setRecommended(res.data);
    } catch (err: any) {
      setRecError(err.response?.data?.detail || 'Ошибка загрузки рекомендаций');
    } finally {
      setRecLoading(false);
    }
  };

  const handleTabChange = (tab: 'all' | 'recommended') => {
    setActiveTab(tab);
    if (tab === 'recommended' && recommended.length === 0 && !recLoading) {
      loadRecommended();
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setSelectedRegion('');
    setSelectedYear('');
    setSelectedGrade('');
  };

  const hasActiveFilters = searchQuery || selectedSubject || selectedRegion || selectedYear || selectedGrade;

  // Статистика
  const subjects = new Set(events.map(e => e.subject_area)).size;
  const sources = new Set(events.map(e => e.source)).size;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in px-3 sm:px-4 md:px-6 lg:px-0">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Мероприятия</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Олимпиады, хакатоны и конкурсы — находите подходящие события
        </p>
      </div>

      {/* Stats - в одну строку */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-fade-in-up delay-100">
        {[
          { label: 'Всего', value: events.length, color: 'text-blue-400', icon: BookOpen, delay: 'delay-100' },
          { label: 'Предметов', value: subjects, color: 'text-purple-400', icon: GraduationCap, delay: 'delay-200' },
          { label: 'Источников', value: sources, color: 'text-cyan-400', icon: Trophy, delay: 'delay-300' },
        ].map((stat) => (
          <div 
            key={stat.label}
            className={`bg-[#1a2332] border border-gray-800 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center animate-scale-in ${stat.delay}`}
          >
            <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color} mx-auto mb-1`} />
            <p className={`text-lg sm:text-xl font-bold ${stat.color} mb-0.5`}>{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs - горизонтальный скролл на мобильных */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-3 sm:pb-4 animate-fade-in-up delay-300 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'all'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Все мероприятия</span>
          <span className="sm:hidden">Все</span>
          <span className="px-1.5 sm:px-2 py-0.5 bg-gray-800 rounded-full text-[10px] sm:text-xs">{events.length}</span>
        </button>
        <button
          onClick={() => handleTabChange('recommended')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'recommended'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Рекомендации ИИ</span>
          <span className="sm:hidden">ИИ</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'all' ? (
        <>
          {/* Search & Filters */}
          <div className="space-y-3 animate-fade-in-up delay-400">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3">
              {/* Search */}
              <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию, предмету..."
                  className="w-full bg-[#1a2332] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              {/* Toggle filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border flex-shrink-0 w-full sm:w-auto justify-center ${
                  showFilters || hasActiveFilters
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-[#1a2332] text-gray-400 border-gray-800 hover:border-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Фильтры</span>
                <span className="sm:hidden">Фильтр</span>
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                  <span className="hidden sm:inline">Сбросить</span>
                </button>
              )}
            </div>

            {/* Filter dropdowns - grid на мобильных, inline на десктопе */}
            {showFilters && filters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 animate-fade-in-up">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-[#1a2332] border border-gray-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="">Все предметы</option>
                  {filters.subject_areas.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="bg-[#1a2332] border border-gray-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="">Все регионы</option>
                  {filters.regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-[#1a2332] border border-gray-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="">Все годы</option>
                  {filters.years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="bg-[#1a2332] border border-gray-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="">Все классы</option>
                  {filters.grades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Events Cards */}
          {loading ? (
            <div className="bg-[#1a2332] border border-gray-800 rounded-xl sm:rounded-2xl p-12 sm:p-16 text-center animate-fade-in-up">
              <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-3 animate-spin" />
              <p className="text-gray-500 text-sm">Загрузка мероприятий...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {events.map((event, index) => (
                <a
                  key={event.id}
                  href={event.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1a2332] border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-blue-500/30 transition-all group animate-fade-in-up cursor-pointer flex flex-col"
                  style={{ animationDelay: `${0.3 + index * 0.05}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-blue-400 transition-colors leading-tight truncate">
                          {event.title}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">{event.source_display}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                  </div>

                  {/* Subject badge */}
                  <div className="mb-3">
                    <span className="px-2.5 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-[10px] sm:text-xs font-medium">
                      {event.subject_area || 'Общий'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed line-clamp-2 flex-1">
                    {event.description}
                  </p>

                  {/* Footer meta */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] sm:text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.year}
                    </span>
                    <span className="w-1 h-1 bg-gray-700 rounded-full" />
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {event.region || '—'}
                    </span>
                    <span className="w-1 h-1 bg-gray-700 rounded-full" />
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 flex-shrink-0" />
                      {event.grade ? `${event.grade} кл.` : '—'}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-[#1a2332] border border-gray-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-16 text-center animate-fade-in-up">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Ничего не найдено</p>
              <p className="text-gray-600 text-xs mt-1">Попробуйте изменить фильтры</p>
            </div>
          )}
        </>
      ) : (
        /* === RECOMMENDED TAB === */
        <div className="space-y-4 animate-fade-in-up delay-300">
          {/* Profession Banner */}
          {currentUser?.future_profession ? (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Рекомендации подобраны для профессии:</p>
                <p className="text-base sm:text-lg font-semibold text-white">{currentUser.future_profession}</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a2332] border border-yellow-500/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500/50 mx-auto mb-3" />
              <p className="text-white font-medium mb-1 text-sm sm:text-base">Укажите желаемую профессию</p>
              <p className="text-xs sm:text-sm text-gray-500">
                Перейдите в <span className="text-blue-400">Профиль</span> и заполните поле «Желаемая профессия»
              </p>
            </div>
          )}

          {/* Recommendations List */}
          {recLoading ? (
            <div className="bg-[#1a2332] border border-gray-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-16 text-center">
              <Loader2 className="w-8 h-8 text-purple-400 mx-auto mb-3 animate-spin" />
              <p className="text-gray-500 text-sm">ИИ подбирает мероприятия...</p>
              <p className="text-gray-600 text-xs mt-1">Это может занять несколько секунд</p>
            </div>
          ) : recError ? (
            <div className="bg-[#1a2332] border border-red-500/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
              <p className="text-red-400 text-sm">{recError}</p>
            </div>
          ) : recommended.length > 0 ? (
            <div className="space-y-2.5 sm:space-y-3">
              {recommended.map((rec, index) => {
                const event = rec.event;
                return (
                  <a
                    key={event.id}
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-[#1a2332] border border-purple-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-purple-500/30 transition-all animate-fade-in-up group"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                            {event.title}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                            {event.subject_area} · {event.year} · {event.organizer}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <div className="px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30 whitespace-nowrap">
                          {Math.round(rec.relevance_score * 100)}%
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    {/* AI Reason */}
                    <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{rec.reason}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : currentUser?.future_profession ? (
            <div className="bg-[#1a2332] border border-gray-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-16 text-center">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Рекомендации не найдены</p>
              <p className="text-gray-600 text-xs mt-1">Попробуйте изменить желаемую профессию</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}