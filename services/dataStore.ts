import { StudentProfile, ExamConfig, MockAttempt, MockSummary, ResponseRow } from '../types';

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

// --- STORE IMPLEMENTATION ---

class DataStore {
  private students: StudentProfile[] = [];
  private examConfigs: ExamConfig[] = INITIAL_EXAM_CONFIGS;
  private attempts: Record<string, MockAttempt[]> = {}; // Key: studentId

  constructor() {
    // Start empty to allow "Real Data" import.
    // If you need demo data, user can now import it via JSON.
  }

  // --- DATA INGESTION ENGINE (ETL) ---
  
  /**
   * Takes a flat array of ResponseRow objects (from CSV/JSON) containing multiple students/mocks
   * and reconstructs the entire relational database (Students -> Mocks -> Data).
   */
  bulkIngest(rawData: ResponseRow[]) {
    console.log(`[DataStore] Ingesting ${rawData.length} rows of real data...`);
    
    // 1. Identify Unique Students
    const studentMap = new Map<string, StudentProfile>();
    
    rawData.forEach(row => {
      if (!row.student_id) return;
      if (!studentMap.has(row.student_id)) {
        studentMap.set(row.student_id, {
          id: row.student_id,
          name: row.student_id, // Default to ID if name unknown, ideally pass name in row or separate mapping
          email: `${row.student_id.toLowerCase()}@student.entranceug.com`,
          enrolledCourses: ['Imported Batch'],
          avatar: '🎓'
        });
      }
    });

    // 2. Group Rows by Student -> Mock
    const tempAttempts: Record<string, Record<string, ResponseRow[]>> = {};

    rawData.forEach(row => {
      if (!tempAttempts[row.student_id]) tempAttempts[row.student_id] = {};
      if (!tempAttempts[row.student_id][row.mock_id]) tempAttempts[row.student_id][row.mock_id] = [];
      tempAttempts[row.student_id][row.mock_id].push(row);
    });

    // 3. Construct MockAttempt Objects
    this.students = Array.from(studentMap.values());
    this.attempts = {}; // Reset attempts

    this.students.forEach(student => {
      const studentMocks = tempAttempts[student.id];
      if (!studentMocks) return;

      this.attempts[student.id] = [];

      Object.entries(studentMocks).forEach(([mockId, rows]) => {
        // Calculate Summary on the fly
        const attempted = rows.filter(r => r.attempted);
        const correct = attempted.filter(r => r.is_correct).length;
        const score = correct * 4 - (attempted.length - correct);
        const accuracy = attempted.length ? (correct / attempted.length) * 100 : 0;
        const avgTime = attempted.length ? attempted.reduce((a, b) => a + b.time_taken_seconds, 0) / attempted.length : 0;

        this.attempts[student.id].push({
          id: mockId,
          studentId: student.id,
          examId: 'IPMAT', // Defaulting to IPMAT, logic can be enhanced to infer from section names
          date: new Date().toISOString().split('T')[0], // Current date of import
          data: rows,
          summary: {
            id: mockId,
            date: new Date().toISOString().split('T')[0],
            score,
            accuracy,
            avgTime,
            examType: 'IPMAT'
          }
        });
      });
    });

    console.log(`[DataStore] Ingestion Complete. ${this.students.length} students loaded.`);
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

  addAttempt(studentId: string, attempt: MockAttempt) {
    if (!this.attempts[studentId]) this.attempts[studentId] = [];
    this.attempts[studentId].push(attempt);
  }
}

export const db = new DataStore();