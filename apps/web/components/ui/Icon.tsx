import React from "react";

type IconName = "info" | "edit" | "chevron-right" | "alert";

const paths: Record<IconName, JSX.Element> = {
  info: (
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      d="M12 8v8m0 0h-2m2 0h2m-2-12h.01M21 12c0 4.971-4.029 9-9 9s-9-4.029-9-9 4.029-9 9-9 9 4.029 9 9Z"
    />
  ),
  edit: (
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      d="M4 17.5 6.5 20l9.75-9.75a2.121 2.121 0 0 0 0-3l-.5-.5a2.121 2.121 0 0 0-3 0L3 16.5V20h3l11-11"
    />
  ),
  "chevron-right": (
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="m9 18 6-6-6-6" />
  ),
  alert: (
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      d="M12 9v4m0 4h.01M10.29 3.86 2.82 16.5A2 2 0 0 0 4.54 19h14.92a2 2 0 0 0 1.72-3l-7.47-12.64a2 2 0 0 0-3.42 0Z"
    />
  )
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
