import React, { useState, forwardRef } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  helperText?: string;
  autoComplete?: "current-password" | "new-password";
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, id, error, helperText, required, autoComplete = "current-password", className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `password-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className="w-full space-y-1.5 text-left">
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-[#77716e]"
        >
          {label}
          {required && <span className="text-[#f47b5b] ml-1">*</span>}
        </label>

        <div className="relative rounded-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#77716e]">
            <Lock className="w-4 h-4" />
          </div>

          <input
            ref={ref}
            id={inputId}
            type={showPassword ? "text" : "password"}
            autoComplete={autoComplete}
            required={required}
            className={`w-full bg-white text-[#252525] placeholder:text-[#a09a97] text-sm font-normal rounded-xl border transition-all duration-200 outline-none pl-10 pr-10 py-2.5 ${
              error
                ? "border-[#c74747] focus:border-[#c74747] focus:ring-2 focus:ring-[#c74747]/20"
                : "border-[#eadbd2] hover:border-[#dbc5b7] focus:border-[#f47b5b] focus:ring-2 focus:ring-[#f47b5b]/20"
            } ${className}`}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#77716e] hover:text-[#252525] transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error ? (
          <p className="text-xs text-[#c74747] font-medium pt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#77716e]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
