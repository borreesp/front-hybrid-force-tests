import React from "react";
import { cn } from "@thrifty/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  className,
  ...props
}) => {
  return (
    <label className="block space-y-2">
      {label && <span className="text-sm text-slate-200">{label}</span>}
      <input
        className={cn(
          "w-full rounded-lg border border-white/10 bg-surface-alt/80 px-3 py-2 text-slate-50 placeholder:text-slate-400",
          "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40",
          className
        )}
        {...props}
      />
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </label>
  );
};
