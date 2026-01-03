import { ResponseRow, FullAnalysis, SectionAnalytics, TopicAnalytics, PriorityAction } from '../types';

// Heuristics for "Ideal Time" (seconds)
const IDEAL_TIME = {
  Easy: 45,
  Medium: 90,
  Hard: 150,
};

const DIFFICULTY_WEIGHT = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

export const analyzeMockData = (data: ResponseRow[], importantTopics: string[] = []): FullAnalysis => {
  if (data.length === 0) throw new Error("No data provided");

  const mockId = data[0].mock_id;
  const sections: Record<string, ResponseRow[]> = {};
  
  // Group by section
  data.forEach(row => {
    if (!sections[row.section]) sections[row.section] = [];
    sections[row.section].push(row);
  });

  const sectionAnalytics: SectionAnalytics[] = [];
  const allTopicStats: TopicAnalytics[] = [];

  let totalCorrect = 0;
  let totalAttempts = 0;
  let totalTime = 0;

  // Process each section
  Object.keys(sections).forEach(sectionName => {
    const rows = sections[sectionName];
    const topicMap: Record<string, { 
      total: number; 
      correct: number; 
      time: number; 
      difficultySum: number;
      attemptedCount: number;
    }> = {};

    let sectionCorrect = 0;
    let sectionTime = 0;

    rows.forEach(row => {
      if (!topicMap[row.topic]) {
        topicMap[row.topic] = { total: 0, correct: 0, time: 0, difficultySum: 0, attemptedCount: 0 };
      }
      
      topicMap[row.topic].total += 1;
      topicMap[row.topic].difficultySum += DIFFICULTY_WEIGHT[row.difficulty];
      
      if (row.attempted) {
        topicMap[row.topic].attemptedCount += 1;
        topicMap[row.topic].time += row.time_taken_seconds;
        sectionTime += row.time_taken_seconds;
        totalAttempts += 1;

        if (row.is_correct) {
          topicMap[row.topic].correct += 1;
          sectionCorrect += 1;
          totalCorrect += 1;
        }
      }
    });

    totalTime += sectionTime;

    const topics: TopicAnalytics[] = Object.keys(topicMap).map(topic => {
      const stats = topicMap[topic];
      const accuracy = stats.attemptedCount > 0 ? (stats.correct / stats.attemptedCount) * 100 : 0;
      const avgTime = stats.attemptedCount > 0 ? stats.time / stats.attemptedCount : 0;
      const avgDiff = stats.difficultySum / stats.total;
      const isImportant = importantTopics.includes(topic);

      // Rule-Based Classification Matrix
      let status: TopicAnalytics['status'] = 'Needs Practice';
      
      const idealTimeForTopic = (avgDiff <= 1.5 ? IDEAL_TIME.Easy : (avgDiff <= 2.5 ? IDEAL_TIME.Medium : IDEAL_TIME.Hard));
      
      if (stats.attemptedCount < 2) { // Lower threshold for demo data
        status = 'Needs Practice'; 
      } else if (accuracy >= 85) {
        if (avgTime > idealTimeForTopic * 1.3) {
          status = 'Speed Issue';
        } else {
          status = 'Mastered';
        }
      } else if (accuracy < 50) {
        if (avgTime < idealTimeForTopic * 0.4) {
          status = 'Guessing'; 
        } else {
          status = 'Conceptual Gap'; 
        }
      } else {
        status = 'Accuracy Issue';
      }

      const analytics: TopicAnalytics = {
        topic,
        attempts: stats.attemptedCount,
        correct: stats.correct,
        accuracy,
        avgTime,
        totalTime: stats.time,
        difficultyIndex: avgDiff,
        status,
        isImportant
      };
      
      allTopicStats.push(analytics);
      return analytics;
    });

    sectionAnalytics.push({
      section: sectionName,
      score: sectionCorrect * 4 - (totalAttempts - sectionCorrect), 
      accuracy: rows.filter(r => r.attempted).length > 0 ? (sectionCorrect / rows.filter(r => r.attempted).length) * 100 : 0,
      avgTime: rows.filter(r => r.attempted).length > 0 ? sectionTime / rows.filter(r => r.attempted).length : 0,
      topics
    });
  });

  // Priority Index Logic
  const sortedByWeakness = [...allTopicStats].sort((a, b) => {
    // Boost score if it's an important topic
    const importanceBoostA = a.isImportant ? 50 : 0;
    const importanceBoostB = b.isImportant ? 50 : 0;

    const scoreA = (100 - a.accuracy) * Math.log(a.attempts + 1) + importanceBoostA;
    const scoreB = (100 - b.accuracy) * Math.log(b.attempts + 1) + importanceBoostB;
    return scoreB - scoreA;
  });

  const priorityList: PriorityAction[] = [];

  // Top items to Focus
  sortedByWeakness.filter(t => (t.status === 'Conceptual Gap' || t.status === 'Accuracy Issue' || t.isImportant) && t.attempts > 0).slice(0, 4).forEach(t => {
    priorityList.push({
      type: 'FOCUS',
      topic: t.topic,
      isHighPriority: t.isImportant,
      reason: t.isImportant 
        ? `CRITICAL EXAM TOPIC: Low performance in this high-weightage area.` 
        : `High error rate (${Math.round(t.accuracy)}%) despite ${t.attempts} attempts.`
    });
  });

  // Top items to Pause
  sortedByWeakness.filter(t => t.status === 'Conceptual Gap' && t.avgTime > 120 && !t.isImportant).slice(0, 2).forEach(t => {
    priorityList.push({
      type: 'PAUSE',
      topic: t.topic,
      reason: `Time sink. Avg time ${Math.round(t.avgTime)}s with low accuracy.`
    });
  });

  // Revise
  const mastered = allTopicStats.filter(t => t.status === 'Mastered');
  if (mastered.length > 0) {
    const randomMastered = mastered[Math.floor(Math.random() * mastered.length)];
    priorityList.push({
      type: 'REVISE',
      topic: randomMastered.topic,
      reason: `Keep ${randomMastered.topic} sharp. Accuracy is good, maintain speed.`
    });
  }

  return {
    overallAccuracy: (totalCorrect / totalAttempts) * 100,
    overallScore: totalCorrect * 4 - (totalAttempts - totalCorrect),
    sections: sectionAnalytics,
    priorityList,
    weakestTopics: sortedByWeakness.slice(0, 5).map(t => t.topic),
    strongestTopics: [...allTopicStats].sort((a, b) => b.accuracy - a.accuracy).slice(0, 5).map(t => t.topic),
    totalTime,
    mockId
  };
};

// Generate Mock Data for immediate visualization
export const generateMockData = (mockId: string = 'IPMAT_MOCK_DEMO'): ResponseRow[] => {
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
      for (let i = 0; i < 5; i++) { // 5 questions per topic
        const isAttempted = Math.random() > 0.1;
        const isCorrect = isAttempted && Math.random() > 0.4; // 60% error rate roughly
        const time = Math.floor(Math.random() * 180) + 20;
        
        rows.push({
          student_id: 'STU_DEMO',
          mock_id: mockId,
          question_id: `${sec.substring(0,2)}_${top.substring(0,3)}_${i}`,
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
