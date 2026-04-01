import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = "", id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="ww-label block">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-3 py-2 border border-ww-border rounded-[6px] text-[13px] font-sans text-ww-text bg-ww-surface outline-none transition-colors focus:border-ww-teal focus:shadow-[0_0_0_2px_var(--color-ww-teal-ring)] placeholder:text-ww-text-muted ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
