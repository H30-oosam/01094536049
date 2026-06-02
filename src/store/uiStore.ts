import { create } from 'zustand';

interface UIState {
  isRTL: boolean;
  theme: 'light' | 'dark';
  logoUrl: string;
  systemName: string;
  currency: string;
  sidebarOpen: boolean;
  toggleRTL: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  updateBranding: (branding: { logoUrl?: string; systemName?: string }) => void;
  setCurrency: (currency: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isRTL: true,
  theme: 'light',
  logoUrl: '/logo.svg',
  systemName: 'أكاديمية زويل | Zewail Academy',
  currency: 'EGP',
  sidebarOpen: false,
  toggleRTL: () => set((state) => ({ isRTL: !state.isRTL })),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  updateBranding: (branding) => set((state) => ({ ...state, ...branding })),
  setCurrency: (currency) => set({ currency }),
}));
