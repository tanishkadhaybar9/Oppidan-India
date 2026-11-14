import React, { useEffect } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-rose-50 text-rose-600 border-rose-200",
          buttonBg: "bg-rose-600 hover:bg-rose-700 text-white",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 text-amber-600 border-amber-200",
          buttonBg: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      default:
        return {
          iconBg: "bg-[#fff0e8] text-[#f47b5b] border-[#eadbd2]",
          buttonBg: "bg-[#f47b5b] hover:bg-[#d95d3d] text-white",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white rounded-3xl border border-[#eadbd2] shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${styles.iconBg} flex-shrink-0`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="confirm-modal-title"
                className="text-base font-bold text-[#252525] leading-tight"
              >
                {title}
              </h3>
              <p className="text-xs text-[#77716e] mt-0.5">Please confirm your action</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded-lg text-[#77716e] hover:bg-[#fff0e8] hover:text-[#252525] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#77716e] leading-relaxed mb-6 bg-[#fffcfb] p-3 rounded-xl border border-[#eadbd2]/60">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#eadbd2] text-xs font-semibold text-[#77716e] hover:bg-[#fff7f2] hover:text-[#252525] transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50 ${styles.buttonBg}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

