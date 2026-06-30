export interface MicroMilestone {
  id: string;
  title: string;
  duration: number; // in minutes
  status: 'pending' | 'completed';
  startingAction: string; // bite-sized micro-action to break friction
}

export interface Task {
  id: string;
  title: string;
  category: 'Work' | 'Study' | 'Health' | 'Chores' | 'Personal' | 'General';
  deadline: string; // ISO string
  anxietyLevel: number; // 1 to 10
  excuse: string; // User excuse
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  panicIndex: number; // 0 to 100
  status: 'pending' | 'completed';
  createdAt: string;
  estimatedDuration: number; // minutes
  microMilestones: MicroMilestone[];
  copingMechanism: string; // Psychological tip
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  history: string[]; // dates formatted YYYY-MM-DD
  recommendedTime: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CoachSettings {
  persona: 'sergeant' | 'zen' | 'strategist' | 'friendly';
  dailyFocusGoal: number; // minutes
  userName: string;
}
