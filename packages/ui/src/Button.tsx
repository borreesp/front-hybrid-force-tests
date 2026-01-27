import React from "react";
import { cn } from "@thrifty/utils";

type BaseProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

type AnchorButtonProps = BaseProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };
type NativeButtonProps = BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

type ButtonProps = AnchorButtonProps | NativeButtonProps;

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(var(--ring))] disabled:opacity-60 disabled:cursor-not-allowed";

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[rgb(var(--accent))] text-slate-900 shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
  secondary:
    "bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] border border-[rgb(var(--border))] hover:-translate-y-0.5 hover:border-white/20",
  ghost:
    "bg-transparent text-[rgb(var(--text))] border border-transparent hover:border-[rgb(var(--border))] hover:bg-white/5"
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base"
};

const isAnchorProps = (props: ButtonProps): props is AnchorButtonProps => typeof (props as AnchorButtonProps).href === "string";

export const Button: React.FC<ButtonProps> = (props) => {
  if (isAnchorProps(props)) {
    const { variant = "primary", size = "md", className, children, href, ...rest } = props;
    return (
      <a href={href} className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...rest}>
        {children}
      </a>
    );
  }

  const { variant = "primary", size = "md", className, children, ...rest } = props;
  return (
    <button className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...rest}>
      {children}
    </button>
  );
};
