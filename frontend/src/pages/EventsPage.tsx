// frontend/src/pages/EventsPage.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Search, Trophy, Sparkles, MapPin, GraduationCap, Calendar,
  ExternalLink, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, BookOpen, Star, X, Bell, BellOff, CalendarCheck
} from 'lucide-react';
import { parsedEventAPI } from '../api/client';
import { useGameStore } from '../store/useGameStore';
import type { ParsedEvent, RecommendedEvent, EventFilters, PaginatedResponse} from '../types';

const PAGE_SIZE = 20;
const REC_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 ч

function getCachedRec(userId: number, profession: string): RecommendedEvent[] | null {
  try {
    const raw = localStorage.getItem(`rec_events_${userId}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { data: RecommendedEvent[]; ts: number; profession: string };
    if (cached.profession !== profession) return null;
    if (Date.now() - cached.ts > REC_CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function setCachedRec(userId: number, profession: string, data: RecommendedEvent[]) {
  try {
    localStorage.setItem(`rec_events_${userId}`, JSON.stringify({ data, ts: Date.now(), profession }));
  } catch {}
}

export default function EventsPage() {
  const { currentUser } = useGameStore();
  const [activeTab, setActiveTab] = useState<'all' | 'recommended'>('all');
  const [events, setEvents] = useState<ParsedEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [recommended, setRecommended] = useState<RecommendedEvent[]>([]);
  const [filters, setFilters] = useState<EventFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Активные фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [hasDateOnly, setHasDateOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    parsedEventAPI.getFilters()
      .then(res => setFilters(res.data))
      .catch(err => console.error('Ошибка загрузки фильтров:', err));
  }, []);

  // frontend/src/pages/EventsPage.tsx

  const loadEvents = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page };
      if (searchQuery) params.search = searchQuery;
      if (selectedType) params.event_type = selectedType;
      if (selectedSource) params.source = selectedSource;
      if (selectedYear) params.year = selectedYear;
      if (hasDateOnly) params.has_date = 'true';

      const res = await parsedEventAPI.getAll(params);
      const data = res.data;

      // Проверяем, является ли ответ объектом с пагинацией
      if (data && typeof data === 'object' && !Array.isArray(data) && 'results' in data) {
        // Приводим тип к нашему интерфейсу PaginatedResponse<ParsedEvent>
        const paginatedData = data as PaginatedResponse<ParsedEvent>;
        
        setEvents(paginatedData.results);
        setTotalCount(paginatedData.count);
      } else {
        // Fallback: если пришел просто массив
        const arrayData = Array.isArray(data) ? data : [];
        setEvents(arrayData as ParsedEvent[]);
        setTotalCount(arrayData.length);
      }
    } catch (err) {
      console.error('Ошибка загрузки мероприятий:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, selectedSource, selectedYear, hasDateOnly]);
  // Сбрасываем страницу при смене фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedSource, selectedYear, hasDateOnly]);

  // Загружаем при смене страницы или фильтров
  useEffect(() => {
    loadEvents(currentPage);
  }, [currentPage, loadEvents]);

  const loadRecommended = async (force = false) => {
    const userId = currentUser?.id;
    const profession = currentUser?.future_profession ?? '';

    if (!force && userId) {
      const cached = getCachedRec(userId, profession);
      if (cached) {
        setRecommended(cached);
        return;
      }
    }

    try {
      setRecLoading(true);
      setRecError(null);
      const res = await parsedEventAPI.getRecommended();
      setRecommended(res.data);
      if (userId && profession) setCachedRec(userId, profession, res.data);
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

  const handleTrack = async (e: React.MouseEvent, event: ParsedEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (event.is_tracked) {
        await parsedEventAPI.untrackEvent(event.id);
      } else {
        await parsedEventAPI.trackEvent(event.id);
      }
      setEvents(prev =>
        prev.map(ev => ev.id === event.id ? { ...ev, is_tracked: !ev.is_tracked } : ev)
      );
    } catch (err) {
      console.error('Ошибка при изменении отслеживания:', err);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedSource('');
    setSelectedYear('');
    setHasDateOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedType || selectedSource || selectedYear || hasDateOnly;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const formatGrade = (grade: string) => {
    if (!grade) return '—';
    return grade.includes('кл') ? grade : `${grade} кл.`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in px-3 sm:px-4 md:px-6 lg:px-0">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Мероприятия</h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Олимпиады, хакатоны и конкурсы — находите подходящие события
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-fade-in-up delay-100">
        {[
          { label: 'Всего', value: totalCount, color: 'text-blue-400', icon: BookOpen },
          { label: 'На странице', value: events.length, color: 'text-purple-400', icon: GraduationCap },
          { label: 'Страница', value: totalPages > 0 ? `${currentPage}/${totalPages}` : '—', color: 'text-cyan-400', icon: Trophy },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#1a2332] border border-gray-800 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center animate-scale-in"
          >
            <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color} mx-auto mb-1`} />
            <p className={`text-lg sm:text-xl font-bold ${stat.color} mb-0.5`}>{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
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
          <span className="px-1.5 sm:px-2 py-0.5 bg-gray-800 rounded-full text-[10px] sm:text-xs">{totalCount}</span>
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
            {/* Search row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию, организатору..."
                  className="w-full bg-[#1a2332] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

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

            {/* Event type chips */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedType('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  !selectedType
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-[#1a2332] text-gray-400 border-gray-800 hover:border-gray-600'
                }`}
              >
                Все типы
              </button>
              {filters?.event_types.map(et => (
                <button
                  key={et.value}
                  onClick={() => setSelectedType(selectedType === et.value ? '' : et.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedType === et.value
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-[#1a2332] text-gray-400 border-gray-800 hover:border-gray-600'
                  }`}
                >
                  {et.label}
                </button>
              ))}
            </div>

            {/* Additional filters dropdown */}
            {showFilters && filters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 animate-fade-in-up">
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="bg-[#1a2332] border border-gray-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="">Все источники</option>
                  {filters.sources.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
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

                <button
                  onClick={() => setHasDateOnly(!hasDateOnly)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border ${
                    hasDateOnly
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-[#1a2332] text-gray-400 border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  Только с датой
                </button>
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {events.map((event, index) => (
                  <a
                    key={event.id}
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1a2332] border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-blue-500/30 transition-all group animate-fade-in-up cursor-pointer flex flex-col"
                    style={{ animationDelay: `${0.1 + index * 0.03}s` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-blue-400 transition-colors leading-tight line-clamp-2">
                            {event.title}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">{event.source_display}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <button
                          onClick={(e) => handleTrack(e, event)}
                          title={event.is_tracked ? 'Перестать отслеживать' : 'Отслеживать'}
                          className={`p-1.5 rounded-lg transition-all ${
                            event.is_tracked
                              ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                              : 'text-gray-600 hover:text-blue-400 hover:bg-blue-500/10'
                          }`}
                        >
                          {event.is_tracked
                            ? <BellOff className="w-3.5 h-3.5" />
                            : <Bell className="w-3.5 h-3.5" />
                          }
                        </button>
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                      </div>
                    </div>

                    {/* Type + Subject badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {event.event_type_display && (
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap">
                          {event.event_type_display}
                        </span>
                      )}
                      {event.subject_area && (
                        <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-[10px] sm:text-xs font-medium max-w-[160px] truncate">
                          {event.subject_area}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed line-clamp-2 flex-1">
                      {event.description || '—'}
                    </p>

                    {/* Footer meta */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] sm:text-xs text-gray-500">
                      {event.event_date ? (
                        <span className="flex items-center gap-1 text-blue-400/80">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.event_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {event.year || '—'}
                        </span>
                      )}
                      {event.region && (
                        <>
                          <span className="w-1 h-1 bg-gray-700 rounded-full" />
                          <span className="flex items-center gap-1 truncate max-w-[100px]">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {event.region}
                          </span>
                        </>
                      )}
                      {event.grade && (
                        <>
                          <span className="w-1 h-1 bg-gray-700 rounded-full" />
                          <span className="flex items-center gap-1 max-w-[120px] truncate">
                            <GraduationCap className="w-3 h-3 flex-shrink-0" />
                            {formatGrade(event.grade)}
                          </span>
                        </>
                      )}
                    </div>
                  </a>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2 animate-fade-in-up">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-[#1a2332] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Назад</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 7) {
                        page = i + 1;
                      } else if (currentPage <= 4) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i;
                      } else {
                        page = currentPage - 3 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                            page === currentPage
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-[#1a2332] text-gray-400 border border-gray-800 hover:text-white hover:border-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-[#1a2332] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <span className="hidden sm:inline">Вперёд</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
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
          {currentUser?.future_profession ? (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-400">Рекомендации подобраны для профессии:</p>
                <p className="text-base sm:text-lg font-semibold text-white">{currentUser.future_profession}</p>
              </div>
              <button
                onClick={() => loadRecommended(true)}
                disabled={recLoading}
                title="Обновить рекомендации"
                className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-40"
              >
                <Loader2 className={`w-4 h-4 ${recLoading ? 'animate-spin text-purple-400' : ''}`} />
              </button>
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
                          <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                            {event.title}
                          </h3>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                            {[event.subject_area, event.year, event.organizer].filter(Boolean).join(' · ')}
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
