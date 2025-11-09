'use client';

import type { RiskAssessment } from '@/types';

interface RiskScoreProps {
  assessment: RiskAssessment;
}

export function RiskScore({ assessment }: RiskScoreProps) {
  const getRiskColor = () => {
    switch (assessment.level) {
      case 'low':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'high':
        return 'text-orange-500';
      case 'extreme':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getRiskBgColor = () => {
    switch (assessment.level) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'extreme':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-300">Risk Assessment</h3>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xl font-bold uppercase ${getRiskColor()}`}>
            {assessment.level} Risk
          </span>
          <span className="text-2xl font-bold text-white">{assessment.score}/100</span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800">
          <div
            className={`h-full transition-all duration-500 ${getRiskBgColor()}`}
            style={{ width: `${assessment.score}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Volatility Risk</span>
            <span className="text-white font-medium">{assessment.factors.volatility}/100</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${assessment.factors.volatility}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Liquidity Risk</span>
            <span className="text-white font-medium">{assessment.factors.liquidityRisk}/100</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${assessment.factors.liquidityRisk}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Technical Risk</span>
            <span className="text-white font-medium">{assessment.factors.technicalRisk}/100</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full bg-cyan-500 transition-all"
              style={{ width: `${assessment.factors.technicalRisk}%` }}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-3">
        <h4 className="text-xs font-semibold text-gray-400 mb-2">Risk Management</h4>
        <ul className="space-y-1">
          {assessment.recommendations.map((rec, index) => (
            <li key={index} className="text-xs text-gray-300 flex items-start">
              <span className="mr-2 text-green-500">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
