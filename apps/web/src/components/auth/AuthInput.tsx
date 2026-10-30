import React, { forwardRef } from "react";

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, id, error, helperText, icon, required, className = "", ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex justify-between items-center">
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#77716e]"
          >
            {label}
            {required && <span className="text-[#f47b5b] ml-1">*</span>}
          </label>
        </div>

        <div className="relative rounded-xl">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#77716e]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={`w-full bg-white text-[#252525] placeholder:text-[#a09a97] text-sm font-normal rounded-xl border transition-all duration-200 outline-none ${
              icon ? "pl-10" : "pl-3.5"
            } pr-3.5 py-2.5 ${
              error
                ? "border-[#c74747] focus:border-[#c74747] focus:ring-2 focus:ring-[#c74747]/20"
                : "border-[#eadbd2] hover:border-[#dbc5b7] focus:border-[#f47b5b] focus:ring-2 focus:ring-[#f47b5b]/20"
            } ${className}`}
            {...props}
          />
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

AuthInput.displayName = "AuthInput";
