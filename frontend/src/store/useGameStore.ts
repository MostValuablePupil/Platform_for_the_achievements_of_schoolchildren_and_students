// frontend/src/store/useGameStore.ts
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
  checkAuth: () => Promise<void>;
  fetchCurrentUser: (userId: number) => Promise<void>;
  fetchUserStats: (userId: number) => Promise<void>;
  fetchAchievements: (params?: any) => Promise<void>;
  createAchievement: (data: FormData) => Promise<void>;
  verifyAchievement: (id: number) => Promise<void>;
  rejectAchievement: (id: number) => Promise<void>;
  fetchSkills: (profileId?: number) => Promise<void>;
  updateProfile: (id: number, data: Partial<User>) => Promise<void>;
}

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
      
      // 1. Получаем токен и данные пользователя из ответа логина
      const response = await authAPI.login(username, password);
      const { token, user } = response.data;

      // 2. Сохраняем токен и userId
      localStorage.setItem('token', token);
      if (user?.id) localStorage.setItem('userId', String(user.id));
      
      // 3. Сразу устанавливаем пользователя в стейт (он уже пришел с бэкенда!)
      // Приводим тип, так как API может вернуть немного отличающуюся структуру, 
      // но основные поля (id, role, etc.) должны быть.
      set({ 
        currentUser: user as User,
        isAuthenticated: true,
        isLoading: false 
      });

      // 4. Загружаем дополнительные данные (статистика, достижения, навыки)
      // Используем user.id, который пришел в ответе
      if (user && user.id) {
         await get().fetchUserStats(user.id);
         await get().fetchAchievements({ student: user.id });
         await get().fetchSkills();
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
    // Если есть сохраненный пользователь в стейте, можно попробовать восстановить сессию
    // Но лучше сделать запрос к /users/me/ если такой есть, или просто проверить токен
    
    // Временное решение: если токен есть, пробуем загрузить данные текущего юзера
    // Для этого нам нужно знать его ID. Если мы не сохранили ID отдельно, это сложно.
    // Поэтому обычно сохраняют userId в localStorage при логине.
    
    const savedUserId = localStorage.getItem('userId'); 
    
    if (!token || !savedUserId) {
      set({ isAuthenticated: false, currentUser: null });
      return;
    }

    try {
      set({ isLoading: true });
      const response = await userAPI.getById(Number(savedUserId));
      
      set({ 
        currentUser: response.data, 
        isAuthenticated: true, 
        isLoading: false 
      });

      get().fetchUserStats(response.data.id);
      get().fetchAchievements({ student: response.data.id });
      get().fetchSkills();
    } catch (error) {
      console.error("Auth check failed:", error);
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
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