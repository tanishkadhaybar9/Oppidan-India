import React from "react";
import { Link } from "react-router-dom";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  link?: string;
  variant?: "default" | "highlight" | "success" | "warning" | "danger";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subtitle,
  trend,
  link,
  variant = "default",
  className = "",
}) => {
  const iconVariants = {
    default: "bg-[#fff0e8] text-[#f47b5b] border-[#eadbd2]",
    highlight: "bg-[#f47b5b] text-white border-transparent",
    success: "bg-emerald-50 text-emerald-600 border-emerald-200",
    warning: "bg-amber-50 text-amber-600 border-amber-200",
    danger: "bg-red-50 text-red-600 border-red-200",
  };

  const cardContent = (
    <div
      className={`bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs transition-all duration-200 ${
        link ? "hover:border-[#f47b5b]/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-medium text-[#77716e] uppercase tracking-wider block">
            {label}
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-[#252525] tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-[#77716e] mt-0.5">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 text-xs mt-1">
              <span
                className={`font-semibold ${
                  trend.isPositive ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-xs ${iconVariants[variant]}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  return link ? <Link to={link}>{cardContent}</Link> : cardContent;
};
