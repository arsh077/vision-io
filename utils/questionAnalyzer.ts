import { QuestionType, PopupData } from '../types';

/**
 * Detects if the text contains an MCQ question
 */
export function detectQuestionType(text: string): QuestionType {
    const normalizedText = text.toLowerCase();

    // MCQ patterns
    const mcqPatterns = [
        /\b[a-d]\s*[).]\s*/gi,  // a) b) c) d) or a. b. c. d.
        /\b[1-4]\s*[).]\s*/gi,  // 1) 2) 3) 4) or 1. 2. 3. 4.
        /\(a\)|\(b\)|\(c\)|\(d\)/gi,  // (a) (b) (c) (d)
    ];

    // Count MCQ option matches
    let optionCount = 0;
    for (const pattern of mcqPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length >= 2) {
            optionCount = matches.length;
            break;
        }
    }

    // If we found 2 or more options, it's likely an MCQ
    if (optionCount >= 2) {
        return QuestionType.MCQ;
    }

    // Check for question indicators
    const hasQuestionMark = text.includes('?');
    const hasQuestionWords = /\b(what|which|who|where|when|why|how|is|are|do|does|can|will|would)\b/i.test(normalizedText);

    if (hasQuestionMark || hasQuestionWords) {
        return QuestionType.DESCRIPTIVE;
    }

    return QuestionType.UNKNOWN;
}

/**
 * Extracts MCQ answer from AI response
 */
export function extractMCQAnswer(aiResponse: string): string | null {
    const normalizedResponse = aiResponse.toLowerCase();

    // Patterns to find the answer
    const patterns = [
        /answer\s*:?\s*\(?([a-d])\)?/i,
        /correct\s+(?:answer|option)\s*:?\s*\(?([a-d])\)?/i,
        /option\s*\(?([a-d])\)?\s+is\s+correct/i,
        /\b([a-d])\s+is\s+(?:the\s+)?correct/i,
        /^([a-d])[).]/m,  // Answer starting with letter
    ];

    for (const pattern of patterns) {
        const match = aiResponse.match(pattern);
        if (match && match[1]) {
            return match[1].toUpperCase();
        }
    }

    return null;
}

/**
 * Creates popup data from analysis results
 */
export function createPopupData(
    extractedText: string,
    aiResponse: string
): PopupData | null {
    const questionType = detectQuestionType(extractedText);

    if (questionType === QuestionType.UNKNOWN) {
        return null; // Don't show popup for non-questions
    }

    let mcqOption: string | undefined;
    let answer = aiResponse;
    let explanation: string | undefined;

    if (questionType === QuestionType.MCQ) {
        mcqOption = extractMCQAnswer(aiResponse) || undefined;

        // Try to split answer and explanation
        const parts = aiResponse.split(/explanation:|because:|reason:/i);
        if (parts.length > 1) {
            answer = parts[0].trim();
            explanation = parts.slice(1).join(' ').trim();
        }
    } else {
        // For descriptive questions, truncate if too long
        if (aiResponse.length > 200) {
            answer = aiResponse.substring(0, 200) + '...';
            explanation = 'See full answer below';
        }
    }

    return {
        answer,
        questionType,
        mcqOption,
        explanation
    };
}
