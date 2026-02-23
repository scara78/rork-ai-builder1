import { create } from 'zustand';

interface ErrorState {
  hasError: boolean;
  message: string | null;
  setError: (message: string) => void;
  clear: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  hasError: false,
  message: null,
  setError: (message) => set({ hasError: true, message }),
  clear: () => set({ hasError: false, message: null }),
}));
