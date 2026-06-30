import React, { useState } from 'react';
import { 
  Plus, Trash2, Calendar, AlertTriangle, Sparkles, 
  CheckCircle2, Clock, Play, Brain, ShieldAlert, BadgeInfo 
} from 'lucide-react';
import { Task } from '../types';

interface TaskCenterProps {
  tasks: Task[];
  onAddTask: (taskData: {
    title: string;
    category: Task['category'];
    deadline: string;
    anxietyLevel: number;
    excuse: string;
  }) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleComplete: (id: string) => Promise<void>;
  onSelectTask: (task: Task) => void;
  isLoading: boolean;
}

const CATEGORIES: Task['category'][] = ['Work', 'Study', 'Health', 'Chores', 'Personal', 'General'];

const ANXIETY_DESCRIPTIONS = [
  'Calm Breeze (No stress, just standard work)',
  'Subtle Humming (Slightly in the back of your mind)',
  'Rising Tension (Getting hard to ignore)',
  'Mild Flutter (Tingling anxiety, avoiding the file)',
  'Heavy Heart (Procrastination actively kicking in)',
  'Tight Chest (Staring at the clock, feeling guilty)',
  'Sweaty Palms (Heart racing, actively avoiding it)',
  'Severe Dread (Paralyzed by the scale of the task)',
  'Panic Alarm (High friction, feels impossible to start)',
  'Total Meltdown (Ready to pull an all-nighter in terror)'
];

const EXCUSE_SUGGESTIONS = [
  "I don't know where to start, it's too massive.",
  "I'm afraid it won't be perfect, so I'm stalling.",
  "I'll do it later tonight, I'm too tired right now.",
  "I'm waiting for the 'perfect mood' or inspiration.",
  "It is so boring, I'd rather do literally anything else.",
  "I keep checking social media or my phone instead."
];

