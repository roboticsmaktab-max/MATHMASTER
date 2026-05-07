export type Language = 'uz' | 'ru' | 'en';

export enum Grade {
  G1 = 1, G2, G3, G4, G5, G6, G7, G8, G9, G10, G11
}

export enum Subject {
  MATH = 'Math',
  ALGEBRA = 'Algebra',
  GEOMETRY = 'Geometry'
}

export enum TestType {
  QUIZ = 'Quiz',
  EXAM = 'Exam' // Nazorat ishi
}

export type Variant = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // index
  explanation: string;
}

export interface TestResult {
  id: string;
  testId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  wrongAnswers: {
    questionId: string;
    userAnswer: number;
    correctAnswer: number;
  }[];
}

export interface UserSettings {
  language: Language;
  theme: 'light' | 'dark';
  grade: Grade;
  name: string;
}
