import type { AllIndicators, CryptoPrice } from '@/types';

export const createMarketAnalysisPrompt = (
  price: CryptoPrice,
  indicators: AllIndicators
): string => {
  return `You are a professional cryptocurrency trading analyst. Analyze the following market data and provide a comprehensive trading analysis.

**Symbol:** ${price.symbol}
**Current Price:** $${price.price.toFixed(2)}
**24h Change:** ${price.changePercent24h.toFixed(2)}%
**24h High/Low:** $${price.high24h.toFixed(2)} / $${price.low24h.toFixed(2)}
**24h Volume:** $${price.volume24h.toLocaleString()}

**Technical Indicators:**

RSI (14): ${indicators.rsi.value.toFixed(2)} - ${indicators.rsi.signal}

MACD:
- MACD Line: ${indicators.macd.macd.toFixed(2)}
- Signal Line: ${indicators.macd.signal.toFixed(2)}
- Histogram: ${indicators.macd.histogram.toFixed(2)}

EMAs:
- EMA 9: $${indicators.ema.ema9.toFixed(2)}
- EMA 21: $${indicators.ema.ema21.toFixed(2)}
- EMA 50: $${indicators.ema.ema50.toFixed(2)}
- EMA 200: $${indicators.ema.ema200.toFixed(2)}

Bollinger Bands:
- Upper: $${indicators.bollingerBands.upper.toFixed(2)}
- Middle: $${indicators.bollingerBands.middle.toFixed(2)}
- Lower: $${indicators.bollingerBands.lower.toFixed(2)}
- Bandwidth: ${indicators.bollingerBands.bandwidth.toFixed(2)}%
- %B: ${indicators.bollingerBands.percentB.toFixed(2)}

Based on this data, provide a JSON response with the following structure:

{
  "signal": "strong_buy" | "buy" | "hold" | "sell" | "strong_sell",
  "confidence": <0-100>,
  "marketAnalysis": {
    "summary": "<2-3 sentence overview>",
    "trend": "bullish" | "bearish" | "sideways",
    "momentum": "<description of momentum>",
    "keyLevels": {
      "support": [<price levels>],
      "resistance": [<price levels>]
    },
    "insights": [<array of key insights>]
  },
  "patterns": [
    {
      "name": "<pattern name>",
      "type": "bullish" | "bearish" | "neutral",
      "confidence": <0-100>,
      "description": "<what this pattern means>"
    }
  ],
  "riskAssessment": {
    "level": "low" | "medium" | "high" | "extreme",
    "score": <0-100>,
    "factors": {
      "volatility": <0-100>,
      "liquidityRisk": <0-100>,
      "technicalRisk": <0-100>
    },
    "recommendations": [<array of risk management tips>]
  },
  "suggestedEntry": <optimal entry price or null>,
  "suggestedExit": <target exit price or null>,
  "stopLoss": <suggested stop loss or null>
}

Provide ONLY the JSON response, no additional text.`;
};

export const createPatternRecognitionPrompt = (
  symbol: string,
  recentPrices: number[]
): string => {
  return `Analyze the following price sequence for ${symbol} and identify any chart patterns.

Recent prices (most recent last): ${recentPrices.join(', ')}

Identify common patterns such as:
- Head and Shoulders / Inverse Head and Shoulders
- Double Top / Double Bottom
- Triangle patterns (ascending, descending, symmetrical)
- Cup and Handle
- Flags and Pennants
- Wedges

Return a JSON array of identified patterns:
[
  {
    "name": "<pattern name>",
    "type": "bullish" | "bearish" | "neutral",
    "confidence": <0-100>,
    "description": "<brief explanation>",
    "targetPrice": <projected price target or null>,
    "stopLoss": <suggested stop loss or null>
  }
]

If no clear patterns are identified, return an empty array. Provide ONLY the JSON response.`;
};

export const createRiskAssessmentPrompt = (
  price: CryptoPrice,
  indicators: AllIndicators
): string => {
  return `Assess the trading risk for ${price.symbol} based on the following data:

Current Price: $${price.price}
24h Volatility: ${Math.abs(price.changePercent24h)}%
RSI: ${indicators.rsi.value}
Bollinger Band Width: ${indicators.bollingerBands.bandwidth}%

Provide a risk assessment in JSON format:
{
  "level": "low" | "medium" | "high" | "extreme",
  "score": <0-100>,
  "factors": {
    "volatility": <0-100>,
    "liquidityRisk": <0-100>,
    "technicalRisk": <0-100>
  },
  "recommendations": [
    "<risk management recommendation 1>",
    "<risk management recommendation 2>",
    "<risk management recommendation 3>"
  ]
}

Consider:
- RSI extremes indicate potential reversals (higher risk)
- High volatility increases risk
- Tight Bollinger Bands suggest low volatility (breakout potential)
- Wide Bollinger Bands suggest high volatility

Provide ONLY the JSON response.`;
};

export const createTradingSignalPrompt = (
  indicators: AllIndicators,
  price: number
): string => {
  const rsiSignal = indicators.rsi.signal;
  const macdCross = indicators.macd.histogram > 0 ? 'bullish' : 'bearish';
  const priceVsEMA = price > indicators.ema.ema200 ? 'above' : 'below';

  return `Generate a trading signal based on:

Price: $${price}
RSI Signal: ${rsiSignal}
MACD Cross: ${macdCross}
Price vs EMA200: ${priceVsEMA}

Return JSON:
{
  "signal": "strong_buy" | "buy" | "hold" | "sell" | "strong_sell",
  "confidence": <0-100>,
  "reasoning": "<brief explanation>"
}

Signal criteria:
- Strong Buy: Multiple bullish confirmations
- Buy: Bullish bias with some confirmation
- Hold: Mixed or unclear signals
- Sell: Bearish bias with some confirmation
- Strong Sell: Multiple bearish confirmations

Provide ONLY the JSON response.`;
};
