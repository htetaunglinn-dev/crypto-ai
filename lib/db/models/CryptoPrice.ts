import mongoose, { Schema, Model } from 'mongoose';
import type { OHLCV } from '@/types';

export interface ICryptoPrice {
  symbol: string;
  interval: string;
  data: OHLCV[];
  createdAt: Date;
  updatedAt: Date;
}

const OHLCVSchema = new Schema<OHLCV>({
  timestamp: { type: Number, required: true },
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, required: true },
});

const CryptoPriceSchema = new Schema<ICryptoPrice>(
  {
    symbol: { type: String, required: true, index: true },
    interval: { type: String, required: true, index: true },
    data: [OHLCVSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
CryptoPriceSchema.index({ symbol: 1, interval: 1 }, { unique: true });

// TTL index to auto-delete old data after 7 days
CryptoPriceSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });

const CryptoPrice: Model<ICryptoPrice> =
  mongoose.models.CryptoPrice || mongoose.model<ICryptoPrice>('CryptoPrice', CryptoPriceSchema);

export default CryptoPrice;
