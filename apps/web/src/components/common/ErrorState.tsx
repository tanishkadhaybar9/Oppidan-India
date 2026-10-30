import React, { useState, useEffect } from "react";
import { AlertCircle, RotateCcw, Clock } from "lucide-react";

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryAfter?: number;
  className?: string;
  title?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Failed to load data. Please try again.",
  onRetry,
  retryAfter,
  className = "",
  title = "Something went wrong",
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(retryAfter || 0);

  useEffect(() => {
    if (!retryAfter || retryAfter <= 0) return;
    setSecondsLeft(retryAfter);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryAfter]);

  const isRateLimit = message.toLowerCase().includes("too many requests") || (retryAfter !== undefined && retryAfter > 0);

  return (
    <div
      className={`bg-white border border-red-200 rounded-2xl p-6 sm:p-8 text-center shadow-xs flex flex-col items-center justify-center space-y-3.5 ${className}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
        isRateLimit ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-red-50 text-red-600 border border-red-200"
      }`}>
        {isRateLimit ? <Clock className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-bold text-[#252525]">
          {isRateLimit ? "Rate limit reached" : title}
        </h3>
        <p className="text-xs sm:text-sm text-[#77716e] leading-relaxed">
          {message}
        </p>
        {secondsLeft > 0 && (
          <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full inline-block mt-2">
            You can retry in {secondsLeft}s
          </p>
        )}
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={secondsLeft > 0}
          className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#eadbd2] text-[#252525] text-xs sm:text-sm font-semibold hover:border-[#f47b5b] hover:text-[#f47b5b] hover:bg-[#fff0e8] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
