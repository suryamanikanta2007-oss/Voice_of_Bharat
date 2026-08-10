'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowClockwiseIcon,
  GearIcon,
  MicrophoneSlashIcon,
  ShieldWarningIcon,
} from '@phosphor-icons/react';
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
      <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-card border-destructive/30 w-full max-w-md space-y-5 rounded-3xl border p-6 text-center shadow-2xl"
        >
          <div className="bg-destructive/10 text-destructive border-destructive/20 mx-auto flex size-14 items-center justify-center rounded-2xl border shadow-inner">
            <MicrophoneSlashIcon className="size-8" weight="bold" />
          </div>

          <div className="space-y-2">
            <h3 className="text-foreground flex items-center justify-center gap-2 text-lg font-bold tracking-tight">
              {isHi ? 'माइक्रोफोन एक्सेस अस्वीकृत' : 'Microphone Access Denied'}
              <ShieldWarningIcon className="text-destructive size-5" />
            </h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {isHi
                ? 'वॉइस ऑफ भारत को आपकी बात सुनने के लिए माइक्रोफोन एक्सेस की आवश्यकता है।'
                : 'Voice of Bharat requires access to your microphone so Anisha can hear your questions and assist you.'}
            </p>
          </div>

          <div className="bg-muted/50 border-border/40 text-foreground/90 space-y-2.5 rounded-2xl border p-4 text-left text-xs">
            <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
              <GearIcon className="size-3.5" />
              {isHi ? 'इसे कैसे सक्षम करें:' : 'How to enable microphone:'}
            </div>
            <ol className="text-muted-foreground list-inside list-decimal space-y-1.5 leading-relaxed">
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
              <Button
                variant="outline"
                size="lg"
                onClick={onClose}
                className="w-full rounded-full text-xs font-semibold"
              >
                {isHi ? 'बंद करें' : 'Dismiss'}
              </Button>
            )}
            <Button
              size="lg"
              onClick={onRetry}
              className="w-full gap-2 rounded-full bg-amber-600 text-xs font-semibold text-white shadow-md hover:bg-amber-700"
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
