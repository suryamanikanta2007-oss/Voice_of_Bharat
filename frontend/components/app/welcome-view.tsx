'use client';

import React from 'react';
import {
  BankIcon,
  BuildingsIcon,
  ChatTeardropTextIcon,
  GlobeIcon,
  PhoneCallIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react';
import { EscalationDashboard } from '@/components/app/escalation-dashboard';
import { Button } from '@/components/ui/button';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  lang?: 'en' | 'hi';
  onLangToggle?: () => void;
}

export const WelcomeView = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & WelcomeViewProps
>(({ startButtonText, onStartCall, lang = 'en', onLangToggle, className, ...props }, ref) => {
  const isHi = lang === 'hi';

  const samplePrompts = isHi
    ? [
        'जन धन योजना क्या है?',
        'केवाईसी (KYC) के लिए कौन से दस्तावेज चाहिए?',
        'अगर कोई ओटीपी मांगे तो क्या करें?',
        'क्या यह फोन पर ऋण का वादा असली है?',
      ]
    : [
        'What is PM Jan Dhan Yojana?',
        'Which documents are needed for KYC?',
        'Is it safe to share an OTP or PIN?',
        'How do I spot a fake loan scam?',
      ];

  return (
    <div
      ref={ref}
      className="mx-auto flex min-h-[85vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-8 text-center"
      {...props}
    >
      {/* Track Badge */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-linear-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-700 shadow-xs dark:text-amber-300">
        <GlobeIcon className="size-4 animate-pulse text-amber-500" />
        <span>
          {isHi
            ? 'भारत की आवाज • वित्तीय सेवा हेल्पलाइन'
            : 'Voice of Bharat • Financial Services Helpline'}
        </span>
      </div>

      {/* Hero Title */}
      <h1 className="text-foreground max-w-2xl text-3xl leading-tight font-black tracking-tight sm:text-5xl">
        {isHi ? (
          <>
            सरकारी योजनाओं एवं बैंकिंग सलाह <br className="hidden sm:block" />
            <span className="bg-linear-to-r from-amber-500 via-orange-500 to-emerald-600 bg-clip-text text-transparent">
              के लिए निःशुल्क वॉइस हेल्पलाइन
            </span>
          </>
        ) : (
          <>
            Community Financial Helpline <br className="hidden sm:block" />
            <span className="bg-linear-to-r from-amber-500 via-orange-500 to-emerald-600 bg-clip-text text-transparent">
              Powered by AI & Murf Falcon
            </span>
          </>
        )}
      </h1>

      {/* Description */}
      <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-relaxed sm:text-base">
        {isHi
          ? 'अनीशा से तुरंत बात करें — सरकारी योजनाएं, बैंक खाता प्रक्रिया, केवाईसी और वित्तीय धोखाधड़ी से बचाव की सरल जानकारी प्राप्त करें।'
          : 'Talk live with Anisha for instant guidance on Indian government schemes, banking & KYC processes, and identifying financial fraud.'}
      </p>

      {/* Track Pillars */}
      <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
        <div className="bg-card border-border/50 flex items-center gap-2.5 rounded-2xl border p-3 shadow-2xs">
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
            <BuildingsIcon className="size-5" />
          </div>
          <div>
            <div className="text-foreground text-xs font-bold">
              {isHi ? 'सरकारी योजनाएं' : 'Government Schemes'}
            </div>
            <div className="text-muted-foreground text-[10px]">
              {isHi ? 'पीएम जनधन, सुरक्षा बीमा' : 'PM Schemes & Grants'}
            </div>
          </div>
        </div>

        <div className="bg-card border-border/50 flex items-center gap-2.5 rounded-2xl border p-3 shadow-2xs">
          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
            <BankIcon className="size-5" />
          </div>
          <div>
            <div className="text-foreground text-xs font-bold">
              {isHi ? 'बैंकिंग सहायता' : 'Banking & KYC'}
            </div>
            <div className="text-muted-foreground text-[10px]">
              {isHi ? 'खाता खोलना व दस्तावेज' : 'Account Opening & KYC'}
            </div>
          </div>
        </div>

        <div className="bg-card border-border/50 flex items-center gap-2.5 rounded-2xl border p-3 shadow-2xs">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div>
            <div className="text-foreground text-xs font-bold">
              {isHi ? 'स्कैम से बचाव' : 'Fraud Awareness'}
            </div>
            <div className="text-muted-foreground text-[10px]">
              {isHi ? 'ओटीपी व फ्रॉड चेतावनी' : 'OTP & Scam Detection'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Button (Ready state requirement) */}
      <div className="mt-8 flex w-full max-w-sm flex-col items-center gap-3">
        <Button
          size="lg"
          onClick={onStartCall}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-linear-to-r from-amber-500 via-orange-500 to-emerald-600 text-base font-bold text-white shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02] hover:from-amber-600 hover:to-emerald-700 active:scale-[0.98]"
        >
          <PhoneCallIcon className="size-6 animate-pulse" weight="bold" />
          <span>{startButtonText}</span>
        </Button>

        <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <ShieldCheckIcon className="size-4 text-emerald-500" />
          {isHi
            ? 'अनीशा कभी भी आपसे पिन, ओटीपी या पासवर्ड नहीं मांगेगी।'
            : 'Anisha will never ask for your PIN, OTP, or passwords.'}
        </span>
      </div>

      {/* Suggested Prompts */}
      <div className="mt-8 w-full max-w-lg">
        <div className="text-muted-foreground mb-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
          <ChatTeardropTextIcon className="size-3.5" />
          {isHi ? 'आप अनीशा से ये सवाल पूछ सकते हैं:' : 'Try asking questions like:'}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {samplePrompts.map((prompt, i) => (
            <span
              key={i}
              className="bg-secondary/80 hover:bg-secondary text-secondary-foreground border-border/40 cursor-default rounded-full border px-3 py-1.5 text-xs shadow-2xs transition-all"
            >
              &quot;{prompt}&quot;
            </span>
          ))}
        </div>
      </div>

      {/* Human Help Escalation Queue Dashboard (Day 7 Requirement) */}
      <EscalationDashboard />
    </div>
  );
});

WelcomeView.displayName = 'WelcomeView';
