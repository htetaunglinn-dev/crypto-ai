import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { AllIndicators, CryptoPrice, ClaudeAnalysis } from '@/types';
import { createMarketAnalysisPrompt } from './prompts';

export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: string = 'gemini-2.0-flash';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateAnalysis(
    price: CryptoPrice,
    indicators: AllIndicators,
    timeframe: string = '1h'
  ): Promise<ClaudeAnalysis> {
    try {
      const prompt = createMarketAnalysisPrompt(price, indicators);
      const model = this.client.getGenerativeModel({ model: this.model });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      const response = result.response;

      if (!response) {
        throw new Error('Gemini API returned empty response');
      }

      if (response.promptFeedback?.blockReason) {
        throw new Error(`Gemini blocked the prompt: ${response.promptFeedback.blockReason}`);
      }

      const candidate = response.candidates?.[0];
      if (!candidate) {
        throw new Error('Gemini returned no candidates in response');
      }

      if (candidate.finishReason === 'SAFETY') {
        const safetyRatings = candidate.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ');
        throw new Error(`Gemini blocked response due to safety: ${safetyRatings || 'Unknown reason'}`);
      }

      const text = response.text();

      if (!text || text.trim() === '') {
        throw new Error('Gemini API returned empty text response');
      }

      let analysisData;
      try {
        let cleanedText = text.trim();

        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        analysisData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', {
          responseText: text,
          error: parseError,
        });
        throw new Error(`Gemini returned invalid JSON. Response preview: ${text.substring(0, 200)}...`);
      }

      const requiredFields = ['signal', 'confidence', 'marketAnalysis', 'suggestedEntry', 'suggestedExit', 'stopLoss'];
      const missingFields = requiredFields.filter(field => !(field in analysisData));

      if (missingFields.length > 0) {
        throw new Error(`Gemini response missing required fields: ${missingFields.join(', ')}`);
      }

      const expirationMinutes = timeframe === '1d' ? 60 : 5;
      const expiresAt = Date.now() + expirationMinutes * 60 * 1000;

      return {
        symbol: price.symbol,
        timestamp: Date.now(),
        currentPrice: price.price,
        timeframe,
        expiresAt,
        ...analysisData,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = {
        message: errorMessage,
        name: error instanceof Error ? error.name : 'Error',
        stack: error instanceof Error ? error.stack : undefined,
      };

      console.error('Error generating Gemini analysis:', errorDetails);

      if (errorMessage.includes('API key')) {
        throw new Error('Invalid Gemini API key. Please check your API key in settings.');
      }

      if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.');
      }

      throw new Error(`Gemini API error: ${errorMessage}`);
    }
  }

  async generateQuickSignal(
    symbol: string,
    price: number,
    indicators: AllIndicators
  ): Promise<{
    signal: string;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const prompt = `Provide a quick trading signal for ${symbol} at $${price}.
RSI: ${indicators.rsi.value} (${indicators.rsi.signal})
MACD Histogram: ${indicators.macd.histogram}
Price vs EMA200: ${price > indicators.ema.ema200 ? 'above' : 'below'}

Return JSON only: {"signal": "buy/sell/hold", "confidence": 0-100, "reasoning": "brief explanation"}`;

      const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      });

      const response = result.response;

      if (!response) {
        throw new Error('Gemini API returned empty response');
      }

      if (response.promptFeedback?.blockReason) {
        throw new Error(`Gemini blocked the prompt: ${response.promptFeedback.blockReason}`);
      }

      const text = response.text();

      if (!text || text.trim() === '') {
        throw new Error('Gemini API returned empty text response');
      }

      let signalData;
      try {
        let cleanedText = text.trim();

        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        signalData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse Gemini signal response:', {
          responseText: text,
          error: parseError,
        });
        throw new Error(`Gemini returned invalid JSON for signal`);
      }

      if (!signalData.signal || !signalData.confidence || !signalData.reasoning) {
        throw new Error('Gemini signal response missing required fields');
      }

      return signalData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error generating quick signal:', {
        message: errorMessage,
        error,
      });

      throw new Error(`Failed to generate trading signal: ${errorMessage}`);
    }
  }

  async analyzeSentiment(text: string, symbol: string): Promise<{
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    summary: string;
  }> {
    try {
      const prompt = `Analyze the sentiment of this crypto market text about ${symbol}:

"${text}"

Return JSON only: {"sentiment": "bullish/bearish/neutral", "confidence": 0-100, "summary": "brief summary"}`;

      const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      });

      const response = result.response;

      if (!response) {
        throw new Error('Gemini API returned empty response');
      }

      if (response.promptFeedback?.blockReason) {
        throw new Error(`Gemini blocked the prompt: ${response.promptFeedback.blockReason}`);
      }

      const responseText = response.text();

      if (!responseText || responseText.trim() === '') {
        throw new Error('Gemini API returned empty text response');
      }

      let sentimentData;
      try {
        let cleanedText = responseText.trim();

        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        sentimentData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse Gemini sentiment response:', {
          responseText,
          error: parseError,
        });
        throw new Error(`Gemini returned invalid JSON for sentiment`);
      }

      if (!sentimentData.sentiment || !sentimentData.confidence || !sentimentData.summary) {
        throw new Error('Gemini sentiment response missing required fields');
      }

      return sentimentData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error analyzing sentiment:', {
        message: errorMessage,
        error,
      });

      throw new Error(`Failed to analyze sentiment: ${errorMessage}`);
    }
  }
}

export const createGeminiService = (apiKey: string): GeminiService => {
  return new GeminiService(apiKey);
};
