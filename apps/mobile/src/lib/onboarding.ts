import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// Same key and value as the Next app's localStorage flag, so returning web users skip onboarding
// (AsyncStorage on web is backed by localStorage with the raw key).
export const ONBOARDING_KEY = 'dogexplorer_onboarding_completed';

type OnboardingState = {
  /** null until read from storage. */
  completed: boolean | null;
  load: () => Promise<void>;
  complete: () => Promise<void>;
};

export const useOnboarding = create<OnboardingState>((set, get) => ({
  completed: null,
  load: async () => {
    if (get().completed !== null) return;
    try {
      set({ completed: (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true' });
    } catch {
      set({ completed: true });
    }
  },
  complete: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ completed: true });
  },
}));
