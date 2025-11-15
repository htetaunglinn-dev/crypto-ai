import mongoose, { Schema, Model } from 'mongoose';
import type { ClaudeAnalysis } from '@/types';

export interface IAnalysis extends Omit<ClaudeAnalysis, 'timestamp' | 'expiresAt'> {
  timestamp: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChartPatternSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['bullish', 'bearish', 'neutral'], required: true },
  confidence: { type: Number, required: true },
  description: { type: String, required: true },
  targetPrice: { type: Number },
  stopLoss: { type: Number },
});

const MarketAnalysisSchema = new Schema({
  summary: { type: String, required: true },
  trend: { type: String, enum: ['bullish', 'bearish', 'sideways'], required: true },
  momentum: { type: String, required: true },
  keyLevels: {
    support: [{ type: Number }],
    resistance: [{ type: Number }],
  },
  insights: [{ type: String }],
});

const RiskAssessmentSchema = new Schema({
  level: { type: String, enum: ['low', 'medium', 'high', 'extreme'], required: true },
  score: { type: Number, required: true },
  factors: {
    volatility: { type: Number, required: true },
    liquidityRisk: { type: Number, required: true },
    technicalRisk: { type: Number, required: true },
  },
  recommendations: [{ type: String }],
});

const AnalysisSchema = new Schema<IAnalysis>(
  {
    symbol: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now },
    signal: {
      type: String,
      enum: ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'],
      required: true,
    },
    confidence: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    marketAnalysis: { type: MarketAnalysisSchema, required: true },
    patterns: [ChartPatternSchema],
    riskAssessment: { type: RiskAssessmentSchema, required: true },
    suggestedEntry: { type: Number },
    suggestedExit: { type: Number },
    stopLoss: { type: Number },
    timeframe: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    aiProvider: { type: String, enum: ['claude', 'gemini'], default: 'claude' },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
AnalysisSchema.index({ symbol: 1, timestamp: -1 });

// TTL index to auto-delete expired analyses
AnalysisSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Analysis: Model<IAnalysis> =
  mongoose.models.Analysis || mongoose.model<IAnalysis>('Analysis', AnalysisSchema);

export default Analysis;
