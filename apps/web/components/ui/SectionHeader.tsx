import React from "react";
import { cn } from "../../lib/cn";
import { Badge } from "./Badge";

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
};

export function SectionHeader({ title, subtitle, badge, action, className }: Props) {
  return (
    <div className={cn("mb-3 flex flex-wrap items-center gap-3", className)}>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-[rgb(var(--text))]">{title}</h2>
        {badge ? <Badge tone="muted">{badge}</Badge> : null}
      </div>
      {subtitle ? <p className="text-sm text-[rgb(var(--muted))]">{subtitle}</p> : null}
      <div className="ml-auto flex items-center gap-2">{action}</div>
    </div>
  );
}
