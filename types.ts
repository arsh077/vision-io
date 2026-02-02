
export interface AnalysisResult {
  id: string;
  timestamp: number;
  extractedText: string;
  aiResponse: string;
  imageUrl: string;
  questionType?: QuestionType;
  mcqAnswer?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  CAPTURING = 'CAPTURING',
  SELECTING = 'SELECTING',
  PROCESSING_OCR = 'PROCESSING_OCR',
  THINKING = 'THINKING',
  ERROR = 'ERROR'
}

export enum QuestionType {
  MCQ = 'MCQ',
  DESCRIPTIVE = 'DESCRIPTIVE',
  UNKNOWN = 'UNKNOWN'
}

export interface PopupData {
  answer: string;
  questionType: QuestionType;
  mcqOption?: string;
  explanation?: string;
}

declare global {
  interface Window {
    Tesseract: any;
  }
}
