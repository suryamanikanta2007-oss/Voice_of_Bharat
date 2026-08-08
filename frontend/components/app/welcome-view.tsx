'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PhoneCallIcon, ShieldCheckIcon, BankIcon, BuildingsIcon, ChatTeardropTextIcon, GlobeIcon } from '@phosphor-icons/react';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  lang?: 'en' | 'hi';
  onLangToggle?: () => void;
}

export const WelcomeView = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'> & WelcomeViewProps>(
  ({ startButtonText, onStartCall, lang = 'en', onLangToggle, className, ...props }, ref) => {
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
      <div ref={ref} className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[85vh] text-center" {...props}>
        {/* Track Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-linear-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-6 shadow-xs">
          <GlobeIcon className="size-4 animate-pulse text-amber-500" />
          <span>{isHi ? 'भारत की आवाज • वित्तीय सेवा हेल्पलाइन' : 'Voice of Bharat • Financial Services Helpline'}</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground max-w-2xl leading-tight">
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
        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
          {isHi
            ? 'अनीशा से तुरंत बात करें — सरकारी योजनाएं, बैंक खाता प्रक्रिया, केवाईसी और वित्तीय धोखाधड़ी से बचाव की सरल जानकारी प्राप्त करें।'
            : 'Talk live with Anisha for instant guidance on Indian government schemes, banking & KYC processes, and identifying financial fraud.'}
        </p>

        {/* Track Pillars */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left">
          <div className="p-3 rounded-2xl bg-card border border-border/50 shadow-2xs flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BuildingsIcon className="size-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-foreground">{isHi ? 'सरकारी योजनाएं' : 'Government Schemes'}</div>
              <div className="text-[10px] text-muted-foreground">{isHi ? 'पीएम जनधन, सुरक्षा बीमा' : 'PM Schemes & Grants'}</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-card border border-border/50 shadow-2xs flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BankIcon className="size-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-foreground">{isHi ? 'बैंकिंग सहायता' : 'Banking & KYC'}</div>
              <div className="text-[10px] text-muted-foreground">{isHi ? 'खाता खोलना व दस्तावेज' : 'Account Opening & KYC'}</div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-card border border-border/50 shadow-2xs flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheckIcon className="size-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-foreground">{isHi ? 'स्कैम से बचाव' : 'Fraud Awareness'}</div>
              <div className="text-[10px] text-muted-foreground">{isHi ? 'ओटीपी व फ्रॉड चेतावनी' : 'OTP & Scam Detection'}</div>
            </div>
          </div>
        </div>

        {/* Main Action Button (Ready state requirement) */}
        <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-sm">
          <Button
            size="lg"
            onClick={onStartCall}
            className="w-full h-14 rounded-full bg-linear-to-r from-amber-500 via-orange-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold text-base shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <PhoneCallIcon className="size-6 animate-pulse" weight="bold" />
            <span>{startButtonText}</span>
          </Button>

          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ShieldCheckIcon className="size-4 text-emerald-500" />
            {isHi ? 'अनीशा कभी भी आपसे पिन, ओटीपी या पासवर्ड नहीं मांगेगी।' : 'Anisha will never ask for your PIN, OTP, or passwords.'}
          </span>
        </div>

        {/* Suggested Prompts */}
        <div className="mt-8 w-full max-w-lg">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
            <ChatTeardropTextIcon className="size-3.5" />
            {isHi ? 'आप अनीशा से ये सवाल पूछ सकते हैं:' : 'Try asking questions like:'}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {samplePrompts.map((prompt, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full bg-secondary/80 hover:bg-secondary text-secondary-foreground text-xs border border-border/40 cursor-default transition-all shadow-2xs"
              >
                "{prompt}"
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

WelcomeView.displayName = 'WelcomeView';
