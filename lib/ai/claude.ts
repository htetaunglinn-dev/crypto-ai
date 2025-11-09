import Anthropic from '@anthropic-ai/sdk';
import type { AllIndicators, CryptoPrice, ClaudeAnalysis } from '@/types';
import { createMarketAnalysisPrompt } from './prompts';

export class ClaudeService {
  private client: Anthropic;
  private model: string = 'claude-3-5-sonnet-20241022';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * Generate comprehensive market analysis
   */
  async generateAnalysis(
    price: CryptoPrice,
    indicators: AllIndicators,
    timeframe: string = '1h'
  ): Promise<ClaudeAnalysis> {
    try {
      const prompt = createMarketAnalysisPrompt(price, indicators);

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 2048,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract the text content
      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse the JSON response
      const analysisData = JSON.parse(content.text);

      // Calculate expiration (5 minutes from now for short timeframes, longer for daily)
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
      console.error('Error generating Claude analysis:', error);
      throw new Error('Failed to generate market analysis');
    }
  }

  /**
   * Generate quick trading signal (lighter, faster analysis)
   */
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

      const message = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022', // Faster model for quick signals
        max_tokens: 256,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return JSON.parse(content.text);
    } catch (error) {
      console.error('Error generating quick signal:', error);
      throw new Error('Failed to generate trading signal');
    }
  }

  /**
   * Analyze market sentiment from text (for future news integration)
   */
  async analyzeSentiment(text: string, symbol: string): Promise<{
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    summary: string;
  }> {
    try {
      const prompt = `Analyze the sentiment of this crypto market text about ${symbol}:

"${text}"

Return JSON only: {"sentiment": "bullish/bearish/neutral", "confidence": 0-100, "summary": "brief summary"}`;

      const message = await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 256,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return JSON.parse(content.text);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }
}

/**
 * Create ClaudeService instance with user's API key
 */
export const createClaudeService = (apiKey: string): ClaudeService => {
  return new ClaudeService(apiKey);
};
