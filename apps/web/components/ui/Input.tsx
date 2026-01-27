import React from "react";
import { cn } from "../../lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; helper?: string; error?: string };

export const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { label, helper, error, className, ...props },
  ref
) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-[rgb(var(--text))]">
      {label ? <span className="text-xs font-semibold text-[rgb(var(--muted))]">{label}</span> : null}
      <input
        ref={ref}
        className={cn(
          "rounded-[var(--radius-md)] border bg-[rgb(var(--surface))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none transition",
          "placeholder:text-[rgb(var(--muted))] focus:ring-2 focus:ring-[rgba(var(--ring))]",
          error ? "border-[rgb(var(--danger))] focus:ring-red-300" : "border-[rgb(var(--border))]",
          className
        )}
        {...props}
      />
      {helper && !error ? <span className="text-xs text-[rgb(var(--muted))]">{helper}</span> : null}
      {error ? <span className="text-xs text-[rgb(var(--danger))]">{error}</span> : null}
    </label>
  );
});

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; helper?: string; error?: string };

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, helper, error, className, ...props },
  ref
) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-[rgb(var(--text))]">
      {label ? <span className="text-xs font-semibold text-[rgb(var(--muted))]">{label}</span> : null}
      <textarea
        ref={ref}
        className={cn(
          "rounded-[var(--radius-md)] border bg-[rgb(var(--surface))] px-3 py-2 text-sm text-[rgb(var(--text))] outline-none transition",
          "placeholder:text-[rgb(var(--muted))] focus:ring-2 focus:ring-[rgba(var(--ring))]",
          error ? "border-[rgb(var(--danger))] focus:ring-red-300" : "border-[rgb(var(--border))]",
          className
        )}
        {...props}
      />
      {helper && !error ? <span className="text-xs text-[rgb(var(--muted))]">{helper}</span> : null}
      {error ? <span className="text-xs text-[rgb(var(--danger))]">{error}</span> : null}
    </label>
  );
});
