import { StudentProfile, ExamConfig, MockAttempt, MockSummary, ResponseRow } from '../types';
import { generateMockData } from './analyticsEngine';

// --- SEED DATA ---

const MOCK_STUDENTS: StudentProfile[] = [
  { id: 'STU_001', name: 'Arjun Mehta', email: 'arjun.m@example.com', enrolledCourses: ['IPMAT Comprehensive', 'CAT Basics'], avatar: '👨🏻‍🎓' },
  { id: 'STU_002', name: 'Sarah Jenkins', email: 'sarah.j@example.com', enrolledCourses: ['IPMAT Crash Course'], avatar: '👩🏼‍🎓' },
  { id: 'STU_003', name: 'Rohan Gupta', email: 'rohan.g@example.com', enrolledCourses: ['IPMAT Comprehensive'], avatar: '👨🏽‍💻' },
];

const INITIAL_EXAM_CONFIGS: ExamConfig[] = [
  { 
    id: 'IPMAT', 
    name: 'IPMAT (Indore/Rohtak)', 
    importantTopics: ['Logarithms', 'Functions', 'Parajumbles', 'Geometry'] 
  },
  { 
    id: 'CAT', 
    name: 'Common Admission Test', 
    importantTopics: ['Arithmetic', 'RC', 'DILR Sets'] 
  }
];

// Helper to generate history for students
const generateHistory = (studentId: string): MockAttempt[] => {
  const attempts: MockAttempt[] = [];
  const count = 3 + Math.floor(Math.random() * 3); // 3 to 5 mocks per student

  for (let i = 1; i <= count; i++) {
    const mockId = `MOCK_${202500 + i}`;
    const rawData = generateMockData(mockId);
    // Fix student ID in raw data
    rawData.forEach(r => r.student_id = studentId);

    // Calculate quick summary
    const totalQ = rawData.length;
    const attempted = rawData.filter(r => r.attempted);
    const correct = attempted.filter(r => r.is_correct).length;
    const score = correct * 4 - (attempted.length - correct);
    
    attempts.push({
      id: mockId,
      studentId,
      examId: 'IPMAT',
      date: new Date(Date.now() - (1000 * 60 * 60 * 24 * (count - i) * 7)).toISOString().split('T')[0], // spaced weekly
      data: rawData,
      summary: {
        id: mockId,
        date: new Date(Date.now() - (1000 * 60 * 60 * 24 * (count - i) * 7)).toISOString().split('T')[0],
        score,
        accuracy: attempted.length ? (correct / attempted.length) * 100 : 0,
        avgTime: attempted.length ? attempted.reduce((a, b) => a + b.time_taken_seconds, 0) / attempted.length : 0,
        examType: 'IPMAT'
      }
    });
  }
  return attempts;
};

// --- STORE IMPLEMENTATION ---

class DataStore {
  private students: StudentProfile[] = MOCK_STUDENTS;
  private examConfigs: ExamConfig[] = INITIAL_EXAM_CONFIGS;
  private attempts: Record<string, MockAttempt[]> = {}; // Key: studentId

  constructor() {
    // Initialize mocks for seeded students
    this.students.forEach(s => {
      this.attempts[s.id] = generateHistory(s.id);
    });
  }

  // STUDENT METHODS
  getStudents() { return this.students; }
  
  getStudent(id: string) { return this.students.find(s => s.id === id); }

  getStudentHistory(studentId: string) {
    return this.attempts[studentId] || [];
  }

  getMockDetails(studentId: string, mockId: string) {
    return this.attempts[studentId]?.find(m => m.id === mockId);
  }

  // ADMIN METHODS
  getExamConfigs() { return this.examConfigs; }

  updateExamConfig(examId: string, topics: string[]) {
    const config = this.examConfigs.find(e => e.id === examId);
    if (config) {
      config.importantTopics = topics;
    }
  }

  addExamConfig(name: string) {
    this.examConfigs.push({
      id: name.toUpperCase().replace(/\s+/g, '_'),
      name,
      importantTopics: []
    });
  }

  // DATA INGESTION
  addAttempt(studentId: string, attempt: MockAttempt) {
    if (!this.attempts[studentId]) this.attempts[studentId] = [];
    this.attempts[studentId].push(attempt);
  }
}

export const db = new DataStore();
