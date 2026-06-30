import React, { useState } from 'react';
import { 
  Flame, CheckCircle2, Plus, Trash2, Trophy, Clock, Sparkles, AlertCircle, RefreshCcw
} from 'lucide-react';
import { Habit } from '../types';

interface HabitsTrackerProps {
  habits: Habit[];
  onAddHabit: (name: string, recommendedTime?: string) => Promise<void>;
  onToggleHabit: (id: string) => Promise<void>;
  onDeleteHabit: (id: string) => Promise<void>;
  isLoading: boolean;
}

export default function HabitsTracker({
  habits, onAddHabit, onToggleHabit, onDeleteHabit, isLoading
}: HabitsTrackerProps) {
  const [habitName, setHabitName] = useState('');
  const [recTime, setRecTime] = useState('09:00 AM');
  const [isAdding, setIsAdding] = useState(false);

  // Generate last 14 days dates string (YYYY-MM-DD) for grid columns
  const getPastFortnight = () => {
    const dates = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates;
  };

  const datesList = getPastFortnight();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    setIsAdding(true);
    try {
      await onAddHabit(habitName.trim(), recTime);
      setHabitName('');
      setRecTime('09:00 AM');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const isTodayCompleted = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0];
    return habit.history.includes(today);
  };

  return (
    <div id="habits_section" className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div>
          <h3 className="text-base font-bold font-display text-white flex items-center gap-1.5">
            <Trophy className="text-amber-400 w-5 h-5" />
            Consistency Anchors (Habits)
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Build bulletproof momentum. Procrastination melts in the face of continuous small streaks.
          </p>
        </div>

        {/* Rapid Add Trigger Inline Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
          <input
            id="habit_input_name"
            type="text"
            required
            placeholder="Add habit, e.g., 5m Meditation..."
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
          />
          <select
            id="habit_input_time"
            value={recTime}
            onChange={(e) => setRecTime(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2 py-1 outline-none"
          >
            <option value="07:00 AM">07:00 AM</option>
            <option value="09:00 AM">09:00 AM</option>
            <option value="01:00 PM">01:00 PM</option>
            <option value="05:00 PM">05:00 PM</option>
            <option value="09:00 PM">09:00 PM</option>
          </select>
          <button
            id="btn_add_habit"
            type="submit"
            disabled={isAdding}
            className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Main Grid Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-slate-400 text-xs">
          <RefreshCcw className="w-4 h-4 animate-spin text-violet-400 mr-2" />
          Synchronizing streaks...
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl">
          No habits anchored yet. Create a quick habit above to lock in your daily consistency streaks!
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => {
            const completedToday = isTodayCompleted(habit);
            return (
              <div
                id={`habit_row_${habit.id}`}
                key={habit.id}
                className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left Side: Checkbox, Name, Streak Info */}
                <div className="flex items-start gap-3 flex-1">
                  <button
                    id={`btn_toggle_habit_${habit.id}`}
                    onClick={() => onToggleHabit(habit.id)}
                    className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                      completedToday 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : 'border-slate-700 text-transparent hover:border-emerald-500'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="space-y-0.5">
                    <h4 className={`text-xs font-semibold ${completedToday ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                      {habit.name}
                    </h4>
                    
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Ideal: {habit.recommendedTime}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-amber-400">
                        <Flame className="w-3 h-3" />
                        {habit.streak} day streak
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: GitHub-style 14-Day Streak Matrix */}
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <div className="text-[9px] uppercase font-mono text-slate-500 text-right leading-none pr-1">
                      Last 14 Days
                    </div>
                    <div className="flex gap-1">
                      {datesList.map((dateStr, dIdx) => {
                        const isCompletedOnDate = habit.history.includes(dateStr);
                        const isDateToday = dateStr === new Date().toISOString().split('T')[0];
                        return (
                          <div
                            key={dateStr}
                            title={`${dateStr}: ${isCompletedOnDate ? 'Completed!' : 'Not Completed'}`}
                            className={`w-3 h-3 rounded-sm transition-all duration-300 relative ${
                              isCompletedOnDate 
                                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' 
                                : isDateToday
                                  ? 'bg-slate-900 border border-slate-800'
                                  : 'bg-slate-900/40'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <button
                    id={`btn_delete_habit_${habit.id}`}
                    onClick={() => onDeleteHabit(habit.id)}
                    className="p-1.5 rounded-lg border border-slate-850 hover:border-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                    title="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Routine Peak Advice (Static/AI integrated styling) */}
      <div className="p-3.5 bg-violet-600/5 border border-violet-500/10 rounded-xl space-y-1">
        <div className="text-[10px] uppercase font-mono font-bold text-violet-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          AI Circadian Optimization Peak
        </div>
        <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
          Morning habits (like drinking water and meditation) trigger cortisol reduction. Perform your hardest Zenith Focus tasks between 9:00 AM and 11:30 AM when your prefrontal cortex has 100% capacity!
        </p>
      </div>

    </div>
  );
}
