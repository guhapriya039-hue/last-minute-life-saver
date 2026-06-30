import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, Smile, MessageSquare, ChevronDown, 
  HelpCircle, Trash2, Zap, Brain, MessageSquareQuote
} from 'lucide-react';
import { ChatMessage, Task } from '../types';

interface CoachChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  onClearHistory: () => void;
  activeTask: Task | null;
  persona: 'sergeant' | 'zen' | 'strategist' | 'friendly';
  onChangePersona: (p: 'sergeant' | 'zen' | 'strategist' | 'friendly') => void;
  isSending: boolean;
}

const PERSONA_DETAILS = {
  sergeant: {
    name: 'Sgt. Brickhouse',
    avatar: '🪖',
    title: 'Drill Sergeant',
    desc: 'Strict, loud, humorous tough-love. Calls out excuse-making immediately.',
    accent: 'border-red-500/20 text-red-400 bg-red-500/5',
    pill: 'bg-red-500 text-white'
  },
  zen: {
    name: 'Master Oogway',
    avatar: '🐢',
    title: 'Mindful Monk',
    desc: 'Soft, serene, deep breathing. Focuses on peace, acceptance & slow steps.',
    accent: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5',
    pill: 'bg-emerald-500 text-white'
  },
  strategist: {
    name: 'Kira (Model-S)',
    avatar: '📊',
    title: 'Tactical Analyst',
    desc: 'Data-driven, game-theoretic, logical blueprints to optimize output.',
    accent: 'border-blue-500/20 text-blue-400 bg-blue-500/5',
    pill: 'bg-blue-500 text-white'
  },
  friendly: {
    name: 'Sunny',
    avatar: '🌸',
    title: 'Empathetic Friend',
    desc: 'Validation, warm cheers, celebrating small wins, high encouragement.',
    accent: 'border-violet-500/20 text-violet-400 bg-violet-500/5',
    pill: 'bg-violet-500 text-white'
  }
};

const SUGGESTED_PROMPTS = [
  "I have zero energy today, how do I start?",
  "Give me a quick 1-minute psychological reset.",
  "Analyze my current task plan logic.",
  "I am feeling heavily distracted by my phone."
];

export default function CoachChat({
  messages, onSendMessage, onClearHistory, activeTask, persona, onChangePersona, isSending
}: CoachChatProps) {
  const [inputValue, setInputValue] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;
    
    const text = inputValue.trim();
    setInputValue('');
    await onSendMessage(text);
  };

  const handleSuggestedPrompt = async (promptText: string) => {
    if (isSending) return;
    await onSendMessage(promptText);
  };

  const currentCoach = PERSONA_DETAILS[persona];

  return (
    <div id="coach_chat_panel" className="bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col h-[520px] overflow-hidden">
      
      {/* Header with Selector */}
      <div className="bg-slate-950/80 p-4 border-b border-slate-850 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="text-2xl">{currentCoach.avatar}</div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white font-display leading-none">{currentCoach.name}</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                {currentCoach.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight max-w-[240px] truncate">{currentCoach.desc}</p>
          </div>
        </div>

        {/* Persona Picker dropdown */}
        <div className="flex items-center gap-1.5">
          <select
            id="coach_persona_select"
            value={persona}
            onChange={(e) => onChangePersona(e.target.value as any)}
            className="bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 outline-none transition-colors cursor-pointer"
          >
            <option value="sergeant">Drill Sergeant 🪖</option>
            <option value="zen">Mindful Monk 🐢</option>
            <option value="strategist">Tactical Analyst 📊</option>
            <option value="friendly">Empathetic Friend 🌸</option>
          </select>

          <button
            id="btn_clear_chat"
            onClick={onClearHistory}
            className="p-1.5 rounded-lg border border-slate-800 hover:border-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
            title="Clear chat history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-4">
            <div className="p-3.5 bg-violet-600/10 rounded-full border border-violet-500/20 text-violet-400">
              <MessageSquareQuote className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white font-display">Chat with your Proactive Coach</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto font-sans leading-relaxed">
                Need a push? Feeling stuck? Pick a coach style above and drop a message. They are context-aware of your current active task!
              </p>
            </div>

            {/* Suggested Starter Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
              {SUGGESTED_PROMPTS.map((promptText, idx) => (
                <button
                  id={`suggested_prompt_${idx}`}
                  key={idx}
                  onClick={() => handleSuggestedPrompt(promptText)}
                  className="text-left text-xs bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white p-2.5 rounded-xl border border-slate-850 hover:border-slate-700 transition-all cursor-pointer leading-tight"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-sans leading-relaxed ${
                    isAssistant 
                      ? 'bg-slate-950 border border-slate-850 text-slate-200 rounded-tl-sm' 
                      : 'bg-violet-600 text-white rounded-tr-sm shadow-md shadow-violet-950/20'
                  }`}>
                    {isAssistant && (
                      <div className="text-[10px] font-bold font-mono text-violet-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span>{currentCoach.avatar}</span>
                        <span>{currentCoach.name}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-line text-xs">{m.content}</p>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-slate-850 rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-violet-400" />
                    <span>{currentCoach.name} is typing...</span>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce duration-300" />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce duration-300 delay-75" />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce duration-300 delay-150" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      {/* Input Form Footer */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-850 flex gap-2">
        <input
          id="coach_chat_input"
          type="text"
          disabled={isSending}
          placeholder={`Talk to ${currentCoach.name}...`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-xs outline-none transition-colors"
        />
        <button
          id="btn_coach_send"
          type="submit"
          disabled={isSending || !inputValue.trim()}
          className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4 fill-current" />
        </button>
      </form>

    </div>
  );
}
