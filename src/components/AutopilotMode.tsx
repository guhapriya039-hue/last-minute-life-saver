import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Timer, Play, Pause, RotateCcw, CheckCircle2, 
  HelpCircle, Sparkles, Flame, Check, AlertOctagon, HelpCircle as HelpIcon,
  Smile, Dumbbell, Zap, RefreshCw, BadgeInfo
} from 'lucide-react';
import { Task, MicroMilestone } from '../types';

interface AutopilotModeProps {
  task: Task;
  onBack: () => void;
  onUpdateMilestones: (taskId: string, milestones: MicroMilestone[]) => Promise<void>;
  onCompleteTask: (taskId: string) => Promise<void>;
  persona: 'sergeant' | 'zen' | 'strategist' | 'friendly';
}

const STUCK_BLOCKS = [
  { id: 'phone', label: 'Doomscrolling / Distracted by Phone', icon: '📱' },
  { id: 'blank', label: 'Staring at Blank Screen / Blank Page Syndrome', icon: '📄' },
  { id: 'tired', label: 'Tired / Bored / Zero Energy Left', icon: '💤' },
  { id: 'perfection', label: 'Terrified of making mistakes / Imperfection anxiety', icon: '🎯' }
];

export default function AutopilotMode({ 
  task, onBack, onUpdateMilestones, onCompleteTask, persona 
}: AutopilotModeProps) {
  const [milestones, setMilestones] = useState<MicroMilestone[]>(task.microMilestones);
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState(0);
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Breathing guide states
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathSec, setBreathSec] = useState(4);

  // "I'm Stuck" Emergency Help states
  const [showStuckMenu, setShowStuckMenu] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isRescuing, setIsRescuing] = useState(false);
  const [rescueCard, setRescueCard] = useState<{ physicalReset: string; cognitiveHack: string } | null>(null);

  // Load duration from active milestone
  useEffect(() => {
    const activeMM = milestones[activeMilestoneIdx];
    if (activeMM) {
      setTimeLeft(activeMM.duration * 60);
      setIsTimerRunning(false);
    }
  }, [activeMilestoneIdx, milestones]);

  // Main countdown loop
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Play alert sound if wanted, or alert user
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Breathing Guide Loop
  useEffect(() => {
    const breathingInterval = setInterval(() => {
      setBreathSec((prev) => {
        if (prev <= 1) {
          // Switch phase
          setBreathPhase((current) => {
            if (current === 'inhale') return 'hold';
            if (current === 'hold') return 'exhale';
            return 'inhale';
          });
          return 4; // 4 seconds each
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(breathingInterval);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleMilestone = async (idx: number) => {
    const updated = [...milestones];
    updated[idx].status = updated[idx].status === 'completed' ? 'pending' : 'completed';
    setMilestones(updated);
    await onUpdateMilestones(task.id, updated);
  };

  const handleNextMilestone = () => {
    if (activeMilestoneIdx < milestones.length - 1) {
      setActiveMilestoneIdx(prev => prev + 1);
    }
  };

  const handlePrevMilestone = () => {
    if (activeMilestoneIdx > 0) {
      setActiveMilestoneIdx(prev => prev - 1);
    }
  };

  const handleTriggerStuckRescue = async (blockId: string) => {
    setSelectedBlock(blockId);
    setIsRescuing(true);
    setRescueCard(null);

    const activeMM = milestones[activeMilestoneIdx];

    try {
      const response = await fetch('/api/stuck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneTitle: activeMM?.title || task.title,
          blockType: STUCK_BLOCKS.find(b => b.id === blockId)?.label || blockId,
          persona
        })
      });

      if (!response.ok) throw new Error('Failed to fetch stuck advice');
      const data = await response.json();
      setRescueCard(data);
    } catch (err) {
      console.error(err);
      setRescueCard({
        physicalReset: "Stand up, stretch your arms above your head for 10 seconds, and drink a glass of water to trigger a physical state shift.",
        cognitiveHack: "Set a timer on your laptop for exactly 3 minutes. Commit to typing absolute nonsense until it rings. Writing garbage kills the block!"
      });
    } finally {
      setIsRescuing(false);
    }
  };

  const currentMM = milestones[activeMilestoneIdx];
  const allCompleted = milestones.every(m => m.status === 'completed');

  return (
    <div id="autopilot_workspace" className="space-y-6">
      
      {/* Back Button and Task Info Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            id="btn_exit_autopilot"
            onClick={onBack}
            className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-violet-400">ACTIVE TASK AUTOPILOT</span>
            <h2 className="text-xl font-bold font-display text-white leading-tight">{task.title}</h2>
          </div>
        </div>

        {/* Big Complete Button */}
        <button
          id="btn_complete_entire_task"
          onClick={() => onCompleteTask(task.id)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-950/20"
        >
          <CheckCircle2 className="w-4 h-4" />
          Complete Entire Task
        </button>
      </div>

      {/* Main Autopilot layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Focused Micro-Milestone and Timers (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Giant Milestone Focal Card */}
          {currentMM ? (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-xs font-mono font-medium text-slate-500 bg-slate-950/40 border-l border-b border-slate-800/40 rounded-bl-xl">
                Milestone {activeMilestoneIdx + 1} of {milestones.length}
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 text-xs text-violet-400 font-mono font-medium tracking-wide">
                  <Flame className="w-4 h-4 text-violet-400 animate-pulse" />
                  CURRENT SINGLE MINDFUL TARGET
                </div>

                <h3 className="text-2xl font-bold font-display text-white pr-16 leading-snug">
                  {currentMM.title}
                </h3>

                {/* Brain-Dead Starting Action Section - Highlights exact starting point */}
                <div className="bg-gradient-to-r from-violet-950/40 to-indigo-950/40 border border-violet-800/40 rounded-xl p-4 mt-2">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest text-violet-300 font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Overcome Friction: Standard Starting Step
                  </div>
                  <p className="text-sm font-sans text-slate-200 leading-relaxed font-medium">
                    {currentMM.startingAction}
                  </p>
                </div>

                {/* Milestone Complete Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    id={`btn_toggle_active_mm_${currentMM.id}`}
                    onClick={() => handleToggleMilestone(activeMilestoneIdx)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                      currentMM.status === 'completed'
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-white hover:bg-slate-100 text-slate-950 shadow-md shadow-slate-950/20'
                    }`}
                  >
                    {currentMM.status === 'completed' ? (
                      <>
                        <Check className="w-4 h-4" />
                        Milestone Done!
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Milestone Done
                      </>
                    )}
                  </button>

                  <div className="flex gap-1">
                    <button
                      id="btn_prev_milestone"
                      disabled={activeMilestoneIdx === 0}
                      onClick={handlePrevMilestone}
                      className="px-3 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-850 disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      id="btn_next_milestone"
                      disabled={activeMilestoneIdx === milestones.length - 1}
                      onClick={handleNextMilestone}
                      className="px-3 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-850 disabled:opacity-30 disabled:pointer-events-none transition-colors text-xs cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-400 flex flex-col items-center justify-center">
              <Check className="w-10 h-10 text-emerald-400 mb-2" />
              <p className="text-base font-semibold text-white">All milestones checked off!</p>
              <p className="text-xs mt-1">Excellent work. You can now mark this entire project as complete.</p>
            </div>
          )}

          {/* Elegant countdown timer and control card */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Timer className="w-3.5 h-3.5 text-slate-500" />
                ACTIVE FOCUS BLOCK COUNTDOWN
              </div>
              <div className="text-5xl font-bold font-mono tracking-tight text-white select-none">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                id="btn_timer_toggle"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/20'
                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/20'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    Pause Focus
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Start Focus
                  </>
                )}
              </button>

              <button
                id="btn_timer_reset"
                onClick={() => {
                  setIsTimerRunning(false);
                  const activeMM = milestones[activeMilestoneIdx];
                  if (activeMM) setTimeLeft(activeMM.duration * 60);
                }}
                className="p-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-850 transition-colors cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* EMERGENCY STUCK TRIGGER */}
              <button
                id="btn_stuck_emergency"
                onClick={() => setShowStuckMenu(true)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 transition-all cursor-pointer"
              >
                <AlertOctagon className="w-4 h-4" />
                I'm Stuck / Distracted
              </button>
            </div>

          </div>

          {/* Interactive Breathing Guide Overlay */}
          <div className="bg-slate-950/40 rounded-2xl border border-slate-850/80 p-5 flex items-center justify-between gap-6 overflow-hidden relative">
            <div className="space-y-1.5 max-w-[65%]">
              <div className="text-[10px] uppercase font-mono tracking-widest text-violet-400/80 font-bold">Ambient Nervous System Calm</div>
              <h4 className="text-sm font-bold text-white font-display">Box Breathing Regulator</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Anxiety triggers shallow breathing, fueling paralysis. Follow this ambient visual rhythm to reset your amygdala.
              </p>
            </div>

            {/* Simulated breathing expander circle */}
            <div className="relative flex items-center justify-center shrink-0 w-24 h-24 mr-2">
              <div 
                className={`absolute rounded-full bg-violet-600/10 border border-violet-500/20 transition-all duration-1000 ${
                  breathPhase === 'inhale' 
                    ? 'w-24 h-24 duration-4000 scale-100 ease-out bg-violet-500/15' 
                    : breathPhase === 'hold' 
                      ? 'w-24 h-24 duration-1000 scale-105 bg-indigo-500/15'
                      : 'w-16 h-16 duration-4000 scale-75 ease-in bg-violet-600/5'
                }`} 
              />
              <div className="z-10 text-center select-none font-mono">
                <div className="text-[10px] font-bold text-violet-300 uppercase tracking-widest font-display">
                  {breathPhase}
                </div>
                <div className="text-sm font-semibold text-slate-400">
                  {breathSec}s
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Milestones Checklist & Stuck Coach Modal Overlay (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Checklist of Milestones */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold font-display text-white tracking-tight">
              Action Plan Execution
            </h3>
            
            <div className="space-y-2">
              {milestones.map((m, idx) => {
                const isActive = idx === activeMilestoneIdx;
                const isMMCompleted = m.status === 'completed';
                return (
                  <button
                    id={`btn_milestone_checklist_row_${m.id}`}
                    key={m.id}
                    onClick={() => setActiveMilestoneIdx(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-950 border-violet-500/40 text-white font-medium shadow-md shadow-violet-950/20' 
                        : isMMCompleted 
                          ? 'bg-slate-900/30 border-slate-900 opacity-50 hover:opacity-75' 
                          : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                        isMMCompleted 
                          ? 'bg-emerald-600 border-emerald-500 text-white' 
                          : 'border-slate-700 text-transparent'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="text-xs truncate font-sans">
                        {m.title}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-medium text-slate-500 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 shrink-0">
                      {m.duration}m
                    </span>
                  </button>
                );
              })}
            </div>

            {allCompleted && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-center text-xs text-emerald-400">
                ⭐ Awesome! All milestones checked off. You crushed it!
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-950/30 rounded-2xl border border-slate-900 p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <BadgeInfo className="w-4 h-4 text-slate-500" />
              Psychological Rescue Strategy
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              When tasks feel massive, our amygdala detects "threat" and pushes us to flee (procrastination). By checking off micro-milestones under 15 minutes, you activate small dopamine releases, tricking your brain into entering state-of-flow.
            </p>
          </div>

        </div>

      </div>

      {/* "I'm Stuck" Dialog Overlay */}
      {showStuckMenu && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-rose-500 font-display font-medium text-base">
                  <AlertOctagon className="w-5 h-5" />
                  Anti-Procrastination Emergency Lockbox
                </div>
                <button
                  id="btn_close_stuck_dialog"
                  onClick={() => {
                    setShowStuckMenu(false);
                    setSelectedBlock(null);
                    setRescueCard(null);
                  }}
                  className="text-slate-500 hover:text-white transition-colors text-sm cursor-pointer font-sans"
                >
                  Close
                </button>
              </div>

              {!rescueCard ? (
                <>
                  <p className="text-sm text-slate-400 font-sans">
                    Friction has hit. That's totally normal! Tell us what kind of resistance you're feeling, and we'll fetch an immediate custom cognitive bypass.
                  </p>

                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {STUCK_BLOCKS.map((block) => (
                      <button
                        id={`btn_stuck_choice_${block.id}`}
                        key={block.id}
                        disabled={isRescuing}
                        onClick={() => handleTriggerStuckRescue(block.id)}
                        className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl border border-slate-850 hover:border-slate-700 flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <span className="text-xl shrink-0">{block.icon}</span>
                        <span className="text-xs font-semibold font-sans">{block.label}</span>
                      </button>
                    ))}
                  </div>

                  {isRescuing && (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                      <p className="text-xs font-mono animate-pulse">Formulating bypass algorithm...</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1.5">
                    <div className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5" />
                      Step 1: 15-Second Physical Reset
                    </div>
                    <p className="text-xs font-sans text-slate-200 leading-relaxed font-medium">
                      {rescueCard.physicalReset}
                    </p>
                  </div>

                  <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl space-y-1.5">
                    <div className="text-[10px] font-bold font-mono text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Step 2: Mindset Bypass Hack
                    </div>
                    <p className="text-xs font-sans text-slate-200 leading-relaxed font-medium">
                      {rescueCard.cognitiveHack}
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      id="btn_stuck_rescue_accept"
                      onClick={() => {
                        setShowStuckMenu(false);
                        setSelectedBlock(null);
                        setRescueCard(null);
                        setIsTimerRunning(true); // Restart focus timer with fresh state!
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Bypass Engaged: Back to Work
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
