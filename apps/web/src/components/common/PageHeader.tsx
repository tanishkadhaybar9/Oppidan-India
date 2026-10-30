import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badges?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  breadcrumbs,
  actions,
  badges,
  className = "",
}) => {
  return (
    <div
      className={`bg-white border border-[#eadbd2] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#77716e] mb-1.5">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="w-3 h-3 text-[#eadbd2] flex-shrink-0" />}
                  {item.to && !isLast ? (
                    <Link
                      to={item.to}
                      className="hover:text-[#f47b5b] transition-colors truncate max-w-[150px]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className={`truncate max-w-[180px] ${isLast ? "text-[#252525] font-semibold" : ""}`}>
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-[#fff0e8] border border-[#eadbd2] text-[#f47b5b] flex items-center justify-center flex-shrink-0 shadow-xs">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#252525] tracking-tight flex items-center gap-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#77716e] mt-0.5 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {(actions || badges) && (
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start md:self-center">
          {badges}
          {actions}
        </div>
      )}
    </div>
  );
};
