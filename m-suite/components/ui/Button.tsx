import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "ghost" | "danger";
type ButtonSize = "default" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-ww-teal text-white hover:bg-ww-teal-hover disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-ww-text-secondary border border-ww-border hover:bg-black/[0.04]",
  danger:
    "bg-ww-red text-white hover:bg-ww-red-hover",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "px-[18px] py-2 text-[13px]",
  sm: "px-3 py-[5px] text-xs",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-[6px] rounded-[6px] font-semibold font-sans cursor-pointer transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
