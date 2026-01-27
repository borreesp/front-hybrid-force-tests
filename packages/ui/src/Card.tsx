import React from "react";
import { cn } from "@thrifty/utils";

type CardProps = {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  className,
  children
}) => {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface),0.55)] shadow-[var(--shadow-sm)] backdrop-blur-md",
        "p-5 md:p-6 text-[rgb(var(--text))] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
        className
      )}
    >
      {(title || subtitle || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-1">
            {title && <h3 className="text-lg font-semibold text-[rgb(var(--text))]">{title}</h3>}
            {subtitle && <p className="text-sm text-[rgb(var(--muted))]">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
