import { create } from 'zustand';
import { userAPI, achievementAPI, skillAPI, authAPI } from '../api/client';
import type { User, Achievement, Skill, AchievementStats } from '../types';

interface GameState {
  // Данные
  currentUser: User | null;
  userStats: AchievementStats | null;
  achievements: Achievement[];
  skills: Skill[];
  
  // Состояния
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>; // Теперь это просто описание функции в интерфейсе
  fetchCurrentUser: (userId: number) => Promise<void>;
  fetchUserStats: (userId: number) => Promise<void>;
  fetchAchievements: (params?: any) => Promise<void>;
  createAchievement: (data: FormData) => Promise<void>;
  verifyAchievement: (id: number) => Promise<void>;
  rejectAchievement: (id: number) => Promise<void>;
  fetchSkills: (profileId?: number) => Promise<void>;
  updateProfile: (id: number, data: Partial<User>) => Promise<void>;
}

// Проверяем токен ПЕРЕД созданием стора
const token = localStorage.getItem('token');

export const useGameStore = create<GameState>((set, get) => ({
  currentUser: null,
  userStats: null,
  achievements: [],
  skills: [],
  isLoading: false,
  error: null,
  isAuthenticated: !!token,

  login: async (username: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.login(username, password);
      const token = response.data.token;
      
      // 🔥 1. САМОЕ ГЛАВНОЕ: СОХРАНЯЕМ ТОКЕН СРАЗУ ЖЕ!!!
      localStorage.setItem('token', token);

      // 🔥 2. Теперь Axios увидит токен и запрос пройдет успешно
      const users = await userAPI.getAll();
      
      const user = users.data.find((u: User) => 
          u.username === username || u.email === username
      );

      if (user) {
        // Эту строчку мы отсюда убрали (перенесли наверх)
        localStorage.setItem('userId', user.id.toString()); 
        
        set({ 
          currentUser: user,
          isAuthenticated: true,
          isLoading: false 
        });
        
        await get().fetchUserStats(user.id);
        await get().fetchAchievements({ student: user.id });
        await get().fetchSkills();
      } else {
        // Если юзер не найден, токен лучше удалить, чтобы не висел "мертвым грузом"
        localStorage.removeItem('token');
        throw new Error("Пользователь не найден в базе");
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Ошибка входа',
        isLoading: false 
      });
      throw error;
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    const savedUserId = localStorage.getItem('userId');

    if (!token || !savedUserId) {
      set({ isAuthenticated: false, currentUser: null });
      return;
    }

    try {
      set({ isLoading: true });
      // Используем сохраненный ID для получения данных пользователя
      const response = await userAPI.getById(Number(savedUserId));
      
      set({ 
        currentUser: response.data, 
        isAuthenticated: true, 
        isLoading: false 
      });

      // Сразу подгружаем данные для профиля
      get().fetchUserStats(response.data.id);
      get().fetchAchievements({ student: response.data.id });
      get().fetchSkills();
    } catch (error) {
      console.error("Auth check failed:", error);
      get().logout(); // Если токен протух — чистим всё
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId'); // Чистим ID тоже
    set({ 
      currentUser: null,
      userStats: null,
      achievements: [],
      skills: [],
      isAuthenticated: false 
    });
  },

  fetchCurrentUser: async (userId: number) => {
    try {
      set({ isLoading: true });
      const response = await userAPI.getById(userId);
      set({ currentUser: response.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching user:', error);
      set({ isLoading: false });
    }
  },

  updateProfile: async (id: number, data: Partial<User>) => {
    try {
      set({ isLoading: true, error: null });
      const response = await userAPI.update(id, data);
      set({ currentUser: response.data });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Ошибка обновления профиля' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserStats: async (userId: number) => {
    try {
      const response = await userAPI.getStats(userId);
      set({ userStats: response.data });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  },

  fetchAchievements: async (params?: any) => {
    try {
      set({ isLoading: true });
      const response = await achievementAPI.getAll(params);
      set({ achievements: response.data, isLoading: false });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      set({ isLoading: false });
    }
  },

  createAchievement: async (data: FormData) => {
    try {
      await achievementAPI.create(data);
      if (get().currentUser) {
        await get().fetchAchievements({ student: get().currentUser!.id });
      }
    } catch (error) {
      console.error('Error creating achievement:', error);
      throw error;
    }
  },

  verifyAchievement: async (id: number) => {
    try {
      await achievementAPI.update(id, { status: 'VERIFIED' });
      await get().fetchAchievements();
    } catch (error) {
      console.error('Error verifying achievement:', error);
      throw error;
    }
  },

  rejectAchievement: async (id: number) => {
    try {
      await achievementAPI.update(id, { status: 'REJECTED' });
      await get().fetchAchievements();
    } catch (error) {
      console.error('Error rejecting achievement:', error);
      throw error;
    }
  },

  fetchSkills: async (profileId?: number) => {
    try {
      const response = await skillAPI.getAll(profileId);
      set({ skills: response.data });
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  },
}));