import mongoose, { Schema, Model } from 'mongoose';
import type { AllIndicators } from '@/types';

export interface IIndicator extends Omit<AllIndicators, 'timestamp'> {
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IndicatorSchema = new Schema<IIndicator>(
  {
    symbol: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now },
    rsi: {
      value: { type: Number, required: true },
      timestamp: { type: Number, required: true },
      signal: { type: String, enum: ['overbought', 'oversold', 'neutral'], required: true },
    },
    macd: {
      macd: { type: Number, required: true },
      signal: { type: Number, required: true },
      histogram: { type: Number, required: true },
      timestamp: { type: Number, required: true },
    },
    ema: {
      ema9: { type: Number, required: true },
      ema21: { type: Number, required: true },
      ema50: { type: Number, required: true },
      ema200: { type: Number, required: true },
    },
    bollingerBands: {
      upper: { type: Number, required: true },
      middle: { type: Number, required: true },
      lower: { type: Number, required: true },
      timestamp: { type: Number, required: true },
      bandwidth: { type: Number, required: true },
      percentB: { type: Number, required: true },
    },
    volumeProfile: [
      {
        priceLevel: { type: Number, required: true },
        volume: { type: Number, required: true },
        percentage: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
IndicatorSchema.index({ symbol: 1, timestamp: -1 });

// TTL index to auto-delete old indicators after 24 hours
IndicatorSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

const Indicator: Model<IIndicator> =
  mongoose.models.Indicator || mongoose.model<IIndicator>('Indicator', IndicatorSchema);

export default Indicator;
