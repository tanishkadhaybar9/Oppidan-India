import React from "react";
import { Check, Circle } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const criteria = [
    {
      label: "At least 8 characters",
      valid: password.length >= 8,
    },
    {
      label: "Uppercase & lowercase letters",
      valid: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      label: "At least one number (0-9)",
      valid: /\d/.test(password),
    },
    {
      label: "Special character (!@#$%...)",
      valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    },
  ];

  const score = criteria.filter((c) => c.valid).length;

  const strengthConfig = [
    { label: "Too short", color: "bg-[#eadbd2]", textColor: "text-[#77716e]" },
    { label: "Weak", color: "bg-[#c74747]", textColor: "text-[#c74747]" },
    { label: "Fair", color: "bg-[#e99c3a]", textColor: "text-[#e99c3a]" },
    { label: "Good", color: "bg-[#439675]", textColor: "text-[#439675]" },
    { label: "Strong", color: "bg-[#23855b]", textColor: "text-[#23855b]" },
  ];

  const currentConfig = strengthConfig[score] || strengthConfig[0];

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2.5 pt-1 text-left">
      {/* Progress Bars */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#77716e] font-medium">Password strength</span>
          <span className={`font-semibold ${currentConfig?.textColor}`}>
            {currentConfig?.label}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1.5">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={`h-full rounded-full transition-all duration-300 ${
                index <= score ? currentConfig?.color : "bg-[#eadbd2]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Requirement Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#77716e] pt-1">
        {criteria.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            {item.valid ? (
              <Check className="w-3.5 h-3.5 text-[#23855b] shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-[#a09a97] shrink-0" />
            )}
            <span className={item.valid ? "text-[#252525] font-medium" : "text-[#77716e]"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
