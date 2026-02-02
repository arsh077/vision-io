
export class GroqService {
  private apiKey: string;
  private apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor() {
    this.apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
  }

  async analyzeText(text: string, customPrompt?: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error("Groq API key is not configured. Please set VITE_GROQ_API_KEY in .env.local");
      }

      const systemPrompt = customPrompt || "Explain this text and provide an accurate answer or summary if it's a question:";
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 0.95
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        throw new Error("No response received from Groq API");
      }

      return aiResponse;
    } catch (error) {
      console.error("Groq API Error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to get response from Groq: ${error.message}`);
      }
      throw new Error("Failed to get response from Groq.");
    }
  }
}

export const geminiService = new GroqService();
