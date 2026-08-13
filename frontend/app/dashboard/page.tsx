import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { CallStatsDashboard } from '@/components/app/call-stats-dashboard';

export const metadata = {
  title: 'Call Performance Dashboard | Voice of Bharat',
  description: 'Track total calls, successful calls, failed calls, and recent call logs.',
};

export default function DashboardPage() {
  return (
    <main className="bg-background min-h-screen w-full p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground border-border/40 bg-card flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-xs transition-all"
          >
            <ArrowLeftIcon className="size-4" />
            <span>Back to Voice Helpline</span>
          </Link>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Voice of Bharat • Call Metrics
          </span>
        </div>

        {/* Dashboard Title Banner */}
        <div className="space-y-1 text-left">
          <h1 className="text-foreground text-2xl font-black tracking-tight sm:text-3xl">
            Call Operations & Analytics
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Live overview of all calls taken by Anisha AI, session durations, success rates, and
            diagnostic logs.
          </p>
        </div>

        {/* Full Call Stats Dashboard Component */}
        <div className="w-full">
          <CallStatsDashboard />
        </div>
      </div>
    </main>
  );
}
