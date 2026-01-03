export interface ResponseRow {
  student_id: string;
  mock_id: string;
  question_id: string;
  section: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  attempted: boolean;
  student_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  time_taken_seconds: number;
}

export interface TopicAnalytics {
  topic: string;
  attempts: number;
  correct: number;
  accuracy: number;
  avgTime: number;
  totalTime: number;
  difficultyIndex: number; // 1 for Easy, 2 Medium, 3 Hard (avg)
  status: 'Mastered' | 'Speed Issue' | 'Accuracy Issue' | 'Conceptual Gap' | 'Guessing' | 'Needs Practice';
  isImportant?: boolean; // New flag based on Admin config
}

export interface SectionAnalytics {
  section: string;
  score: number;
  accuracy: number;
  avgTime: number;
  topics: TopicAnalytics[];
}

export interface PriorityAction {
  type: 'FOCUS' | 'PAUSE' | 'REVISE';
  topic: string;
  reason: string;
  isHighPriority?: boolean; // From Admin config
}

export interface FullAnalysis {
  overallAccuracy: number;
  overallScore: number; // Raw count
  sections: SectionAnalytics[];
  priorityList: PriorityAction[];
  weakestTopics: string[];
  strongestTopics: string[];
  totalTime: number;
  mockId: string;
}

export interface MockSummary {
  id: string;
  date: string;
  score: number;
  accuracy: number;
  avgTime: number;
  examType: string; // e.g., 'IPMAT', 'CAT'
}

// New Types for Admin/Student Features
export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[]; // e.g., ['IPMAT 2025', 'Crash Course']
  avatar?: string;
}

export interface ExamConfig {
  id: string; // e.g., 'IPMAT'
  name: string;
  importantTopics: string[]; // Topics marked critical by Admin
}

export interface MockAttempt {
  id: string;
  studentId: string;
  examId: string;
  date: string;
  data: ResponseRow[];
  summary: MockSummary;
}
