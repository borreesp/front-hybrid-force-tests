import React from "react";
import { cn } from "../../lib/cn";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
};

export function Card({ title, subtitle, action, children, className, hoverable }: Props) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-[rgb(var(--border))] bg-[rgb(var(--surface),0.4)] p-5 shadow-sm transition",
        hoverable ? "hover:-translate-y-0.5 hover:shadow-md" : "",
        className
      )}
    >
      {(title || action || subtitle) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-1">
            {title ? <h3 className="text-base font-semibold text-[rgb(var(--text))]">{title}</h3> : null}
            {subtitle ? <p className="text-xs text-[rgb(var(--muted))]">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
