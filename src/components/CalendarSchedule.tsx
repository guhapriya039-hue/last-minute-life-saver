import React from 'react';
import { Calendar, Clock, Sparkles, Brain, CheckCircle2, Moon, Sun, AlertCircle } from 'lucide-react';
import { Task } from '../types';

interface CalendarScheduleProps {
  tasks: Task[];
}

export default function CalendarSchedule({ tasks }: CalendarScheduleProps) {
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  // Auto allocate pending tasks to hourly slots for the day
  // Creative scheduling logic to prevent decision fatigue
  const getDailySchedule = () => {
    const slots = [
      { time: '09:00 AM', label: 'Morning High-Cognitive Block', icon: '☀️', task: null as Task | null, tip: 'Prefrontal cortex is fully charged. Best for complex logic.' },
      { time: '11:00 AM', label: 'Late Morning Flow Boost', icon: '☕', task: null as Task | null, tip: 'Energy is high. Lock in writing or creative sprints.' },
      { time: '02:00 PM', label: 'Afternoon Execution Block', icon: '🌤️', task: null as Task | null, tip: 'Dopamine dips. Perfect for standard, structured chores or editing.' },
      { time: '04:00 PM', label: 'Late Afternoon Clean Sweep', icon: '🌇', task: null as Task | null, tip: 'Review minor admin tasks, clear emails, and log streaks.' }
    ];

    // Allocate tasks based on priority
    let taskIdx = 0;
    // Critical & High tasks go to morning slots
    const sortedTasks = [...pendingTasks].sort((a, b) => {
      const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    for (let i = 0; i < slots.length; i++) {
      if (sortedTasks[taskIdx]) {
        slots[i].task = sortedTasks[taskIdx];
        taskIdx++;
      }
    }

    return slots;
  };

  const scheduleSlots = getDailySchedule();

  return (
    <div id="calendar_section" className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-5">
      
      {/* Header */}
      <div className="border-b border-slate-850 pb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="text-violet-400 w-5 h-5" />
          <h3 className="text-base font-bold font-display text-white">
            AI-Optimized Day Autopilot
          </h3>
        </div>
        <p className="text-slate-400 text-xs mt-0.5">
          Decision fatigue causes 80% of procrastination. We auto-slot your tasks to align with your neurological focus cycles.
        </p>
      </div>

      {/* Hourly Timeline */}
      <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-6">
        {scheduleSlots.map((slot, index) => {
          const hasTask = slot.task !== null;
          return (
            <div key={index} className="relative group">
              
              {/* Left Timeline Indicator Node */}
              <div className={`absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                hasTask 
                  ? slot.task?.priority === 'Critical'
                    ? 'bg-red-500 border-slate-950 scale-110 shadow-lg shadow-red-500/20'
                    : 'bg-violet-600 border-slate-950 scale-110 shadow-lg shadow-violet-500/20'
                  : 'bg-slate-900 border-slate-850'
              }`}>
                {hasTask && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>

              {/* Grid content block */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="text-xs font-bold font-mono text-slate-300 flex items-center gap-1">
                    <span>{slot.icon}</span>
                    <span>{slot.time}</span>
                    <span className="text-slate-500 font-sans font-medium">— {slot.label}</span>
                  </span>
                  
                  {hasTask && (
                    <span className={`text-[9px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded ${
                      slot.task?.priority === 'Critical'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : slot.task?.priority === 'High'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                    }`}>
                      {slot.task?.priority} Priority
                    </span>
                  )}
                </div>

                {hasTask ? (
                  <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-850 hover:border-slate-800 transition-colors">
                    <h4 className="text-xs font-semibold text-white leading-tight font-sans">
                      {slot.task?.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850">{slot.task?.category}</span>
                      <span>•</span>
                      <span>Panic Index: {slot.task?.panicIndex}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/25 rounded-xl p-3.5 border border-dashed border-slate-850/60">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-medium text-slate-500 leading-tight">
                          Serene Space Available
                        </h4>
                        <p className="text-[10px] text-slate-600 font-sans leading-normal mt-0.5">
                          {slot.tip}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
