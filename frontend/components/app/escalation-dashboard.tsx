'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  FileTextIcon,
  HeadsetIcon,
  PhoneCallIcon,
  ShieldWarningIcon,
} from '@phosphor-icons/react';

export interface EscalationRecord {
  id: string;
  user_id: string;
  caller_name: string;
  reason_category: string;
  issue_summary: string;
  agent_checks: string;
  urgency: string;
  caller_language: string;
  preferred_contact_method: string;
  status: string;
  created_at: string;
}

export function EscalationDashboard() {
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/escalations');
      const data = await res.json();
      if (data.escalations) {
        setEscalations(data.escalations);
      }
    } catch (err) {
      console.error('Failed to fetch escalations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
    const interval = setInterval(fetchEscalations, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card mt-8 w-full max-w-3xl rounded-2xl border border-amber-500/20 p-5 text-left shadow-lg">
      <div className="border-border/40 mb-4 flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
            <HeadsetIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-foreground flex items-center gap-2 text-base font-bold">
              Human Help Escalation Queue
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                {escalations.length} Open {escalations.length === 1 ? 'Ticket' : 'Tickets'}
              </span>
            </h2>
            <p className="text-muted-foreground text-xs">
              Requests forwarded from Voice of Bharat agent requiring specialist follow-up
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEscalations}
            disabled={loading}
            className="border-border/60 bg-secondary/50 text-secondary-foreground hover:bg-secondary flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all"
            title="Refresh queue"
          >
            <ArrowsClockwiseIcon className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-muted-foreground hover:text-foreground px-2 py-1 text-xs font-medium"
          >
            {isOpen ? 'Hide Queue' : 'Show Queue'}
          </button>
        </div>
      </div>

      {isOpen && (
        <>
          {escalations.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <CheckCircleIcon className="mx-auto mb-2 size-8 text-emerald-500/70" />
              <p className="text-sm font-medium">No open human help requests right now.</p>
              <p className="text-muted-foreground mt-1 text-xs">
                When a caller reports fraud or requests a complex policy override, ticket summaries
                will appear here after caller consent.
              </p>
            </div>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {escalations.map((ticket) => {
                const isFraud = ticket.reason_category.toLowerCase().includes('fraud');
                const isHigh = ticket.urgency.toLowerCase() === 'high';

                return (
                  <div
                    key={ticket.id}
                    className="border-border/60 bg-secondary/20 rounded-xl border p-4 transition-all hover:border-amber-500/40"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {ticket.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            isFraud
                              ? 'border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {isFraud ? (
                            <ShieldWarningIcon className="size-3.5" />
                          ) : (
                            <FileTextIcon className="size-3.5" />
                          )}
                          {isFraud ? 'Fraud Report' : 'Complex Waiver / Decision'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isHigh
                              ? 'bg-rose-500 text-white'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {ticket.urgency} Urgency
                        </span>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {ticket.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground font-semibold">Caller: </span>
                        <span className="text-foreground font-bold">{ticket.caller_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold">
                          Language & Contact:{' '}
                        </span>
                        <span className="text-foreground">
                          {ticket.caller_language} • {ticket.preferred_contact_method}
                        </span>
                      </div>
                    </div>

                    <div className="border-border/30 mt-2 space-y-1.5 border-t pt-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px] font-semibold">
                          Issue Summary:
                        </span>
                        <p className="text-foreground text-xs leading-relaxed">
                          {ticket.issue_summary}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px] font-semibold">
                          Agent Checks Performed:
                        </span>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          {ticket.agent_checks}
                        </p>
                      </div>
                    </div>

                    <div className="text-muted-foreground border-border/20 mt-2.5 flex items-center justify-between border-t pt-1.5 text-right text-[10px]">
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                        <PhoneCallIcon className="size-3" /> Explicit Caller Permission Granted
                      </span>
                      <span>Submitted: {new Date(ticket.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
