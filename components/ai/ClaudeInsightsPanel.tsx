"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Lock, RefreshCw, Sparkles } from "lucide-react";
import type { ClaudeAnalysis } from "@/types";
import type { FearGreedData, FearGreedHistoryPoint } from "@/types/fear-greed";
import { TradingSignal } from "./TradingSignal";
import { RiskScore } from "./RiskScore";
import { FearGreedGauge } from "./FearGreedGauge";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";

interface ClaudeInsightsPanelProps {
  authStatus: "authenticated" | "unauthenticated" | "loading";
  analysis: ClaudeAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  fearGreedData: FearGreedData | null;
  fearGreedHistory: FearGreedHistoryPoint[];
}

const trendClass = (trend: string) =>
  trend === "bullish" ? "text-up" : trend === "bearish" ? "text-down" : "text-yellow-400";

function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand/30 to-brand-2/20 ring-1 ring-brand/30">
          <Sparkles className="h-4 w-4 text-blue-300" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-line-strong p-5 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-3 text-gray-400">
        {icon}
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-gray-400">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ClaudeInsightsPanel({
  authStatus,
  analysis,
  isLoading,
  error,
  onRefresh,
  fearGreedData,
  fearGreedHistory,
}: ClaudeInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "patterns" | "levels">("overview");
  const providerName = analysis?.aiProvider === "gemini" ? "Gemini" : "Claude";
  const needsKey = !!error && /api key/i.test(error);

  let body: React.ReactNode;
  if (authStatus === "loading") {
    body = <div className="mt-4 h-40 skeleton" />;
  } else if (authStatus === "unauthenticated") {
    body = (
      <EmptyState
        icon={<Lock className="h-4 w-4" />}
        title="Unlock AI market analysis"
        body="Sign in and add your own Claude or Gemini key to get trading signals, risk scores, chart patterns and key levels for any coin."
        action={
          <div className="flex justify-center gap-2">
            <Link href="/auth/signup" className="btn btn-primary h-9">Create free account</Link>
            <Link href="/auth/signin" className="btn btn-secondary h-9">Sign in</Link>
          </div>
        }
      />
    );
  } else if (isLoading) {
    body = (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-600 border-t-brand" />
          Analyzing price action and indicators…
        </div>
        <div className="h-24 skeleton" />
        <div className="h-16 skeleton" />
        <div className="h-28 skeleton" />
      </div>
    );
  } else if (needsKey) {
    body = (
      <EmptyState
        icon={<KeyRound className="h-4 w-4" />}
        title="Add your AI key"
        body="AI analysis runs on your own Anthropic or Google Gemini API key. Add it in settings to start."
        action={<Link href="/settings" className="btn btn-primary h-9">Open settings</Link>}
      />
    );
  } else if (error) {
    body = (
      <EmptyState
        icon={<RefreshCw className="h-4 w-4" />}
        title="Analysis failed"
        body={error}
        action={<button onClick={onRefresh} className="btn btn-secondary h-9">Try again</button>}
      />
    );
  } else if (!analysis) {
    body = (
      <EmptyState
        icon={<Sparkles className="h-4 w-4" />}
        title="No analysis yet"
        body="Generate an AI read of this coin based on the daily chart and indicators."
        action={<button onClick={onRefresh} className="btn btn-primary h-9">Generate analysis</button>}
      />
    );
  } else {
    body = (
      <div className="mt-4 space-y-4">
        <TradingSignal signal={analysis.signal} confidence={analysis.confidence} />

        <div className="rounded-xl border border-line bg-surface-2/60 p-3.5">
          <div className="mb-3 segmented w-full" role="tablist">
            {(["overview", "patterns", "levels"] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                data-active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className="segmented-item flex-1 capitalize"
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-gray-200">{analysis.marketAnalysis.summary}</p>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-surface-3/60 px-3 py-2">
                  <div className="text-[11px] text-gray-500">Trend</div>
                  <div className={cn("text-sm font-semibold capitalize", trendClass(analysis.marketAnalysis.trend))}>
                    {analysis.marketAnalysis.trend}
                  </div>
                </div>
                <div className="rounded-lg bg-surface-3/60 px-3 py-2">
                  <div className="text-[11px] text-gray-500">Momentum</div>
                  <div className="text-sm font-semibold capitalize text-white">{analysis.marketAnalysis.momentum}</div>
                </div>
              </div>

              {analysis.marketAnalysis.insights.length > 0 && (
                <ul className="space-y-1.5">
                  {analysis.marketAnalysis.insights.map((insight, index) => (
                    <li key={index} className="flex gap-2 text-xs leading-relaxed text-gray-300">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              )}

              {(analysis.suggestedEntry || analysis.suggestedExit || analysis.stopLoss) && (
                <div className="grid grid-cols-3 gap-2 border-t border-line pt-3">
                  {[
                    { label: "Entry", value: analysis.suggestedEntry, cls: "text-up" },
                    { label: "Target", value: analysis.suggestedExit, cls: "text-blue-300" },
                    { label: "Stop loss", value: analysis.stopLoss, cls: "text-down" },
                  ].map(({ label, value, cls }) => (
                    <div key={label}>
                      <div className="text-[11px] text-gray-500">{label}</div>
                      <div className={cn("num text-xs font-semibold", value ? cls : "text-gray-600")}>
                        {value ? formatCurrency(value) : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "patterns" && (
            <div className="space-y-2">
              {analysis.patterns.length > 0 ? (
                analysis.patterns.map((pattern, index) => (
                  <div key={index} className="rounded-lg bg-surface-3/60 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white">{pattern.name}</h4>
                      <span
                        className={cn(
                          "pill",
                          pattern.type === "bullish" ? "pill-up" : pattern.type === "bearish" ? "pill-down" : "pill-neutral"
                        )}
                      >
                        {pattern.type} · {pattern.confidence}%
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-400">{pattern.description}</p>
                    {(pattern.targetPrice || pattern.stopLoss) && (
                      <div className="num mt-2 flex gap-4 text-xs">
                        {pattern.targetPrice && (
                          <span className="text-gray-500">
                            Target <span className="font-semibold text-up">{formatCurrency(pattern.targetPrice)}</span>
                          </span>
                        )}
                        {pattern.stopLoss && (
                          <span className="text-gray-500">
                            Stop <span className="font-semibold text-down">{formatCurrency(pattern.stopLoss)}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-gray-500">No patterns detected</p>
              )}
            </div>
          )}

          {activeTab === "levels" && (
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { title: "Resistance", levels: analysis.marketAnalysis.keyLevels.resistance, prefix: "R", cls: "text-down bg-down/10" },
                  { title: "Support", levels: analysis.marketAnalysis.keyLevels.support, prefix: "S", cls: "text-up bg-up/10" },
                ] as const
              ).map(({ title, levels, prefix, cls }) => (
                <div key={title}>
                  <h4 className="mb-1.5 text-[11px] text-gray-500">{title}</h4>
                  {levels.length > 0 ? (
                    <div className="space-y-1">
                      {levels.map((level, index) => (
                        <div key={index} className={cn("num flex items-center justify-between rounded-md px-2 py-1 text-xs font-semibold", cls)}>
                          <span className="opacity-70">{prefix}{index + 1}</span>
                          <span>{formatCurrency(level)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">None identified</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <RiskScore assessment={analysis.riskAssessment} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card card-pad">
        <PanelHeader
          title="AI insights"
          subtitle={
            analysis && !isLoading
              ? `${providerName} · daily timeframe · ${formatRelativeTime(analysis.timestamp)}`
              : "Signals, risk and key levels"
          }
          action={
            analysis && !isLoading ? (
              <button onClick={onRefresh} className="btn btn-secondary h-8 px-2.5 text-xs" aria-label="Refresh analysis">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            ) : undefined
          }
        />
        {body}
      </div>

      {/* The gauge builds its charts on mount, so mount it once data is here */}
      {fearGreedData ? (
        <FearGreedGauge data={fearGreedData} history={fearGreedHistory} />
      ) : (
        <div className="h-80 skeleton" />
      )}
    </div>
  );
}
