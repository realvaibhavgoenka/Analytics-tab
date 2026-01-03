import { ResponseRow } from '../types';

// --- CONFIGURATION FOR GRAPHY ---

// 1. STANDARD GRAPHY API URL
const API_BASE_URL = "https://api.graphy.com/v1"; 

// 2. YOUR CREDENTIALS
// WARNING: When hosting on public GitHub, DO NOT leave real keys here.
// Anyone can see your code. For a public demo, use MOCK data.
const MERCHANT_ID = "vaibhavgoenka9115";
const API_TOKEN = "8245796e-a533-4132-8f39-adcd004ea1cc";

// 3. LIVE MODE SWITCH
//    IMPORTANT FOR GITHUB: Keep this 'false'.
//    Browsers block requests to external APIs (CORS) from GitHub Pages.
//    If set to 'true', the app will likely fail to load data online.
const LIVE_MODE = false; 

export const fetchStudentMocks = async (studentId: string): Promise<ResponseRow[]> => {
  if (LIVE_MODE) {
    try {
      console.log(`[Graphy API] Fetching reports for student: ${studentId}...`);
      
      const response = await fetch(`${API_BASE_URL}/reports/test-series/${studentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_TOKEN,
          'x-merchant-id': MERCHANT_ID
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized: Check API Key");
        if (response.status === 404) throw new Error("Student data not found");
        throw new Error(`API Error: ${response.status}`);
      }

      const realData = await response.json();
      return mapGraphyResponseToApp(realData);

    } catch (error) {
      console.error("Failed to fetch live data.", error);
      console.warn("Falling back to simulated data due to API/CORS error.");
      // Graceful fallback so the app doesn't break on GitHub
      return mockBackendResponse(studentId);
    }
  }

  // --- DEMO MODE (SIMULATION) ---
  console.log(`[Demo API] Generating mock data for simulation...`);
  await new Promise(resolve => setTimeout(resolve, 800)); 
  return mockBackendResponse(studentId);
};

// Helper: Map the raw API JSON to our app's format
const mapGraphyResponseToApp = (apiData: any): ResponseRow[] => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item: any) => ({
    student_id: item.userId || 'UNKNOWN',
    mock_id: item.testId || 'UNKNOWN',
    question_id: item.questionId || 'Q_UNKNOWN',
    section: item.sectionName || 'General',
    topic: item.topic || 'Uncategorized',
    difficulty: item.difficulty || 'Medium',
    attempted: item.status === 'ATTEMPTED',
    student_answer: item.userAnswer,
    correct_answer: item.correctAnswer,
    is_correct: item.isCorrect,
    time_taken_seconds: item.timeTaken || 0
  }));
};

export const fetchGraphyData = async (email: string, password: string): Promise<ResponseRow[]> => {
  console.log(`[Graphy Integration] Fetching data for: ${email}`);
  await new Promise(resolve => setTimeout(resolve, 1500));
  const studentId = 'STU_' + email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
  return mockBackendResponse(studentId);
};

const mockBackendResponse = (studentId: string): ResponseRow[] => {
  const mockId = `MOCK_LIVE_${Math.floor(Math.random() * 1000)}`;
  const sections = ['Quantitative Ability (SA)', 'Quantitative Ability (MCQ)', 'Verbal Ability'];
  const topics = {
    'Quantitative Ability (SA)': ['Logarithms', 'Functions', 'Geometry', 'P&C'],
    'Quantitative Ability (MCQ)': ['Numbers', 'Arithmetic', 'Algebra', 'Modern Math'],
    'Verbal Ability': ['RC', 'Parajumbles', 'Grammar', 'Vocabulary']
  };

  const rows: ResponseRow[] = [];
  
  sections.forEach(sec => {
    // @ts-ignore
    topics[sec].forEach((top, idx) => {
      for (let i = 0; i < 5; i++) { 
        const isAttempted = Math.random() > 0.2;
        const isCorrect = isAttempted && Math.random() > 0.4;
        const time = Math.floor(Math.random() * 120) + 30;
        
        rows.push({
          student_id: studentId,
          mock_id: mockId,
          question_id: `Q_${sec.substring(0,2)}_${top.substring(0,3)}_${i}`,
          section: sec,
          topic: top,
          difficulty: Math.random() > 0.6 ? 'Hard' : (Math.random() > 0.3 ? 'Medium' : 'Easy'),
          attempted: isAttempted,
          student_answer: isAttempted ? (isCorrect ? 'A' : 'B') : null,
          correct_answer: 'A',
          is_correct: isCorrect,
          time_taken_seconds: isAttempted ? time : 0
        });
      }
    });
  });
  return rows;
};