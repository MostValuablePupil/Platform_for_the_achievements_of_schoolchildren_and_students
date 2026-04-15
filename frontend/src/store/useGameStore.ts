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
  fetchCurrentUser: (userId: number) => Promise<void>;
  fetchUserStats: (userId: number) => Promise<void>;
  fetchAchievements: (params?: any) => Promise<void>;
  createAchievement: (data: FormData) => Promise<void>;  // ← ИСПРАВЛЕНО
  verifyAchievement: (id: number) => Promise<void>;
  rejectAchievement: (id: number) => Promise<void>;
  fetchSkills: (profileId?: number) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentUser: null,
  userStats: null,
  achievements: [],
  skills: [],
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (username: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.login(username, password);
      const token = response.data.token;
      localStorage.setItem('token', token);
      
      const users = await userAPI.getAll();
      const user = users.data.find((u: User) => u.username === username);
      
      if (user) {
        set({ 
          currentUser: user,
          isAuthenticated: true,
          isLoading: false 
        });
        
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

  logout: () => {
    localStorage.removeItem('token');
    set({ 
      currentUser: null,
      userStats: null,
      achievements: [],
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

  createAchievement: async (data: FormData) => {  // ← ИСПРАВЛЕНО ЗДЕСЬ
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
