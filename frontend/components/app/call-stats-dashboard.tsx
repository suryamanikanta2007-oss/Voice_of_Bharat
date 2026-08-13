'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneCallIcon,
  PhoneDisconnectIcon,
  TrendUpIcon,
  WarningCircleIcon,
  XCircleIcon,
} from '@phosphor-icons/react';

export interface CallRecord {
  id: string;
  room_name: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  failure_reason: string | null;
}

export interface CallStats {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  recent_calls: CallRecord[];
}

export function CallStatsDashboard() {
  const [stats, setStats] = useState<CallStats>({
    total_calls: 0,
    successful_calls: 0,
    failed_calls: 0,
    recent_calls: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/call-stats');
      const data = await res.json();
      setStats({
        total_calls: data.total_calls ?? 0,
        successful_calls: data.successful_calls ?? 0,
        failed_calls: data.failed_calls ?? 0,
        recent_calls: data.recent_calls ?? [],
      });
    } catch (err) {
      console.error('Failed to fetch call stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const successRate =
    stats.total_calls > 0 ? ((stats.successful_calls / stats.total_calls) * 100).toFixed(1) : '0.0';

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="bg-card mt-6 w-full max-w-3xl rounded-2xl border border-emerald-500/20 p-5 text-left shadow-lg">
      {/* Header Bar */}
      <div className="border-border/40 mb-5 flex items-center justify-between border-b pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
            <PhoneCallIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-foreground flex items-center gap-2 text-base font-bold">
              Call Performance Dashboard
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Live Overview
              </span>
            </h2>
            <p className="text-muted-foreground text-xs">
              Real-time metrics and historical logs for Voice of Bharat sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="border-border/60 bg-secondary/50 text-secondary-foreground hover:bg-secondary flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all"
            title="Refresh statistics"
          >
            <ArrowsClockwiseIcon className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1 text-xs font-medium"
          >
            {isOpen ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* 3 Metric KPI Cards */}
      <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {/* Card 1: Total Calls */}
        <div className="border-border/50 bg-secondary/20 relative overflow-hidden rounded-xl border p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Total Calls
            </span>
            <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
              <PhoneCallIcon className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-foreground text-3xl font-black">{stats.total_calls}</span>
            <span className="text-muted-foreground text-xs font-medium">all sessions</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
            <TrendUpIcon className="size-3.5" />
            <span>Lifetime call volume</span>
          </div>
        </div>

        {/* Card 2: Successful Calls */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
              Successful Calls
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.successful_calls}
            </span>
            <span className="text-xs font-semibold text-emerald-700/80 dark:text-emerald-300/80">
              ({successRate}%)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircleIcon className="size-3.5" />
            <span>Connected & Completed</span>
          </div>
        </div>

        {/* Card 3: Failed Calls */}
        <div className="relative overflow-hidden rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-rose-700 uppercase dark:text-rose-300">
              Failed Calls
            </span>
            <div className="rounded-lg bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-400">
              <XCircleIcon className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {stats.failed_calls}
            </span>
            <span className="text-xs font-semibold text-rose-700/80 dark:text-rose-300/80">
              ({stats.total_calls > 0 ? (100 - parseFloat(successRate)).toFixed(1) : '0.0'}%)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            <WarningCircleIcon className="size-3.5" />
            <span>Dropped or Error</span>
          </div>
        </div>
      </div>

      {/* Call History Table / List */}
      {isOpen && (
        <div className="border-border/40 border-t pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">
              Recent Call Logs ({stats.recent_calls.length})
            </h3>
          </div>

          {stats.recent_calls.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center">
              <PhoneDisconnectIcon className="text-muted-foreground/60 mx-auto mb-2 size-7" />
              <p className="text-xs font-medium">No recorded calls yet.</p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Initiate a voice session above to see live status and duration metrics logged here.
              </p>
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {stats.recent_calls.map((call) => {
                const isSuccess =
                  call.status.toUpperCase() === 'SUCCESS' ||
                  call.status.toUpperCase() === 'COMPLETED';
                const isInProgress = call.status.toUpperCase() === 'IN_PROGRESS';

                return (
                  <div
                    key={call.id}
                    className="border-border/50 bg-secondary/15 hover:bg-secondary/30 flex items-center justify-between rounded-xl border p-3 text-xs transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isInProgress
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircleIcon className="size-4" />
                        ) : isInProgress ? (
                          <ArrowsClockwiseIcon className="size-4 animate-spin" />
                        ) : (
                          <XCircleIcon className="size-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-mono font-bold">{call.id}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : isInProgress
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {call.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-[11px]">
                          Room: <span className="font-mono">{call.room_name}</span>
                          {call.failure_reason && (
                            <span className="ml-2 text-rose-500">
                              • Error: {call.failure_reason}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-foreground flex items-center gap-1 text-[11px] font-medium">
                        <ClockIcon className="text-muted-foreground size-3.5" />
                        <span>{formatDuration(call.duration_seconds)}</span>
                      </div>
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(call.started_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
