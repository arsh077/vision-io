
export interface AnalysisResult {
  id: string;
  timestamp: number;
  extractedText: string;
  aiResponse: string;
  imageUrl: string;
}

export enum AppState {
  IDLE = 'IDLE',
  CAPTURING = 'CAPTURING',
  SELECTING = 'SELECTING',
  PROCESSING_OCR = 'PROCESSING_OCR',
  THINKING = 'THINKING',
  ERROR = 'ERROR'
}

declare global {
  interface Window {
    Tesseract: any;
  }
}
