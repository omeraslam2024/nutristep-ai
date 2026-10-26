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
      content: `Hello ${profile.name.split(' ')[0]}! I'm your Gemini Nutrition & Movement Coach. 

Today you've consumed **${caloriesConsumed} kcal** and taken **${steps.toLocaleString()} steps** (+${caloriesBurned} kcal active burn). 

You have **${Math.round(remainingCalories)} kcal** and **${remainingProtein}g of protein** left in your daily budget. What can I help you plan, adjust, or optimize?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    `I have ${Math.round(remainingCalories)} kcal and ${remainingProtein}g protein remaining. What should I eat for dinner?`,
    `How many steps do I need to walk to burn an extra 200 calories?`,
    `Analyze my meal choices today and suggest 1 macro improvement.`,
    `Give me 3 high-protein snack ideas under 180 kcal.`,
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

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const userContext = {
        name: profile.name,
        goal: profile.goal,
        calorieTarget: dailyTarget,
        bmr: calculateBMR(profile),
        tdee: calculateTDEE(profile),
        weightKg: profile.weightKg,
        targetWeightKg: profile.targetWeightKg,
        caloriesConsumed,
        caloriesBurned,
        steps,
        stepGoal: profile.stepGoal || 10000,
        remainingCalories,
        proteinConsumed,
        proteinTarget: macroTargets.protein_g,
        carbsConsumed,
        carbsTarget: macroTargets.carbs_g,
        fatConsumed,
        fatTarget: macroTargets.fat_g,
        waterMl,
        waterTargetMl: profile.waterTargetMl || 2500,
        recentMealsSummary: meals.map((m) => `${m.mealType}: ${m.meal_name} (${m.total_calories} kcal)`).join('; '),
      };

      const res = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          userContext,
        }),
      });

      if (!res.ok) {
        throw new Error('Coach service error');
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "Keep up the consistent effort! Consistency in caloric balance and step cadence is key.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I'm having a brief connection pause. In the meantime, remember your remaining budget today is **${Math.round(remainingCalories)} kcal** and focus on hitting **${remainingProtein}g of protein**!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Coach NutriStep <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">Gemini 3.8</span>
              </h3>
              <p className="text-xs text-slate-400">Contextual Dietitian &amp; Step Coach</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Profile HUD Bar */}
        <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Rem: <strong className="text-emerald-400">{Math.round(remainingCalories)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Utensils className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">Prot: <strong className="text-rose-300">{remainingProtein}g</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Footprints className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Steps: <strong className="text-cyan-300">{steps.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Droplets className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">Water: <strong className="text-sky-300">{(waterMl / 1000).toFixed(1)}L</strong></span>
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
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
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
            <div className="flex items-center gap-2 text-xs text-purple-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 w-fit">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Coach is calculating personalized nutrition advice...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
            Suggested questions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
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
              placeholder="Ask coach about meals, macros, or steps..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
