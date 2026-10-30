import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-[#eadbd2] rounded-2xl p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3.5 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#fff7f2] border border-[#eadbd2] flex items-center justify-center text-[#f47b5b] shadow-xs">
        {icon || <FolderOpen className="w-7 h-7 text-[#eadbd2]" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-[#252525]">{title}</h3>
        {description && (
          <p className="text-xs sm:text-sm text-[#77716e] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f47b5b] to-[#f9a489] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          {action.icon}
          {action.label}
        </button>
      )}
    </div>
  );
};
