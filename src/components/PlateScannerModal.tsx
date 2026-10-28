import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { apiUrl } from '../utils/api';
import { AI_ENABLED } from '../utils/features';
import { lookupBarcode } from '../utils/barcode';
import {
  X,
  Camera,
  Upload,
  Mic,
  MicOff,
  Barcode,
  Sparkles,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ChevronRight,
  Info,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  ScanBarcode,
  PencilLine,
  Salad,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LoggedMeal, MealItem, MealType, SamplePlate } from '../types';
import { SAMPLE_PLATES } from '../data/initialData';
import { speakText, stopSpeaking } from '../utils/speechHelper';

interface PlateScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMealLogged: (meal: LoggedMeal) => void;
  defaultMealType?: MealType;
}

type TabMode = 'camera' | 'upload' | 'samples' | 'voice_text' | 'barcode' | 'manual';

const TABS: { id: TabMode; label: string; icon: React.ElementType; ai: boolean }[] = [
  { id: 'camera', label: 'Camera', icon: Camera, ai: true },
  { id: 'upload', label: 'Photo', icon: ImageIcon, ai: true },
  { id: 'voice_text', label: 'Describe', icon: Mic, ai: true },
  { id: 'barcode', label: 'Barcode', icon: ScanBarcode, ai: false },
  { id: 'manual', label: 'Manual', icon: PencilLine, ai: false },
  { id: 'samples', label: 'Quick picks', icon: Salad, ai: false },
];
const VISIBLE_TABS = TABS.filter((t) => AI_ENABLED || !t.ai);

