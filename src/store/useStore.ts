import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings, Grade, Subject, Question, TestResult } from '../types';

interface AppState {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  currentTest: Question[] | null;
  setCurrentTest: (test: Question[] | null) => void;
  testResults: TestResult[];
  addTestResult: (result: TestResult) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      settings: {
        language: 'uz',
        theme: 'light',
        grade: Grade.G1,
        name: 'Guest'
      },
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      currentTest: null,
      setCurrentTest: (test) => set({ currentTest: test }),
      testResults: [],
      addTestResult: (result) => set((state) => ({
        testResults: [result, ...state.testResults]
      }))
    }),
    {
      name: 'math-master-storage'
    }
  )
);
