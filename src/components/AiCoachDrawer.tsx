import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  Zap,
  Flame,
  Utensils,
  Footprints,
  Droplets,
  MessageSquare,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile, ChatMessage, LoggedMeal } from '../types';
import { calculateTargetCalories, calculateMacroTargets, calculateTDEE, calculateBMR } from '../utils/healthCalculations';

interface AiCoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  caloriesConsumed: number;
  caloriesBurned: number;
  steps: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatConsumed: number;
  waterMl?: number;
  meals: LoggedMeal[];
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export const AiCoachDrawer: React.FC<AiCoachDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  caloriesConsumed,
  caloriesBurned,
  steps,
  proteinConsumed,
  carbsConsumed,
  fatConsumed,
  waterMl = 1750,
  meals,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const dailyTarget = calculateTargetCalories(profile);
  const macroTargets = calculateMacroTargets(profile, dailyTarget);
  const remainingCalories = dailyTarget - caloriesConsumed + caloriesBurned;
  const remainingProtein = Math.max(0, macroTargets.protein_g - proteinConsumed);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello ${profile.name.split(' ')[0]}! I'm Coach NutriStep, your personal dietitian and movement specialist.

📊 Today's Status:
• Consumed: ${caloriesConsumed} kcal
• Active Burn: ${caloriesBurned} kcal
• Steps: ${steps.toLocaleString()}
• Calories Remaining: ${Math.round(remainingCalories)} kcal
• Protein Remaining: ${remainingProtein}g

How can I help you adjust your meal plan, boost your energy, or hit your goals today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    `What should I eat with ${Math.round(remainingCalories)} kcal left?`,
    `How many steps to burn 200 calories?`,
    `Suggest 3 high-protein snacks under 180 kcal.`,
    `How can I improve my macros today?`,
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [isOpen, initialPrompt]);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          profile,
          metrics: {
            caloriesConsumed,
            caloriesBurned,
            steps,
            remainingCalories,
            proteinConsumed,
            carbsConsumed,
            fatConsumed,
            waterMl,
            dailyTarget,
          },
          recentMeals: meals.map((m) => ({
            name: m.meal_name,
            calories: m.total_calories,
            protein: m.total_macros.protein_g,
            type: m.mealType,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Coach service unavailable');
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Keep up the great momentum! Focus on your daily protein intake and consistent step cadence.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const fallbackReply: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `You currently have **${Math.round(remainingCalories)} kcal** and **${remainingProtein}g protein** remaining in your daily budget. Pairing a lean protein source (Greek yogurt, chicken, eggs, or tofu) with fiber will keep you feeling energized!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 2.5rem)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)',
        }}
      >
        {/* Top Header with Back to Home Button */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Universal Back to Home button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 cursor-pointer shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center gap-1.5"
              title="Back to Home Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-black hidden xs:inline">Back</span>
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>

            <div className="min-w-0">
              <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-1.5 truncate">
                <span>Coach NutriStep</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold shrink-0">
                  AI
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate">Smart Diet &amp; Steps Specialist</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center"
            title="Close Coach"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Live Profile HUD Bar - Proportional & Overflow Safe */}
        <div className="bg-slate-950/90 px-3 py-2 border-b border-slate-800/80 grid grid-cols-4 gap-1 sm:gap-2 text-xs shrink-0">
          <div className="flex flex-col items-center justify-center p-1 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-0">
            <span className="text-[10px] font-bold text-slate-400 block truncate">Rem. Kcal</span>
            <span className="text-xs sm:text-sm font-black text-emerald-400 truncate">
              {Math.round(remainingCalories)}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-1 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-0">
            <span className="text-[10px] font-bold text-slate-400 block truncate">Protein</span>
            <span className="text-xs sm:text-sm font-black text-rose-300 truncate">
              {remainingProtein}g
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-1 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-0">
            <span className="text-[10px] font-bold text-slate-400 block truncate">Steps</span>
            <span className="text-xs sm:text-sm font-black text-cyan-300 truncate">
              {steps.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-1 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-0">
            <span className="text-[10px] font-bold text-slate-400 block truncate">Water</span>
            <span className="text-xs sm:text-sm font-black text-sky-300 truncate">
              {(waterMl / 1000).toFixed(1)}L
            </span>
          </div>
        </div>

        {/* Chat message scroll area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-tr-none shadow-md'
                    : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none font-medium'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-purple-400 bg-slate-950/80 p-3 rounded-2xl border border-purple-500/30 w-fit animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-purple-300" />
              <span className="font-bold">Coach is reviewing your nutrition &amp; step targets...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions (Horizontal Swipe Chips, Never Multi-Line Disasters) */}
        <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/60 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Tap to Ask Coach:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95 cursor-pointer whitespace-nowrap min-h-[36px]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat input box */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about foods, calories, or steps..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 min-h-[48px]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white disabled:opacity-40 transition-all cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95"
              title="Send message to Coach"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
