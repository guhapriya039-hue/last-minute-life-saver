import React, { useState, useEffect } from 'react';
import { 
  Clock, ShieldAlert, Sparkles, Brain, Trophy, Activity, Flame,
  CheckCircle2, Info, Compass, HelpCircle, HeartPulse, UserCheck, MessageSquareCode
} from 'lucide-react';
import { db, isFirebaseAvailable } from './lib/firebase';
import { 
  collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, orderBy 
} from 'firebase/firestore';

import { Task, Habit, ChatMessage, CoachSettings } from './types';
import TaskCenter from './components/TaskCenter';
import AutopilotMode from './components/AutopilotMode';
import CoachChat from './components/CoachChat';
import HabitsTracker from './components/HabitsTracker';
import CalendarSchedule from './components/CalendarSchedule';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // App states
  const [persona, setPersona] = useState<CoachSettings['persona']>('friendly');
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingHabits, setIsLoadingHabits] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [apiKeyWarning, setApiKeyWarning] = useState(false);

  // 1. Initial State Syncing
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch Tasks
      try {
        if (isFirebaseAvailable && db) {
          const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          const fbTasks: Task[] = [];
          snapshot.forEach((docSnap) => {
            fbTasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
          });
          
          if (fbTasks.length > 0) {
            setTasks(fbTasks);
            localStorage.setItem('zenith_tasks', JSON.stringify(fbTasks));
          } else {
            // Load fallback from localStorage if firestore is empty
            const localTasks = localStorage.getItem('zenith_tasks');
            if (localTasks) setTasks(JSON.parse(localTasks));
          }
        } else {
          const localTasks = localStorage.getItem('zenith_tasks');
          if (localTasks) setTasks(JSON.parse(localTasks));
        }
      } catch (err) {
        console.warn("Firestore task fetch failed, loading local storage:", err);
        const localTasks = localStorage.getItem('zenith_tasks');
        if (localTasks) setTasks(JSON.parse(localTasks));
      } finally {
        setIsLoadingTasks(false);
      }

      // Fetch Habits
      try {
        if (isFirebaseAvailable && db) {
          const snapshot = await getDocs(collection(db, 'habits'));
          const fbHabits: Habit[] = [];
          snapshot.forEach((docSnap) => {
            fbHabits.push({ id: docSnap.id, ...docSnap.data() } as Habit);
          });

          if (fbHabits.length > 0) {
            setHabits(fbHabits);
            localStorage.setItem('zenith_habits', JSON.stringify(fbHabits));
          } else {
            const localHabits = localStorage.getItem('zenith_habits');
            if (localHabits) setHabits(JSON.parse(localHabits));
          }
        } else {
          const localHabits = localStorage.getItem('zenith_habits');
          if (localHabits) setHabits(JSON.parse(localHabits));
        }
      } catch (err) {
        console.warn("Firestore habits fetch failed, loading local storage:", err);
        const localHabits = localStorage.getItem('zenith_habits');
        if (localHabits) setHabits(JSON.parse(localHabits));
      } finally {
        setIsLoadingHabits(false);
      }

      // Fetch Chat History
      const localChat = localStorage.getItem('zenith_chat');
      if (localChat) setMessages(JSON.parse(localChat));
    };

    fetchInitialData();
  }, []);

  // 2. Task Handlers
  const handleAddTask = async (taskData: {
    title: string;
    category: Task['category'];
    deadline: string;
    anxietyLevel: number;
    excuse: string;
  }) => {
    try {
      // Trigger AI triage endpoint on our custom backend
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) throw new Error("Failed to triage task on server");
      const result = await response.json();

      if (result.apiKeyMissing) {
        setApiKeyWarning(true);
      }

      const newTask: Task = {
        id: 'task_' + Date.now(),
        title: taskData.title,
        category: taskData.category,
        deadline: taskData.deadline,
        anxietyLevel: taskData.anxietyLevel,
        excuse: taskData.excuse,
        priority: result.priority || 'Medium',
        panicIndex: result.panicIndex || 50,
        status: 'pending',
        createdAt: new Date().toISOString(),
        estimatedDuration: (result.microMilestones || []).reduce((sum: number, mm: any) => sum + (mm.duration || 10), 0),
        microMilestones: (result.microMilestones || []).map((mm: any, idx: number) => ({
          id: 'mm_' + Date.now() + '_' + idx,
          title: mm.title,
          duration: mm.duration,
          status: 'pending',
          startingAction: mm.startingAction
        })),
        copingMechanism: result.copingMechanism || 'Accept the tension, take one small breath, and open your work tool. 5 seconds is all you need.'
      };

      const updatedTasks = [newTask, ...tasks];
      setTasks(updatedTasks);
      localStorage.setItem('zenith_tasks', JSON.stringify(updatedTasks));

      // Sync with Firestore in background
      if (isFirebaseAvailable && db) {
        await setDoc(doc(db, 'tasks', newTask.id), newTask);
      }

    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem('zenith_tasks', JSON.stringify(updated));

    if (activeTask?.id === id) setActiveTask(null);

    if (isFirebaseAvailable && db) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (err) {
        console.warn("Firestore delete failed:", err);
      }
    }
  };

  const handleToggleComplete = async (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const newStatus = t.status === 'completed' ? 'pending' : 'completed';
        return { ...t, status: newStatus as any };
      }
      return t;
    });

    setTasks(updated);
    localStorage.setItem('zenith_tasks', JSON.stringify(updated));

    const updatedTask = updated.find(t => t.id === id);
    if (updatedTask) {
      if (activeTask?.id === id) setActiveTask(updatedTask);
      
      if (isFirebaseAvailable && db) {
        try {
          await setDoc(doc(db, 'tasks', id), updatedTask);
        } catch (err) {
          console.warn("Firestore update failed:", err);
        }
      }
    }
  };

  const handleUpdateMilestones = async (taskId: string, milestones: Task['microMilestones']) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, microMilestones: milestones };
      }
      return t;
    });

    setTasks(updated);
    localStorage.setItem('zenith_tasks', JSON.stringify(updated));

    const target = updated.find(t => t.id === taskId);
    if (target) {
      setActiveTask(target);
      if (isFirebaseAvailable && db) {
        try {
          await updateDoc(doc(db, 'tasks', taskId), { microMilestones: milestones });
        } catch (err) {
          console.warn("Firestore update milestones failed:", err);
        }
      }
    }
  };

  const handleCompleteEntireTask = async (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        // Mark all milestones completed & status as completed
        const completedMilestones = t.microMilestones.map(m => ({ ...m, status: 'completed' as const }));
        return { ...t, status: 'completed' as const, microMilestones: completedMilestones };
      }
      return t;
    });

    setTasks(updated);
    localStorage.setItem('zenith_tasks', JSON.stringify(updated));
    setActiveTask(null);

    const target = updated.find(t => t.id === taskId);
    if (target && isFirebaseAvailable && db) {
      try {
        await setDoc(doc(db, 'tasks', taskId), target);
      } catch (err) {
        console.warn("Firestore update status failed:", err);
      }
    }
  };

  // 3. Habits Handlers
  const handleAddHabit = async (name: string, recommendedTime: string = '09:00 AM') => {
    const newHabit: Habit = {
      id: 'habit_' + Date.now(),
      name,
      streak: 0,
      history: [],
      recommendedTime,
      createdAt: new Date().toISOString()
    };

    const updatedHabits = [newHabit, ...habits];
    setHabits(updatedHabits);
    localStorage.setItem('zenith_habits', JSON.stringify(updatedHabits));

    if (isFirebaseAvailable && db) {
      try {
        await setDoc(doc(db, 'habits', newHabit.id), newHabit);
      } catch (err) {
        console.warn("Firestore save habit failed:", err);
      }
    }
  };

  const handleToggleHabit = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id === id) {
        let newHistory = [...h.history];
        let newStreak = h.streak;

        if (newHistory.includes(today)) {
          // Remove today's completion
          newHistory = newHistory.filter(d => d !== today);
          newStreak = Math.max(0, newStreak - 1);
        } else {
          // Add today's completion
          newHistory.push(today);
          newStreak += 1;
        }

        return { ...h, history: newHistory, streak: newStreak };
      }
      return h;
    });

    setHabits(updated);
    localStorage.setItem('zenith_habits', JSON.stringify(updated));

    const target = updated.find(h => h.id === id);
    if (target && isFirebaseAvailable && db) {
      try {
        await setDoc(doc(db, 'habits', id), target);
      } catch (err) {
        console.warn("Firestore update habit failed:", err);
      }
    }
  };

  const handleDeleteHabit = async (id: string) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    localStorage.setItem('zenith_habits', JSON.stringify(updated));

    if (isFirebaseAvailable && db) {
      try {
        await deleteDoc(doc(db, 'habits', id));
      } catch (err) {
        console.warn("Firestore delete habit failed:", err);
      }
    }
  };

  // 4. Chat Coach Handlers
  const handleSendMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem('zenith_chat', JSON.stringify(updatedMessages));
    setIsSendingMessage(true);

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          currentTask: activeTask,
          persona
        })
      });

      if (!response.ok) throw new Error("Coach failed to respond");
      const result = await response.json();

      if (result.apiKeyMissing) {
        setApiKeyWarning(true);
      }

      const assistantMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_coach',
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      localStorage.setItem('zenith_chat', JSON.stringify(finalMessages));

    } catch (err) {
      console.error(err);
      // Fallback response if offline
      const assistantMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_coach',
        role: 'assistant',
        content: "I'm experiencing a brief connection drift, but my advice stays steady: break whatever is in front of you into a 2-minute step, and do that first. What is the single easiest starting motion you can make?",
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      localStorage.setItem('zenith_chat', JSON.stringify(finalMessages));
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem('zenith_chat');
  };

  // 5. Stat calculations
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  
  const avgAnxiety = pendingTasks.length > 0 
    ? Math.round(pendingTasks.reduce((sum, t) => sum + t.anxietyLevel, 0) / pendingTasks.length) 
    : 0;

  const maxPanic = pendingTasks.length > 0
    ? Math.max(...pendingTasks.map(t => t.panicIndex))
    : 0;

  const activeHabitStreak = habits.length > 0
    ? Math.max(...habits.map(h => h.streak))
    : 0;

  // Diagnostic report
  const getAnxietyDiagnosis = (score: number) => {
    if (score >= 8) return { label: 'CRITICAL OVERLOAD', style: 'text-red-400 bg-red-500/10 border-red-500/20', desc: 'Fight-or-Flight highly active. AI Coach Sergeant persona highly recommended.' };
    if (score >= 5) return { label: 'RISING FRICTION', style: 'text-amber-400 bg-amber-500/10 border-amber-500/20', desc: 'Resistance levels are high. Use Pomodoro Autopilot mode immediately.' };
    if (score >= 3) return { label: 'MODERATE HUMMING', style: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', desc: 'Some tasks are active but manageable. Keep checking off consistency streaks.' };
    return { label: 'SERENE MINDFUL STATE', style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', desc: 'All cognitive channels clear. You are in optimal flow territory.' };
  };

  const diagnostic = getAnxietyDiagnosis(avgAnxiety);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-violet-600/30">
      
      {/* Background ambient glowing shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/15 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/15 blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* API Key Missing Floating Warning Banner */}
      {apiKeyWarning && (
        <div id="api_warning" className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 px-4 py-2.5 text-xs text-center font-medium relative z-50 flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Zenith is running in <strong>Demo Fallback Mode</strong> because <code>GEMINI_API_KEY</code> isn't configured in your Secrets. Core features are simulated beautifully so you can explore the workflow!</span>
          <button 
            id="btn_dismiss_warning"
            onClick={() => setApiKeyWarning(false)} 
            className="underline hover:text-white ml-2 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Top bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-violet-950/20 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black font-display tracking-tight text-white flex items-center gap-1.5 leading-none">
                ZENITH
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">
                  Antiprocrastination Autopilot
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Proactive Productivity Companion for Overwhelmed Minds</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">Autopilot: Calibrated</span>
            </div>
            <a 
              href="#btn_toggle_form" 
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold font-display flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5" />
              How it works
            </a>
          </div>
        </div>
      </header>

      {/* Main Body container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 relative z-10">

        {/* BENTO STATS WIDGETS DISPLAY - Hidden during intense full-screen Autopilot Mode */}
        {!activeTask && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Widget 1: Highest Panic Gauge */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-900 p-5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Peak Panic Alert</span>
                <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
                  {maxPanic}%
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {maxPanic >= 80 ? '⚠️ High Danger! Clear a milestone right now.' : 'Zen state under control.'}
                </p>
              </div>
              <div className={`p-3.5 rounded-xl ${maxPanic >= 80 ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' : 'bg-slate-950 text-slate-500 border border-slate-850'}`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>

            {/* Widget 2: Tasks Completed Ratio */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-900 p-5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Deadlines Crushed</span>
                <div className="text-3xl font-extrabold font-mono tracking-tight text-white flex items-baseline gap-1.5">
                  <span>{completedTasksCount}</span>
                  <span className="text-xs text-slate-500 font-medium font-sans">completed</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {pendingTasks.length} urgent tasks pending.
                </p>
              </div>
              <div className="p-3.5 bg-slate-950 text-emerald-400 border border-slate-850 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* Widget 3: Consistency Streak */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-900 p-5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Peak Routine Streak</span>
                <div className="text-3xl font-extrabold font-mono tracking-tight text-white flex items-baseline gap-1">
                  <span>{activeHabitStreak}</span>
                  <span className="text-xs text-slate-500 font-medium font-sans">days</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Consistency blocks procrastination.
                </p>
              </div>
              <div className="p-3.5 bg-slate-950 text-amber-400 border border-slate-850 rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
            </div>

            {/* Widget 4: Diagnostic report */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-900 p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Neurological Focus Diagnosis</span>
                <HeartPulse className="w-4 h-4 text-slate-500" />
              </div>
              <div className="space-y-1">
                <div className={`text-xs font-bold font-mono tracking-wide px-2 py-1 rounded inline-block border ${diagnostic.style}`}>
                  {diagnostic.label}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1">
                  {diagnostic.desc}
                </p>
              </div>
            </div>

          </div>
        )}

        {/* SPLIT LAYOUT AREA */}
        {activeTask ? (
          /* Active focused Autopilot Mode splits the screen to keep coach handy */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* The main workspace takes 8 cols */}
            <div className="lg:col-span-8">
              <AutopilotMode
                task={activeTask}
                onBack={() => setActiveTask(null)}
                onUpdateMilestones={handleUpdateMilestones}
                onCompleteTask={handleCompleteEntireTask}
                persona={persona}
              />
            </div>

            {/* Side focus coach to talk through difficulties during active block */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-950 border border-violet-800/20 rounded-2xl p-4 space-y-1 bg-gradient-to-b from-slate-900 to-slate-950">
                <h4 className="text-xs font-bold text-violet-400 font-display flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  Companion Focus Coach
                </h4>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Your designated coach is monitoring this session. Tell them what's in your way, and they will help you keep moving.
                </p>
              </div>

              <CoachChat
                messages={messages}
                onSendMessage={handleSendMessage}
                onClearHistory={handleClearHistory}
                activeTask={activeTask}
                persona={persona}
                onChangePersona={setPersona}
                isSending={isSendingMessage}
              />
            </div>

          </div>
        ) : (
          /* Default dashboard workspace view */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Tasks and Consistency (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              <TaskCenter
                tasks={tasks}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
                onSelectTask={(task) => setActiveTask(task)}
                isLoading={isLoadingTasks}
              />

              <HabitsTracker
                habits={habits}
                onAddHabit={handleAddHabit}
                onToggleHabit={handleToggleHabit}
                onDeleteHabit={handleDeleteHabit}
                isLoading={isLoadingHabits}
              />

            </div>

            {/* Right Column: AI Coach and Calendar Schedule (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              <CoachChat
                messages={messages}
                onSendMessage={handleSendMessage}
                onClearHistory={handleClearHistory}
                activeTask={null}
                persona={persona}
                onChangePersona={setPersona}
                isSending={isSendingMessage}
              />

              <CalendarSchedule tasks={tasks} />

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 px-4 mt-12 relative z-10 text-center">
        <p className="text-xs text-slate-600 font-sans">
          ZENITH © 2026. Custom engineered with extreme care. Powered server-side by modern Gemini 2.5 and secure cloud database.
        </p>
      </footer>

    </div>
  );
}
