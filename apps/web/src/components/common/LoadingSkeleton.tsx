import React from "react";

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="bg-white border border-[#eadbd2] rounded-2xl overflow-hidden shadow-xs animate-pulse">
      <div className="h-12 bg-[#fff7f2] border-b border-[#eadbd2]" />
      <div className="divide-y divide-[#eadbd2]/60">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-[#eadbd2]/50 rounded-md flex-1"
                style={{ maxWidth: cIdx === 0 ? "180px" : undefined }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#eadbd2] rounded-2xl p-5 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 bg-[#eadbd2]/60 rounded-md w-24" />
            <div className="w-10 h-10 bg-[#fff0e8] rounded-xl" />
          </div>
          <div className="h-7 bg-[#eadbd2]/70 rounded-md w-16" />
        </div>
      ))}
    </div>
  );
};
