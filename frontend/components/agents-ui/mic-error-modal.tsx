'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MicrophoneSlashIcon, ArrowClockwiseIcon, GearIcon, ShieldWarningIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface MicErrorModalProps {
  isOpen: boolean;
  onRetry: () => void;
  onClose?: () => void;
  lang?: 'en' | 'hi';
}

export function MicErrorModal({ isOpen, onRetry, onClose, lang = 'en' }: MicErrorModalProps) {
  if (!isOpen) return null;

  const isHi = lang === 'hi';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md p-6 bg-card border border-destructive/30 rounded-3xl shadow-2xl space-y-5 text-center"
        >
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-inner">
            <MicrophoneSlashIcon className="size-8" weight="bold" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
              {isHi ? 'माइक्रोफोन एक्सेस अस्वीकृत' : 'Microphone Access Denied'}
              <ShieldWarningIcon className="size-5 text-destructive" />
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isHi
                ? 'वॉइस ऑफ भारत को आपकी बात सुनने के लिए माइक्रोफोन एक्सेस की आवश्यकता है।'
                : 'Voice of Bharat requires access to your microphone so Anisha can hear your questions and assist you.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/50 border border-border/40 text-left space-y-2.5 text-xs text-foreground/90">
            <div className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <GearIcon className="size-3.5" />
              {isHi ? 'इसे कैसे सक्षम करें:' : 'How to enable microphone:'}
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground leading-relaxed">
              <li>
                {isHi
                  ? 'ब्राउज़र एड्रेस बार में लॉक (🔒) या ट्यून आइकन पर क्लिक करें।'
                  : 'Click the lock (🔒) or settings icon in your browser address bar.'}
              </li>
              <li>
                {isHi
                  ? 'माइक्रोफोन (Microphone) अनुमति को "Allow" (अनुमति दें) पर सेट करें।'
                  : 'Set Microphone permission to "Allow".'}
              </li>
              <li>
                {isHi
                  ? 'नीचे दिए गए "पुनः प्रयास करें" बटन पर क्लिक करें।'
                  : 'Click the "Retry Connection" button below.'}
              </li>
            </ol>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            {onClose && (
              <Button variant="outline" size="lg" onClick={onClose} className="w-full rounded-full text-xs font-semibold">
                {isHi ? 'बंद करें' : 'Dismiss'}
              </Button>
            )}
            <Button
              size="lg"
              onClick={onRetry}
              className="w-full rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md gap-2"
            >
              <ArrowClockwiseIcon className="size-4" weight="bold" />
              {isHi ? 'पुनः प्रयास करें' : 'Retry Connection'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
