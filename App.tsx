
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { geminiService } from './services/geminiService';
import Overlay from './components/Overlay';
import AnswerPopup from './components/AnswerPopup';
import { AppState, AnalysisResult, PopupData } from './types';
import { createPopupData } from './utils/questionAnalyzer';
import {
  Camera,
  RotateCcw,
  History as HistoryIcon,
  BrainCircuit,
  FileText,
  Copy,
  Check,
  Zap,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  Plus
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState("Solve this question or explain the key points of this text accurately.");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [popupData, setPopupData] = useState<PopupData | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle paste events for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) processFile(blob);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const startScreenCapture = async () => {
    try {
      setError(null);
      // Fallback for environments that don't support getDisplayMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen capture is not supported in this browser or environment. Please use 'Upload Image' instead.");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to actually start
        await videoRef.current.play();
      }

      setAppState(AppState.SELECTING);

      stream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };
    } catch (err: any) {
      console.error("Capture Error:", err);
      let msg = "Screen capture failed.";
      if (err.name === 'NotAllowedError') msg = "Permission denied. Check browser settings or try Upload.";
      if (err.name === 'NotFoundError') msg = "No screen capture sources available.";
      setError(msg);
      setAppState(AppState.IDLE);
    }
  };

  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setAppState(AppState.IDLE);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    setAppState(AppState.PROCESSING_OCR);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        await runOCRAndAnalysis(dataUrl);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError("Failed to process image file.");
      setAppState(AppState.IDLE);
    }
  };

  const handleAreaCapture = async (rect: { x: number; y: number; width: number; height: number }) => {
    if (!videoRef.current) return;
    setAppState(AppState.PROCESSING_OCR);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = rect.width;
      canvas.height = rect.height;

      const vWidth = videoRef.current.videoWidth;
      const vHeight = videoRef.current.videoHeight;
      const wWidth = window.innerWidth;
      const wHeight = window.innerHeight;

      const scaleX = vWidth / wWidth;
      const scaleY = vHeight / wHeight;

      ctx.drawImage(
        videoRef.current,
        rect.x * scaleX, rect.y * scaleY, rect.width * scaleX, rect.height * scaleY,
        0, 0, rect.width, rect.height
      );

      const imageDataUrl = canvas.toDataURL('image/png');
      await runOCRAndAnalysis(imageDataUrl);
      stopCapture();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during processing.");
      setAppState(AppState.IDLE);
      stopCapture();
    }
  };

  const runOCRAndAnalysis = async (imageDataUrl: string) => {
    try {
      setAppState(AppState.PROCESSING_OCR);

      const { data: { text } } = await window.Tesseract.recognize(imageDataUrl, 'eng');
      const extractedText = text.trim();

      if (!extractedText) {
        throw new Error("No clear text detected in the image. Try a clearer selection.");
      }

      setAppState(AppState.THINKING);
      const aiResponse = await geminiService.analyzeText(extractedText, currentPrompt);

      const newResult: AnalysisResult = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        extractedText,
        aiResponse,
        imageUrl: imageDataUrl
      };

      setResults(prev => [newResult, ...prev]);

      // Show popup with answer suggestion
      const popup = createPopupData(extractedText, aiResponse);
      if (popup) {
        setPopupData(popup);
      }

      setAppState(AppState.IDLE);
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
      setAppState(AppState.IDLE);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fix: Add missing clearHistory function to remove analysis results
  const clearHistory = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200 pb-24">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b,transparent)] opacity-50 pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Screen Vision</h1>
            <p className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase">AI Assistant</p>
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full group">
            <input
              type="text"
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              placeholder="Analysis goal (e.g. 'Solve this math problem')"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-500"
            />
            <Zap className="absolute left-3 top-3 w-4 h-4 text-blue-500 group-focus-within:animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-all border border-slate-700"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <button
            onClick={startScreenCapture}
            disabled={appState !== AppState.IDLE}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            {appState === AppState.IDLE ? <Camera className="w-5 h-5" /> : <RotateCcw className="w-5 h-5 animate-spin" />}
            <span className="hidden sm:inline">Capture</span>
          </button>
        </div>
      </header>

      {/* Main Results Area */}
      <main className="flex-1 container mx-auto p-4 md:p-8 max-w-5xl">
        {error && (
          <div className="mb-8 p-5 bg-red-950/30 border border-red-500/30 rounded-2xl text-red-200 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-red-500/20 p-2 rounded-lg"><X className="w-5 h-5 text-red-400" /></div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Action Required</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">✕</button>
          </div>
        )}

        {(appState === AppState.THINKING || appState === AppState.PROCESSING_OCR) && (
          <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-in fade-in zoom-in-95">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-blue-500/10 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-32 h-32 border-t-4 border-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className="w-12 h-12 text-blue-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {appState === AppState.PROCESSING_OCR ? 'Extracting Text...' : 'AI is Reasoning...'}
              </h2>
              <p className="text-slate-500 max-w-sm">
                Analyzing the visual information and preparing a detailed response.
              </p>
            </div>
          </div>
        )}

        {results.length === 0 && appState === AppState.IDLE && (
          <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-900/20 px-6">
            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl border border-slate-800">
              <ImageIcon className="w-12 h-12 text-slate-700" />
            </div>
            <h3 className="text-2xl font-bold text-slate-200 mb-3">Instant Screen Analysis</h3>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed mb-8">
              Capture a region, upload an image, or simply <strong>paste (CTRL+V)</strong> a screenshot here to get AI explanations, solutions, or summaries.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={startScreenCapture}
                className="px-6 py-3 bg-white text-slate-950 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                <Camera className="w-5 h-5" /> Start Capture
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <Upload className="w-5 h-5" /> Upload Image
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-10">
          {results.map((res, index) => (
            <div
              key={res.id}
              className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-12 duration-700"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex flex-col lg:flex-row min-h-[400px]">
                {/* Left: Metadata & Source */}
                <div className="lg:w-80 p-6 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-900/20">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                      Source Image
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="aspect-square bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl mb-8 group relative cursor-zoom-in">
                    <img src={res.imageUrl} alt="Captured" className="w-full h-full object-contain" />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      OCR Extraction
                    </h4>
                    <div className="text-xs text-slate-400 leading-relaxed italic bg-black/40 p-4 rounded-xl border border-slate-800/50 max-h-40 overflow-y-auto custom-scrollbar">
                      "{res.extractedText}"
                    </div>
                  </div>
                </div>

                {/* Right: AI Analysis Content */}
                <div className="flex-1 p-8 lg:p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-600/10 rounded-xl">
                        <Zap className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight">AI Analysis</h3>
                    </div>
                    <button
                      onClick={() => copyToClipboard(res.aiResponse, res.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${copiedId === res.id
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                    >
                      {copiedId === res.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedId === res.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
                    {res.aiResponse}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Action Panel (Bottom Right) */}
      <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 transition-all duration-500 ${isPanelExpanded ? 'translate-y-0' : 'translate-y-0'}`}>

        {isPanelExpanded && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-2 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-1">
              <button
                onClick={startScreenCapture}
                title="Screen Capture"
                className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/40"
              >
                <Camera className="w-6 h-6" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload Image"
                className="p-4 hover:bg-slate-800 text-slate-300 rounded-2xl transition-all"
              >
                <Upload className="w-6 h-6" />
              </button>
              <div className="w-px h-10 bg-slate-800 mx-1"></div>
              <button
                onClick={clearHistory}
                disabled={results.length === 0}
                title="Clear History"
                className="p-4 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-2xl transition-all disabled:opacity-30"
              >
                <Trash2 className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsPanelExpanded(false)}
                className="p-4 hover:bg-slate-800 text-slate-500 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {!isPanelExpanded && (
          <button
            onClick={() => setIsPanelExpanded(true)}
            className="w-16 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 animate-in fade-in zoom-in"
          >
            <Plus className="w-8 h-8" />
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*"
      />
      <video ref={videoRef} autoPlay playsInline className="hidden" />

      {appState === AppState.SELECTING && (
        <Overlay onCapture={handleAreaCapture} onCancel={stopCapture} />
      )}

      {popupData && (
        <AnswerPopup data={popupData} onClose={() => setPopupData(null)} />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default App;
