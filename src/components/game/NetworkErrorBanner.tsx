'use client';

import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

export default function NetworkErrorBanner({
  message = 'Your progress was not lost.',
  onRetry,
  onDismiss,
}: {
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-lg border border-[#E07A5F]/60 bg-[#120D0F] shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#E07A5F] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#F2EEE6] font-semibold">
              Quest Not Completed
            </h4>
            <p className="font-sans text-xs text-[#A6B2C0] font-light mt-0.5">
              {message}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[#6B7784] hover:text-[#EDE8DF] p-1 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {onRetry && (
        <div className="mt-3 pt-3 border-t border-[#2A1E22] flex justify-end">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#E07A5F]/20 border border-[#E07A5F]/50 text-xs font-mono text-[#F2EEE6] hover:bg-[#E07A5F]/30 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
}
