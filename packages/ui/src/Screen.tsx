import React from "react";
import { cn } from "@thrifty/utils";

type ScreenProps = {
  children: React.ReactNode;
  className?: string;
  maxWidthClassName?: string;
};

export const Screen: React.FC<ScreenProps> = ({ children, className, maxWidthClassName }) => {
  const innerWidth = maxWidthClassName ?? "mx-auto w-[95vw] max-w-screen-2xl px-4 md:px-6";
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-surface via-surface-alt to-black text-slate-50",
        className
      )}
    >
      <div className={innerWidth}>{children}</div>
    </div>
  );
};