export default function TaskCenter({ 
  tasks, onAddTask, onDeleteTask, onToggleComplete, onSelectTask, isLoading 
}: TaskCenterProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Task['category']>('General');
  
  // Default deadline: tomorrow at 5 PM
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(17, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };
  
  const [deadline, setDeadline] = useState(getTomorrowString());
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [excuse, setExcuse] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddTask({
        title: title.trim(),
        category,
        deadline,
        anxietyLevel,
        excuse: excuse.trim() || "Just standard resistance to starting."
      });
      // Reset form
      setTitle('');
      setCategory('General');
      setDeadline(getTomorrowString());
      setAnxietyLevel(5);
      setExcuse('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadgeStyles = (priority: Task['priority']) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
    }
  };

  const getPanicColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 50) return 'text-amber-400';
    if (score >= 30) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const getTimeRemaining = (deadlineStr: string) => {
    const deadlineDate = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Deadline Missed!';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) {
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMins}m remaining`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    return `${diffDays}d ${remainingHours}h remaining`;
  };

  return (
    <div id="task_center" className="space-y-6">
      {/* Header with trigger button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold font-display tracking-tight text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-violet-400" />
            Chaotic Deadlines Triaged
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Add tasks with your excuses and current panic level. Our AI splits them into actionable micro-steps.
          </p>
        </div>
        
        <button
          id="btn_toggle_form"
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-md ${
            showForm 
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700' 
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-900/30 border border-violet-500/20'
          }`}
        >
          {showForm ? 'Cancel Rescue' : (
            <>
              <Plus className="w-5 h-5" />
              Triage New Task
            </>
          )}
        </button>
      </div>

      {/* Triaging Input Form */}
      {showForm && (
        <form 
          id="task_rescue_form"
          onSubmit={handleSubmit} 
          className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center gap-2 text-violet-400 font-display font-medium text-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            AI TASK TRIAGING SYSTEM
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Task Name & Category */}
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium text-sm mb-1.5" htmlFor="task_title">
                  What are you procrastinating on? *
                </label>
                <input
                  id="task_title"
                  type="text"
                  required
                  placeholder="e.g., Final Chemistry Lab Report, Taxes 2026..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium text-sm mb-1.5" htmlFor="task_category">
                    Category
                  </label>
                  <select
                    id="task_category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Task['category'])}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium text-sm mb-1.5" htmlFor="task_deadline">
                    Hard Deadline *
                  </label>
                  <input
                    id="task_deadline"
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Anxiety Slider & Coping Excuse */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-300 font-medium text-sm" htmlFor="anxiety_slider">
                    Your Current Anxiety / Dread Level
                  </label>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    Level {anxietyLevel}/10
                  </span>
                </div>
                <input
                  id="anxiety_slider"
                  type="range"
                  min="1"
                  max="10"
                  value={anxietyLevel}
                  onChange={(e) => setAnxietyLevel(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <p className="text-xs text-slate-400 mt-1.5 italic font-sans flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline shrink-0" />
                  {ANXIETY_DESCRIPTIONS[anxietyLevel - 1]}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium text-sm mb-1.5" htmlFor="task_excuse">
                  What is your mental roadblock or excuse? (Why are you putting it off?)
                </label>
                <textarea
                  id="task_excuse"
                  rows={2}
                  placeholder="Be honest... 'I don't know where to start' / 'I am too tired' / 'I'm terrified it won't be perfect'..."
                  value={excuse}
                  onChange={(e) => setExcuse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-colors resize-none"
                />
                
                {/* Suggestions Pills */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {EXCUSE_SUGGESTIONS.map((s, idx) => (
                    <button
                      id={`excuse_pille_${idx}`}
                      type="button"
                      key={idx}
                      onClick={() => setExcuse(s)}
                      className="text-xs text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-750 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {s.length > 35 ? s.substring(0, 32) + '...' : s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              id="btn_form_cancel"
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn_form_submit"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-900/10"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Triaging Task & Splitting via AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Engage AI Autopilot
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Task List Container */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
            <Clock className="w-10 h-10 animate-spin text-violet-400" />
            <p className="text-sm font-sans animate-pulse">Syncing with secure autopilot system...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6">
            <div className="p-3.5 bg-violet-500/10 rounded-full border border-violet-500/20 text-violet-400 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-white font-display">Your Mind is Empty & Free</h3>
            <p className="text-slate-400 text-sm max-w-sm mt-1.5 mx-auto">
              No imminent deadlines on your list. Enjoy this serene peace, or add a lingering task you know you're putting off!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              return (
                <div
                  id={`task_card_${task.id}`}
                  key={task.id}
                  className={`group relative bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isCompleted 
                      ? 'border-slate-800/40 opacity-60' 
                      : 'border-slate-800 hover:border-slate-700/80 shadow-md hover:shadow-slate-950/40'
                  }`}
                >
                  {/* Decorative Left Alert Bar based on priority */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isCompleted 
                      ? 'bg-slate-750' 
                      : task.priority === 'Critical' 
                        ? 'bg-gradient-to-b from-red-500 to-rose-600'
                        : task.priority === 'High' 
                          ? 'bg-gradient-to-b from-amber-500 to-orange-500'
                          : task.priority === 'Medium' 
                            ? 'bg-gradient-to-b from-yellow-500 to-yellow-400'
                            : 'bg-gradient-to-b from-emerald-500 to-teal-500'
                  }`} />

                  <div className="p-5 pl-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Left Info Column */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        {/* Status Checkbox */}
                        <button
                          id={`btn_toggle_complete_${task.id}`}
                          onClick={() => onToggleComplete(task.id)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                            isCompleted 
                              ? 'bg-violet-600 border-violet-500 text-white' 
                              : 'border-slate-700 hover:border-violet-500 text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className={`text-base font-semibold font-sans leading-tight ${
                              isCompleted ? 'text-slate-500 line-through' : 'text-white group-hover:text-violet-300 transition-colors'
                            }`}>
                              {task.title}
                            </h3>
                            
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              {task.category}
                            </span>

                            {!isCompleted && (
                              <span className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded font-semibold ${getPriorityBadgeStyles(task.priority)}`}>
                                {task.priority}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1 font-sans">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {new Date(task.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!isCompleted && (
                              <span className="flex items-center gap-1 font-mono text-violet-400/90">
                                <Clock className="w-3.5 h-3.5" />
                                {getTimeRemaining(task.deadline)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Excuse Block Quote */}
                      {!isCompleted && task.excuse && (
                        <div className="pl-8 text-xs text-slate-400 border-l border-slate-800 italic font-sans flex items-start gap-1.5">
                          <span className="text-rose-500 font-semibold uppercase font-mono tracking-wide text-[9px] shrink-0 mt-0.5">mental excuse:</span>
                          "{task.excuse}"
                        </div>
                      )}

                      {/* Coping Hack Recommendation */}
                      {!isCompleted && task.copingMechanism && (
                        <div className="pl-8 text-xs text-emerald-400/90 font-sans flex items-start gap-1.5">
                          <span className="text-emerald-500 font-semibold uppercase font-mono tracking-wide text-[9px] shrink-0 mt-0.5">coping hack:</span>
                          {task.copingMechanism}
                        </div>
                      )}
                    </div>

                    {/* Right Action / Panic Index Gauge Column */}
                    <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-850">
                      
                      {/* Panic Indicator */}
                      {!isCompleted && (
                        <div className="text-right flex items-center md:flex-col gap-3 md:gap-1">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Panic Index</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xl font-bold font-mono tracking-tight ${getPanicColor(task.panicIndex)}`}>
                              {task.panicIndex}%
                            </span>
                            {/* Radial mini bar */}
                            <div className="w-1.5 h-7 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`w-full rounded-full ${
                                  task.panicIndex >= 80 
                                    ? 'bg-red-500' 
                                    : task.panicIndex >= 50 
                                      ? 'bg-amber-500' 
                                      : 'bg-yellow-400'
                                }`} 
                                style={{ height: `${task.panicIndex}%`, transform: 'rotate(180deg)', transformOrigin: 'bottom' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Launch / Action Buttons */}
                      <div className="flex items-center gap-2">
                        {!isCompleted && (
                          <button
                            id={`btn_start_autopilot_${task.id}`}
                            onClick={() => onSelectTask(task)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-900/20 transition-all cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Start Autopilot
                          </button>
                        )}

                        <button
                          id={`btn_delete_task_${task.id}`}
                          onClick={() => onDeleteTask(task.id)}
                          className="p-2 rounded-xl border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-500/20 transition-colors cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
