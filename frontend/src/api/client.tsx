// frontend/src/api/client.tsx
import axios from 'axios';
import type {
  User,
  Achievement,
  Skill,
  SkillProfile,
  SkillCategory,
  Specialty,
  AchievementStats,
  ParsedEvent,
  EventFilters,
  RecommendedEvent,
} from '../types';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api/';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен авторизации
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined') {
    config.headers['Authorization'] = `Token ${token}`;
  } else {
    console.warn("ВНИМАНИЕ: Запрос отправлен БЕЗ токена!");
  }
  return config;
});

// --- API Функции ---

interface LoginResponse {
  token: string;
  user: User; // Используем ваш существующий тип User
}

export const authAPI = {
  // ✅ Изменили тип возврата на LoginResponse
  login: (username: string, password: string) =>
    apiClient.post<LoginResponse>('login/', { username, password }),
  
  register: (userData: any) =>
    apiClient.post<User>('users/', userData),
};

export const userAPI = {
  getAll: () => apiClient.get<User[]>('users/'),
  getById: (id: number) => apiClient.get<User>(`users/${id}/`),
  getStats: (id: number) => apiClient.get<AchievementStats>(`users/${id}/stats/`),
  update: (id: number, data: Partial<User>) => apiClient.patch<User>(`users/${id}/`, data),
  
  // Проверка подписки
  isFollowed: (studentId: number) => apiClient.get<{ is_followed: boolean }>(`users/${studentId}/is_followed/`),
  
  getLeaderboard: (params?: {
    sort_by?: 'xp' | 'achievements';
    user_type?: 'university' | 'school';
    specialty?: string;
    course?: string;
    city?: string;
    educational_institution?: string;
  }) => apiClient.get<User[]>('users/leaderboard/', { params }),
  
};

export const achievementAPI = {
  getAll: (params?: any) => apiClient.get<Achievement[]>('achievements/', { params }),
  getById: (id: number) => apiClient.get<Achievement>(`achievements/${id}/`),
  create: (data: FormData) =>
    apiClient.post<Achievement>('achievements/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: number, data: Partial<Achievement>) =>
    apiClient.patch<Achievement>(`achievements/${id}/`, data),
    // ✅ ДОБАВЬТЕ ЭТОТ МЕТОД
  verify: (id: number) => 
    apiClient.patch<{ detail: string; xp_added: number; new_total_xp: number; new_level: number }>(`achievements/${id}/verify/`),
};

export const skillAPI = {
  getProfiles: () => apiClient.get<SkillProfile[]>('profiles/'),
  getCategories: () => apiClient.get<SkillCategory[]>('skill-categories/'),
  getAll: (profileId?: number) => {
    const params = profileId ? { profile_id: profileId } : {};
    return apiClient.get<Skill[]>('skills/', { params });
  },
};

export const specialtyAPI = {
  getAll: () => apiClient.get<Specialty[]>('specialties/'),
};

export const parsedEventAPI = {
  getAll: (params?: any) => apiClient.get<ParsedEvent[]>('parsed-events/', { params }),
  getFilters: () => apiClient.get<EventFilters>('parsed-events/filters/'),
  getRecommended: () => apiClient.get<RecommendedEvent[]>('parsed-events/recommended/'),
  trackEvent: (id: number) =>
    apiClient.post<{ is_tracked: boolean }>(`parsed-events/${id}/track/`),
  untrackEvent: (id: number) =>
    apiClient.delete<{ is_tracked: boolean }>(`parsed-events/${id}/track/`),
};

export const TELEGRAM_BOT_USERNAME = 'most_valuable_pupil_bot';

export const telegramAPI = {
  getStatus: () =>
    apiClient.get<{ is_linked: boolean; telegram_username: string | null }>('telegram/link-status/'),
  generateLink: () =>
    apiClient.post<{ code: string; expires_in: number }>('telegram/generate-link/'),
  unlink: () => apiClient.delete('telegram/unlink/'),
};

export const subscriptionAPI = {
  // Получить список моих подписок (использует action followed_students из UserViewSet)
  getSubscriptions: () => apiClient.get('/users/followed_students/'),
  
  // Подписаться на студента (использует action follow из UserViewSet)
  subscribe: (studentId: number) => apiClient.post(`/users/${studentId}/follow/`),
  
  // Отписаться от студента (использует action unfollow из UserViewSet)
  // ВАЖНО: Убедитесь, что на бэкенде url_path='unfollow' для метода DELETE
  unsubscribe: (studentId: number) => apiClient.delete(`/users/${studentId}/unfollow/`),
};

export const rsrDiplomaAPI = {
  search: (params: {
    last_name: string;
    first_name: string;
    middle_name?: string;
    birth_date: string;
    year?: number;
  }) =>
    apiClient.get<{ diplomas: import('../types').RsrDiploma[]; count: number; year: number }>(
      'rsr-diplomas/',
      { params },
    ),
};

export default apiClient;