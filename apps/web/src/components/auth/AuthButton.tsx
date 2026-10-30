import React from "react";
import { Loader2 } from "lucide-react";

export interface AuthButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  isLoading = false,
  children,
  disabled,
  className = "",
  type = "submit",
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`w-full relative flex items-center justify-center py-2.5 px-4 text-sm font-semibold rounded-xl text-white bg-[#f47b5b] hover:bg-[#e96849] focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/50 shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
