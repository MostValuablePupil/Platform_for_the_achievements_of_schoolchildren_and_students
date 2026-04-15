import axios from 'axios';
import type { 
  User, 
  Achievement, 
  Skill, 
  SkillProfile, 
  SkillCategory, 
  AchievementStats 
} from '../types';

const API_URL = 'http://localhost:8000/api/';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен авторизации
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Обработка ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- API Функции с типами ---
export const authAPI = {
  login: (username: string, password: string) => 
    apiClient.post<{ token: string }>('login/', { username, password }),
  
  register: (userData: any) =>  // ← Добавь тип :any или создай интерфейс
    apiClient.post<User>('users/', userData),  // ← Измени data на userData
};

export const userAPI = {
  getAll: () => apiClient.get<User[]>('users/'),
  getById: (id: number) => apiClient.get<User>(`users/${id}/`),
  getStats: (id: number) => apiClient.get<AchievementStats>(`users/${id}/stats/`),
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
};

export const skillAPI = {
  getProfiles: () => apiClient.get<SkillProfile[]>('profiles/'),
  getCategories: () => apiClient.get<SkillCategory[]>('skill-categories/'),
  getAll: (profileId?: number) => {
    const params = profileId ? { profile_id: profileId } : {};
    return apiClient.get<Skill[]>('skills/', { params });
  },
};

export default apiClient;
