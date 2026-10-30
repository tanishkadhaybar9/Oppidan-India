import React from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface AuthAlertProps {
  type?: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
}

export const AuthAlert: React.FC<AuthAlertProps> = ({
  type = "error",
  message,
  onClose,
}) => {
  if (!message) return null;

  const isError = type === "error";
  const isSuccess = type === "success";

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-xl text-sm transition-all duration-200 border ${
        isError
          ? "bg-[#fff2f2] border-[#f8c9c9] text-[#c74747]"
          : isSuccess
          ? "bg-[#edf8f3] border-[#b9e5d1] text-[#23855b]"
          : "bg-[#fff7f2] border-[#eadbd2] text-[#77716e]"
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {isError && <AlertCircle className="w-4 h-4 text-[#c74747]" />}
        {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#23855b]" />}
      </div>
      <div className="flex-1 font-medium leading-relaxed">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity p-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
