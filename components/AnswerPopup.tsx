import React, { useEffect, useState } from 'react';
import { CheckCircle2, X, Lightbulb, Target } from 'lucide-react';
import { PopupData, QuestionType } from '../types';

interface AnswerPopupProps {
    data: PopupData;
    onClose: () => void;
}

const AnswerPopup: React.FC<AnswerPopupProps> = ({ data, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        setTimeout(() => setIsVisible(true), 100);

        // Auto-dismiss after 10 seconds
        const timer = setTimeout(() => {
            handleClose();
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const isMCQ = data.questionType === QuestionType.MCQ;

    return (
        <div
            className={`fixed top-6 right-6 z-[100] max-w-md transition-all duration-300 ${isVisible && !isExiting
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-full opacity-0'
                }`}
        >
            <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-2 border-emerald-500/30 rounded-3xl shadow-[0_20px_60px_rgba(16,185,129,0.3)] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isMCQ ? (
                            <Target className="w-6 h-6 text-white" />
                        ) : (
                            <Lightbulb className="w-6 h-6 text-white" />
                        )}
                        <div>
                            <h3 className="text-white font-bold text-lg">
                                {isMCQ ? 'MCQ Answer' : 'Suggested Answer'}
                            </h3>
                            <p className="text-emerald-100 text-xs">AI Analysis Complete</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* MCQ Answer Badge */}
                    {isMCQ && data.mcqOption && (
                        <div className="flex items-center gap-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-4">
                            <div className="bg-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <span className="text-white font-black text-3xl">
                                    {data.mcqOption}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-emerald-400 text-sm font-bold uppercase tracking-wide">
                                    Correct Answer
                                </p>
                                <p className="text-white font-semibold text-lg">
                                    Option {data.mcqOption}
                                </p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                    )}

                    {/* Answer Text */}
                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-700/50">
                        <p className="text-slate-300 leading-relaxed text-sm">
                            {data.answer}
                        </p>
                    </div>

                    {/* Explanation (if available) */}
                    {data.explanation && (
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                            <p className="text-blue-400 text-xs font-bold uppercase tracking-wide mb-2">
                                Explanation
                            </p>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {data.explanation}
                            </p>
                        </div>
                    )}
                </div>

                {/* Auto-dismiss indicator */}
                <div className="h-1 bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-500 animate-[shrink_10s_linear]"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
};

export default AnswerPopup;
