import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl" | "max-w-full";
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = "",
  maxWidth = "max-w-7xl",
}) => {
  return (
    <div className={`w-full ${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 ${className}`}>
      {children}
    </div>
  );
};
