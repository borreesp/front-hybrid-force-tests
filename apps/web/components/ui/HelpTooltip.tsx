import React, { useEffect, useId, useRef, useState } from "react";
import { getHelpCopy } from "../../lib/helpText";

type HelpTooltipProps = {
  helpKey: string;
  className?: string;
  placement?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
};

/**
 * Discreto icono de ayuda con tooltip accesible (hover + focus).
 */
export const HelpTooltip: React.FC<HelpTooltipProps> = ({ helpKey, className = "", placement = "top", delayMs = 180 }) => {
  const [open, setOpen] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const id = useId();
  const copy = getHelpCopy(helpKey);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delayMs);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const posClasses =
    placement === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : placement === "bottom"
        ? "top-full left-1/2 -translate-x-1/2 mt-2"
        : placement === "left"
          ? "right-full top-1/2 -translate-y-1/2 mr-2"
          : "left-full top-1/2 -translate-y-1/2 ml-2";

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="group inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-500/60 bg-slate-800 text-[10px] font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
      >
        ?
        <span className="sr-only">{copy.title ?? "Ayuda"}</span>
      </button>
      {open && (
        <div
          id={id}
          role="tooltip"
          className={`absolute z-50 min-w-[200px] max-w-[320px] rounded-lg border border-slate-600/60 bg-slate-900/95 px-3 py-2 text-left shadow-xl ring-1 ring-black/30 ${posClasses}`}
        >
          {copy.title && <p className="mb-1 text-xs font-semibold text-cyan-200">{copy.title}</p>}
          <p className="text-xs leading-relaxed text-slate-100 whitespace-pre-line">{copy.body}</p>
        </div>
      )}
    </span>
  );
};

export const HelpLabel: React.FC<React.PropsWithChildren<{ helpKey: string; className?: string }>> = ({
  helpKey,
  className = "",
  children
}) => (
  <div className={`flex items-center gap-1 ${className}`}>
    <span>{children}</span>
    <HelpTooltip helpKey={helpKey} />
  </div>
);
