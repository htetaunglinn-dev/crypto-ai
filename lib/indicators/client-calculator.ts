/**
 * Client-side indicator calculator
 * Re-exports the IndicatorCalculator for use in browser/React components
 * This allows real-time indicator recalculation when new candle data arrives via WebSocket
 */

export { IndicatorCalculator } from './calculator';