export const PlateScannerModal: React.FC<PlateScannerModalProps> = ({
  isOpen,
  onClose,
  onMealLogged,
  defaultMealType = 'Lunch',
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>(AI_ENABLED ? 'camera' : 'manual');
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Voice & Text state
  const [textInput, setTextInput] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Barcode state
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [barcodeLoading, setBarcodeLoading] = useState<boolean>(false);
  const [isSpeakingResult, setIsSpeakingResult] = useState<boolean>(false);

  const handleSpeakAnalysis = () => {
    if (!analysisResult) return;
    if (isSpeakingResult) {
      stopSpeaking();
      setIsSpeakingResult(false);
    } else {
      const text = `${analysisResult.meal_name}. Estimated ${analysisResult.total_calories} calories, and ${analysisResult.total_macros.protein_g} grams of protein.`;
      speakText(text);
      setIsSpeakingResult(true);
      setTimeout(() => setIsSpeakingResult(false), 7000);
    }
  };

  // Analysis result state (Module A Review & User Override)
  const [analysisResult, setAnalysisResult] = useState<{
    meal_name: string;
    confidence_score: number;
    total_calories: number;
    total_macros: {
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      fiber_g: number;
      sodium_mg?: number;
    };
    detected_items: MealItem[];
    dietary_flags: string[];
    nutritionist_tip?: string;
    image_url?: string;
    source: LoggedMeal['source'];
  } | null>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setTextInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Handle camera start & stop
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setErrorMessage(null);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setErrorMessage('Could not open camera stream. Please allow camera permissions or use upload / sample dishes.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    sendImageForAnalysis(dataUrl, 'camera');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      sendImageForAnalysis(dataUrl, 'upload');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: SamplePlate) => {
    setCapturedImage(sample.image_url);
    setIsAnalyzing(true);
    setErrorMessage(null);

    // Sample dishes carry their own curated nutrition data; they are labelled "Sample", not AI.
    setupAnalysisState(sample.fallbackData, sample.image_url, 'sample');
    setIsAnalyzing(false);
  };

  const sendImageForAnalysis = async (imageDataUrl: string, source: LoggedMeal['source']) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const res = await fetch(apiUrl('/api/analyze-plate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          mealType,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to analyze plate photo');
      }

      const data = await res.json();
      setupAnalysisState(data, imageDataUrl, source);
    } catch (err: any) {
      console.error(err);
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setErrorMessage(
          'You are currently offline. Cloud AI plate analysis requires an internet connection. You can use any sample dish or manual entry to log meals locally offline.'
        );
      } else {
        setErrorMessage(err.message || 'Image analysis failed. Please try another angle or sample.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleParseText = async () => {
    if (!textInput.trim()) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch(apiUrl('/api/parse-meal-text'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textInput, mealType }),
      });

      if (!res.ok) {
        throw new Error('Failed to parse meal description');
      }

      const data = await res.json();
      setupAnalysisState(
        data,
        '',
        'voice'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Error converting text to nutritional meal');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBarcodeLookup = async () => {
    if (!barcodeInput.trim()) return;
    setBarcodeLoading(true);
    setErrorMessage(null);

    try {
      const data = await lookupBarcode(barcodeInput.trim());
      const item: MealItem = {
        id: `barcode-${Date.now()}`,
        item_name: `${data.product_name} (${data.brand})`,
        estimated_weight_g: 100,
        calories: data.calories,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g,
        fiber_g: data.fiber_g,
        sodium_mg: data.sodium_mg,
        confidence: 0.99,
        visual_clues: `Verified Barcode: ${data.barcode} (${data.serving_size})`,
      };

      setAnalysisResult({
        meal_name: `${data.product_name} (${data.brand})`,
        confidence_score: 0.99,
        total_calories: item.calories,
        total_macros: {
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
          fiber_g: item.fiber_g || 0,
          sodium_mg: item.sodium_mg || 0,
        },
        detected_items: [item],
        dietary_flags: ['Packaged Food', 'Verified Nutrition Facts'],
        nutritionist_tip: `Verified via OpenFoodFacts barcode database for ${data.brand}.`,
        image_url: data.image_url || '',
        source: 'barcode',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Barcode search failed. Try entering a common test barcode like 737628064502');
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleScanNutritionLabel = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const res = await fetch(apiUrl('/api/scan-nutrition-label'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl }),
      });
      if (!res.ok) {
        throw new Error('Could not parse nutrition facts label.');
      }
      const data = await res.json();
      const item: MealItem = {
        id: `label-${Date.now()}`,
        item_name: data.product_name || 'Packaged Item',
        estimated_weight_g: 100,
        calories: Number(data.calories) || 150,
        protein_g: Number(data.protein_g) || 5,
        carbs_g: Number(data.carbs_g) || 20,
        fat_g: Number(data.fat_g) || 5,
        fiber_g: Number(data.fiber_g) || 2,
        sodium_mg: Number(data.sodium_mg) || 120,
        confidence: Number(data.confidence) || 0.95,
        visual_clues: `OCR Label: ${data.brand || ''} ${data.serving_size || ''}`,
      };
      setAnalysisResult({
        meal_name: `${data.brand ? data.brand + ' ' : ''}${data.product_name || 'Packaged Product'}`,
        confidence_score: 0.96,
        total_calories: item.calories,
        total_macros: {
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
          fiber_g: item.fiber_g || 0,
          sodium_mg: item.sodium_mg || 0,
        },
        detected_items: [item],
        dietary_flags: data.dietary_flags || ['Nutrition Label OCR'],
        nutritionist_tip: `Extracted directly from package label (Serving size: ${data.serving_size || '1 serving'}).`,
        image_url: imageDataUrl,
        source: 'barcode',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to extract nutrition facts from label.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is not supported on this browser. You can type your meal description directly.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const handleManualEntry = () => {
    const num = (v: string) => Math.max(0, Math.round(Number(v || 0) * 10) / 10);
    const calories = Math.round(num(manual.calories));
    if (!manual.name.trim() || !calories) return;
    const item: MealItem = {
      id: `manual-${Date.now()}`,
      item_name: manual.name.trim(),
      estimated_weight_g: 100,
      calories,
      protein_g: num(manual.protein),
      carbs_g: num(manual.carbs),
      fat_g: num(manual.fat),
      fiber_g: 0,
      sodium_mg: 0,
      visual_clues: 'Entered by you',
    };
    setAnalysisResult({
      meal_name: item.item_name,
      confidence_score: 0,
      total_calories: calories,
      total_macros: { protein_g: item.protein_g, carbs_g: item.carbs_g, fat_g: item.fat_g, fiber_g: 0, sodium_mg: 0 },
      detected_items: [item],
      dietary_flags: [],
      image_url: '',
      source: 'manual',
    });
    setManual({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  };

  const setupAnalysisState = (data: any, imageUrl: string, source: LoggedMeal['source']) => {
    const items: MealItem[] = (data.detected_items || []).map((it: any, idx: number) => ({
      id: `detected-${Date.now()}-${idx}`,
      item_name: it.item_name || 'Food item',
      estimated_weight_g: Number(it.estimated_weight_g) || 100,
      calories: Number(it.calories) || 100,
      protein_g: Number(it.protein_g) || 0,
      carbs_g: Number(it.carbs_g) || 0,
      fat_g: Number(it.fat_g) || 0,
      fiber_g: Number(it.fiber_g) || 0,
      sodium_mg: Number(it.sodium_mg) || 0,
      confidence: Number(it.confidence) || 0.9,
      visual_clues: it.visual_clues || 'Estimated by visual plate proportion',
    }));

    setAnalysisResult({
      meal_name: data.meal_name || 'Recognized Meal Plate',
      confidence_score: Number(data.confidence_score) || 0.92,
      total_calories: Number(data.total_calories) || items.reduce((s, i) => s + i.calories, 0),
      total_macros: {
        protein_g: Number(data.total_macros?.protein_g) || items.reduce((s, i) => s + i.protein_g, 0),
        carbs_g: Number(data.total_macros?.carbs_g) || items.reduce((s, i) => s + i.carbs_g, 0),
        fat_g: Number(data.total_macros?.fat_g) || items.reduce((s, i) => s + i.fat_g, 0),
        fiber_g: Number(data.total_macros?.fiber_g) || items.reduce((s, i) => s + (i.fiber_g || 0), 0),
        sodium_mg: Number(data.total_macros?.sodium_mg) || items.reduce((s, i) => s + (i.sodium_mg || 0), 0),
      },
      detected_items: items,
      dietary_flags: data.dietary_flags || ['AI Plate Verified'],
      nutritionist_tip: data.nutritionist_tip || 'Balanced meal with identified whole foods.',
      image_url: imageUrl,
      source,
    });
  };

  // User Override: Update portion weight of a single item and recalculate calories & macros proportionally
  const handleUpdateItemWeight = (itemId: string, newWeight: number) => {
    if (!analysisResult) return;
    const clampedWeight = Math.max(5, newWeight);

    const updatedItems = analysisResult.detected_items.map((item) => {
      if (item.id !== itemId) return item;
      const ratio = clampedWeight / (item.estimated_weight_g || 1);
      return {
        ...item,
        estimated_weight_g: clampedWeight,
        calories: Math.round(item.calories * ratio),
        protein_g: Math.round(item.protein_g * ratio * 10) / 10,
        carbs_g: Math.round(item.carbs_g * ratio * 10) / 10,
        fat_g: Math.round(item.fat_g * ratio * 10) / 10,
        fiber_g: item.fiber_g ? Math.round(item.fiber_g * ratio * 10) / 10 : 0,
        sodium_mg: item.sodium_mg ? Math.round(item.sodium_mg * ratio) : 0,
      };
    });

    recalculateTotals(updatedItems);
  };

  const handleUpdateItemName = (itemId: string, newName: string) => {
    if (!analysisResult) return;
    const updatedItems = analysisResult.detected_items.map((item) =>
      item.id === itemId ? { ...item, item_name: newName } : item
    );
    setAnalysisResult({ ...analysisResult, detected_items: updatedItems });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!analysisResult) return;
    const updatedItems = analysisResult.detected_items.filter((item) => item.id !== itemId);
    recalculateTotals(updatedItems);
  };

  const handleAddItem = () => {
    if (!analysisResult) return;
    const newItem: MealItem = {
      id: `custom-${Date.now()}`,
      item_name: 'Additional side / sauce',
      estimated_weight_g: 50,
      calories: 60,
      protein_g: 2,
      carbs_g: 5,
      fat_g: 3,
      fiber_g: 1,
      confidence: 1.0,
      visual_clues: 'User manual addition',
    };
    const updatedItems = [...analysisResult.detected_items, newItem];
    recalculateTotals(updatedItems);
  };

  const recalculateTotals = (items: MealItem[]) => {
    if (!analysisResult) return;
    const total_calories = items.reduce((s, i) => s + i.calories, 0);
    const protein_g = Math.round(items.reduce((s, i) => s + i.protein_g, 0) * 10) / 10;
    const carbs_g = Math.round(items.reduce((s, i) => s + i.carbs_g, 0) * 10) / 10;
    const fat_g = Math.round(items.reduce((s, i) => s + i.fat_g, 0) * 10) / 10;
    const fiber_g = Math.round(items.reduce((s, i) => s + (i.fiber_g || 0), 0) * 10) / 10;
    const sodium_mg = Math.round(items.reduce((s, i) => s + (i.sodium_mg || 0), 0));

    setAnalysisResult({
      ...analysisResult,
      total_calories,
      total_macros: {
        protein_g,
        carbs_g,
        fat_g,
        fiber_g,
        sodium_mg,
      },
      detected_items: items,
    });
  };

  const handleConfirmAndLog = () => {
    if (!analysisResult) return;

    const loggedMeal: LoggedMeal = {
      id: `meal-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mealType,
      meal_name: analysisResult.meal_name,
      confidence_score: analysisResult.confidence_score,
      total_calories: analysisResult.total_calories,
      total_macros: analysisResult.total_macros,
      detected_items: analysisResult.detected_items,
      dietary_flags: analysisResult.dietary_flags,
      nutritionist_tip: analysisResult.nutritionist_tip,
      image_url: analysisResult.image_url,
      source: analysisResult.source,
    };

    onMealLogged(loggedMeal);

    // Fire celebratory confetti!
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#ff7e5f', '#2fae78', '#ffeaae', '#e2d8ff'],
    });

    // Reset and close
    setAnalysisResult(null);
    setCapturedImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-5 bg-[#2b2236]/50 backdrop-blur-sm"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1.5rem)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logfood-title"
        className="bg-slate-900 w-full max-w-3xl max-h-full flex flex-col overflow-hidden rounded-t-[1.75rem] sm:rounded-[1.75rem] shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-700 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between px-5 pt-3 pb-3 gap-3 shrink-0">
          <div className="min-w-0">
            <h2 id="logfood-title" className="font-display text-2xl font-semibold text-ink">
              Log food
            </h2>
            <p className="text-xs text-slate-400 truncate">
              {mealType} · {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="relative">
              <span className="sr-only">Meal</span>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
                className="appearance-none bg-butter text-butter-ink text-sm font-semibold rounded-full pl-4 pr-8 h-10 focus:outline-none focus:ring-2 focus:ring-coral cursor-pointer"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-butter-ink" />
            </label>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 rounded-full bg-slate-800 text-ink flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
          {/* Error Banner if any */}
          {errorMessage && (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-3.5 flex items-start gap-3 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Notice:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isAnalyzing && (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 animate-spin flex items-center justify-center p-1">
                  <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Reading your plate…</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Finding each food, estimating portions and adding up the nutrition.
                </p>
              </div>
            </div>
          )}

          {/* If Result Ready -> Show Module A Review & User Override UI */}
          {!isAnalyzing && analysisResult ? (
            <div className="space-y-6">
              {/* Review Header Card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5">
                {/* Image Preview with Detection Badge */}
                {analysisResult.image_url && (
                  <div className="relative w-full sm:w-44 h-40 sm:h-auto rounded-xl overflow-hidden shrink-0 border border-slate-800">
                    <img
                      src={analysisResult.image_url}
                      alt={analysisResult.meal_name}
                      className="w-full h-full object-cover"
                    />
                    {['camera', 'upload', 'voice'].includes(analysisResult.source) && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-[#ffffff]/10 text-[11px] font-bold text-[#a6e07a] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {Math.round(analysisResult.confidence_score * 100)}% confidence
                      </div>
                    )}
                  </div>
                )}

                {/* Macro Summary & Title */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {mealType}
                      </span>
                      {analysisResult.dietary_flags.map((flag, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={analysisResult.meal_name}
                      onChange={(e) =>
                        setAnalysisResult({ ...analysisResult, meal_name: e.target.value })
                      }
                      className="text-lg sm:text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none w-full"
                    />

                    {analysisResult.nutritionist_tip && (
                      <p className="text-xs text-slate-400 mt-2 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{analysisResult.nutritionist_tip}</span>
                      </p>
                    )}
                  </div>

                  {/* Giant Calories & Macros for Low Literacy Navigation */}
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">Total</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl sm:text-5xl font-bold text-amber-300">
                            {analysisResult.total_calories}
                          </span>
                          <span className="text-lg font-bold text-slate-300">Calories</span>
                        </div>
                      </div>

                      {/* Hear Nutrition Button */}
                      <button
                        type="button"
                        onClick={handleSpeakAnalysis}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-md ${
                          isSpeakingResult
                            ? 'bg-rose-500/30 border-rose-400 text-rose-200 animate-pulse'
                            : 'bg-indigo-600/30 hover:bg-indigo-600/40 border-indigo-400/50 text-indigo-200'
                        }`}
                        title="Hear meal nutrition spoken aloud"
                      >
                        {isSpeakingResult ? (
                          <VolumeX className="w-4 h-4 text-rose-300 animate-spin" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-indigo-300 stroke-[3]" />
                        )}
                        <span>{isSpeakingResult ? 'Stop' : 'Read aloud'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="block text-xs font-bold text-lilac-ink">Protein</span>
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {analysisResult.total_macros.protein_g}g
                        </span>
                      </div>
                      <div className="text-center p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="block text-xs font-bold text-butter-ink">Carbs</span>
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {analysisResult.total_macros.carbs_g}g
                        </span>
                      </div>
                      <div className="text-center p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="block text-xs font-bold text-leaf-ink">Fat</span>
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {analysisResult.total_macros.fat_g}g
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Item Breakdown & User Override Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      Items and portions
                    </h4>
                    <p className="text-xs text-slate-400">
                      Change a weight and the calories and macros update.
                    </p>
                  </div>
                  <button
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {analysisResult.detected_items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/40 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-3.5 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Name & visual clue */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) => handleUpdateItemName(item.id, e.target.value)}
                            className="text-sm font-semibold text-slate-200 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-emerald-500 focus:outline-none w-full"
                          />
                          {item.visual_clues && (
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              🔍 {item.visual_clues}
                            </span>
                          )}
                        </div>

                        {/* Portion Grams slider & input */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                            <input
                              type="number"
                              min="5"
                              max="1200"
                              value={item.estimated_weight_g}
                              onChange={(e) =>
                                handleUpdateItemWeight(item.id, Number(e.target.value))
                              }
                              className="w-14 bg-transparent text-sm font-bold text-white text-right focus:outline-none"
                            />
                            <span className="text-xs text-slate-400 font-medium">g</span>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <span className="text-sm font-bold text-amber-300 block">
                              {item.calories} kcal
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              P: {item.protein_g}g &bull; C: {item.carbs_g}g &bull; F: {item.fat_g}g
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Slider for smooth visual portion adjustment */}
                      <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 font-medium">Portion</span>
                        <input
                          type="range"
                          min="10"
                          max="500"
                          step="5"
                          value={item.estimated_weight_g}
                          onChange={(e) =>
                            handleUpdateItemWeight(item.id, Number(e.target.value))
                          }
                          className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">
                          {Math.round((item.estimated_weight_g / 28.35) * 10) / 10} oz
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    setAnalysisResult(null);
                    setCapturedImage(null);
                  }}
                  className="flex items-center gap-1.5 px-4 h-14 rounded-full bg-slate-800 text-ink text-sm font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Start over</span>
                </button>

                <button
                  onClick={handleConfirmAndLog}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 h-14 rounded-full btn-primary text-base font-semibold active:scale-95 transition-transform cursor-pointer"
                >
                  <Check className="w-5 h-5" strokeWidth={2.6} />
                  <span>
                    Add to {mealType.toLowerCase()} · {analysisResult.total_calories} kcal
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* Mode Selector Tabs */
            !isAnalyzing && (
              <div className="space-y-5">
                {/* Ways to log food; AI ones are hidden when no AI server is reachable */}
                <div role="tablist" className="flex gap-1 p-1 bg-slate-800 rounded-full overflow-x-auto no-scrollbar">
                  {VISIBLE_TABS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={activeTab === id}
                      onClick={() => {
                        setActiveTab(id);
                        setErrorMessage(null);
                      }}
                      className={`relative flex-1 min-w-[96px] px-3 text-sm font-semibold rounded-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer h-11 ${
                        activeTab === id ? 'text-ink' : 'text-slate-400 hover:text-ink'
                      }`}
                    >
                      {activeTab === id && (
                        <motion.span
                          layoutId="scanner-tab"
                          className="absolute inset-0 rounded-full bg-slate-900 shadow-sm"
                          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        />
                      )}
                      <Icon className="relative w-4 h-4" />
                      <span className="relative whitespace-nowrap">{label}</span>
                    </button>
                  ))}
                </div>

                {activeTab === 'manual' && (
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleManualEntry();
                    }}
                  >
                    <div>
                      <h3 className="font-display text-lg font-semibold text-ink">Enter what you ate</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Calories are required; macros are optional. Check the food's label or menu.
                      </p>
                    </div>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold text-slate-300">Food</span>
                      <input
                        required
                        value={manual.name}
                        onChange={(e) => setManual({ ...manual, name: e.target.value })}
                        placeholder="e.g. Chicken biryani, 1 plate"
                        className="w-full bg-slate-800 border-2 border-transparent rounded-2xl px-4 py-3 text-sm text-ink placeholder-slate-500 focus:outline-none focus:border-coral min-h-[52px]"
                      />
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(
                        [
                          ['calories', 'Calories', 'kcal'],
                          ['protein', 'Protein', 'g'],
                          ['carbs', 'Carbs', 'g'],
                          ['fat', 'Fat', 'g'],
                        ] as const
                      ).map(([key, label, unit]) => (
                        <label key={key} className="block space-y-1.5">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                            {key !== 'calories' && (
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: key === 'protein' ? '#8b6cf0' : key === 'carbs' ? '#f5b53f' : '#2fae78' }} />
                            )}
                            {label}
                          </span>
                          <div className={`flex items-center border-2 border-transparent rounded-2xl focus-within:border-coral ${key === 'calories' ? 'bg-peach' : 'bg-slate-800'}`}>
                            <input
                              required={key === 'calories'}
                              type="number"
                              inputMode="decimal"
                              min="0"
                              max={key === 'calories' ? 5000 : 500}
                              step="any"
                              value={manual[key]}
                              onChange={(e) => setManual({ ...manual, [key]: e.target.value })}
                              className="w-full min-w-0 bg-transparent px-4 py-3 num text-base font-semibold text-ink focus:outline-none min-h-[52px]"
                            />
                            <span className="pr-3 text-xs text-slate-400">{unit}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-full btn-primary font-semibold text-base active:scale-[0.98] transition-transform cursor-pointer min-h-[56px]"
                    >
                      Review and save
                    </button>
                    {!AI_ENABLED && (
                      <p className="flex items-center gap-2 text-xs text-slate-400">
                        <Camera className="w-4 h-4 text-lilac-ink" />
                        Snap your plate to log it automatically
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-lilac text-lilac-ink text-[10px] font-bold">SOON</span>
                      </p>
                    )}
                  </form>
                )}

                {/* 1. Tab Content: Curated Sample Plates Gallery */}
                {activeTab === 'samples' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Quick picks
                      </h4>
                      <p className="text-xs text-slate-400">
                        Common dishes with typical nutrition values. Adjust the portion before saving.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {SAMPLE_PLATES.map((sample) => (
                        <div
                          key={sample.id}
                          onClick={() => handleSelectSample(sample)}
                          className="group bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-emerald-500/10"
                        >
                          <div className="h-32 w-full overflow-hidden relative">
                            <img
                              src={sample.image_url}
                              alt={sample.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-300">
                              {sample.mealType}
                            </div>
                          </div>
                          <div className="p-3">
                            <h5 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                              {sample.title}
                            </h5>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {sample.subtitle}
                            </p>
                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-900 text-xs">
                              <span className="font-bold text-amber-300">
                                ~{sample.fallbackData.total_calories} kcal
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                {sample.fallbackData.total_macros.protein_g}g Protein
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Tab Content: Live Camera Feed */}
                {activeTab === 'camera' && (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-full max-w-md aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Viewfinder crosshairs / frame */}
                      <div className="absolute inset-8 border border-[#ffffff]/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                        <div className="flex justify-between">
                          <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                          <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                        </div>
                        <div className="text-center text-[11px] text-white/80 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm self-center">
                          Center your plate or food bowl
                        </div>
                        <div className="flex justify-between">
                          <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                          <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                        </div>
                      </div>
                    </div>

                    {/* Camera Control Buttons */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
                        }
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Flip Camera
                      </button>

                      <button
                        onClick={handleCapturePhoto}
                        className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                      >
                        <div className="w-full h-full rounded-full border border-slate-950 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-slate-950" />
                        </div>
                      </button>

                      <button
                        onClick={startCamera}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Restart Feed
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Tab Content: File Upload */}
                {activeTab === 'upload' && (
                  <div className="border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-colors bg-slate-950/40">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h4 className="text-base font-bold text-white">Upload Food Photo</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Choose an existing photo of your breakfast, lunch, dinner, or snack from your camera roll or device.
                    </p>
                    <label className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer shadow-md transition-all active:scale-95">
                      <Upload className="w-4 h-4 stroke-[2.5]" />
                      <span>Browse Files</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                )}

                {/* 4. Tab Content: Natural Language Voice / Text Logging */}
                {activeTab === 'voice_text' && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Mic className="w-4 h-4 text-emerald-400" />
                        Natural Language Voice or Text Logging
                      </h4>
                      <p className="text-xs text-slate-400">
                        Speak or type naturally (e.g., &ldquo;I ate 2 boiled eggs and an avocado toast with a black coffee&rdquo;).
                      </p>
                    </div>

                    <div className="relative">
                      <textarea
                        rows={3}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="e.g. 150g grilled chicken breast, 1 cup brown rice, and a bowl of steamed broccoli with olive oil..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all cursor-pointer ${
                          isListening
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        title={isListening ? 'Stop listening' : 'Start microphone dictation'}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Try voice dictation or type your meal</span>
                      </div>
                      <button
                        onClick={handleParseText}
                        disabled={!textInput.trim()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Parse &amp; Calculate Calories
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Tab Content: Barcode & Packaging Scanner */}
                {activeTab === 'barcode' && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Barcode className="w-4 h-4 text-emerald-400" />
                        Barcode Scanner &amp; Packaged Food Lookup
                      </h4>
                      <p className="text-xs text-slate-400">
                        Scan or enter a product barcode to query verified nutritional metrics directly via OpenFoodFacts.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        placeholder="Enter barcode number (e.g. 737628064502)"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={handleBarcodeLookup}
                        disabled={barcodeLoading || !barcodeInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {barcodeLoading ? 'Searching...' : 'Lookup Barcode'}
                      </button>
                    </div>

                    {/* Example Barcodes list */}
                    <div className="pt-2">
                      <span className="text-xs text-slate-400 font-semibold block mb-1.5">
                        Quick test barcodes:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { code: '737628064502', name: 'Thai Kitchen Rice Noodles' },
                          { code: '3017620422003', name: 'Nutella Hazelnut Spread' },
                          { code: '0011110824493', name: 'Greek Plain Yogurt' },
                        ].map((b) => (
                          <button
                            key={b.code}
                            type="button"
                            onClick={() => {
                              setBarcodeInput(b.code);
                            }}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                          >
                            {b.name} ({b.code})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Or Scan Nutrition Facts Label option */}
                    <div className="pt-4 border-t border-slate-800/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                        <div>
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            No barcode? Snap Nutrition Facts Label
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Take a photo of the printed nutrition panel on any box, bottle, or bag.
                          </p>
                        </div>
                        <label className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold cursor-pointer transition-colors active:scale-95 shrink-0">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Snap / Upload Label</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                handleScanNutritionLabel(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};
