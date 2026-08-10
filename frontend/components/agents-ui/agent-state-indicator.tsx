'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  MicrophoneIcon,
  PhoneCallIcon,
  PhoneDisconnectIcon,
  SparkleIcon,
  SpeakerHighIcon,
  SpinnerIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/shadcn/utils';

export type AgentDisplayState =
  'ready' | 'connecting' | 'listening' | 'speaking' | 'thinking' | 'disconnected';

interface AgentStateIndicatorProps {
  state: AgentDisplayState;
  className?: string;
  lang?: 'en' | 'hi';
}

export function AgentStateIndicator({ state, className, lang = 'en' }: AgentStateIndicatorProps) {
  const isHi = lang === 'hi';

  const getStateDetails = () => {
    switch (state) {
      case 'ready':
        return {
          title: isHi ? 'कॉल शुरू करने के लिए तैयार' : 'Ready to Connect',
          subtitle: isHi
            ? 'सहायक अनीशा से बात करने के लिए बटन दबाएं'
            : 'Click start to talk with Anisha',
          color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          dotColor: 'bg-emerald-500',
          icon: <PhoneCallIcon className="size-5 animate-pulse text-emerald-500" />,
        };
      case 'connecting':
        return {
          title: isHi ? 'अनीशा से जुड़ रहे हैं...' : 'Connecting to Anisha...',
          subtitle: isHi
            ? 'कृपया प्रतीक्षा करें, सुरक्षित कनेक्शन बनाया जा रहा है'
            : 'Please wait, connecting to secure helpline',
          color: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
          dotColor: 'bg-amber-500',
          icon: <SpinnerIcon className="size-5 animate-spin text-amber-500" />,
        };
      case 'listening':
        return {
          title: isHi ? 'आपकी बात सुन रहे हैं...' : 'Listening to you...',
          subtitle: isHi ? 'अपना प्रश्न या समस्या बोलें' : 'Speak clearly into your microphone',
          color: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
          dotColor: 'bg-blue-500 animate-ping',
          icon: <MicrophoneIcon className="size-5 animate-bounce text-blue-500" />,
        };
      case 'speaking':
        return {
          title: isHi ? 'अनीशा जवाब दे रही हैं...' : 'Anisha is speaking...',
          subtitle: isHi ? 'मर्फ़ फाल्कन टीटीएस वॉइस' : 'Murf Falcon TTS Active',
          color: 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400',
          dotColor: 'bg-purple-500 animate-pulse',
          icon: <SpeakerHighIcon className="size-5 animate-pulse text-purple-500" />,
        };
      case 'thinking':
        return {
          title: isHi ? 'अनीशा सोच रही हैं...' : 'Anisha is thinking...',
          subtitle: isHi ? 'जानकारी की समीक्षा की जा रही है' : 'Processing your question',
          color: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
          dotColor: 'bg-orange-500',
          icon: <SparkleIcon className="size-5 animate-spin text-orange-500" />,
        };
      case 'disconnected':
      default:
        return {
          title: isHi ? 'कॉल समाप्त हो गई' : 'Call Ended',
          subtitle: isHi
            ? 'नया सत्र शुरू करने के लिए स्टार्ट पर क्लिक करें'
            : 'Click below to start a new session',
          color: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
          dotColor: 'bg-rose-500',
          icon: <PhoneDisconnectIcon className="size-5 text-rose-500" />,
        };
    }
  };

  const details = getStateDetails();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state + lang}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className={cn(
          'flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 shadow-sm backdrop-blur-md transition-all',
          details.color,
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="bg-background/80 border-border/30 relative flex size-9 items-center justify-center rounded-xl border shadow-xs">
            {details.icon}
            <span
              className={cn('absolute -top-0.5 -right-0.5 size-2.5 rounded-full', details.dotColor)}
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-foreground text-sm leading-tight font-bold tracking-tight">
              {details.title}
            </span>
            <span className="font-sans text-[11px] font-medium opacity-80">{details.subtitle}</span>
          </div>
        </div>

        {/* Live Energy / Wave Bars for speaking & listening */}
        {(state === 'listening' || state === 'speaking') && (
          <div className="flex h-5 items-center gap-1 px-1">
            {[0.4, 0.9, 0.6, 1, 0.5].map((delay, idx) => (
              <motion.span
                key={idx}
                animate={{
                  height:
                    state === 'listening'
                      ? ['6px', '18px', '8px', '20px', '6px']
                      : ['10px', '22px', '6px', '18px', '10px'],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: delay * 0.15,
                  ease: 'easeInOut',
                }}
                className={cn(
                  'w-1 rounded-full',
                  state === 'listening' ? 'bg-blue-500' : 'bg-purple-500'
                )}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
