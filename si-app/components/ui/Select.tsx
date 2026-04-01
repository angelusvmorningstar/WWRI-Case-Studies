import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className = "", id, children, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="ww-label block">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`px-3 py-2 border border-ww-border rounded-[6px] text-[13px] font-sans text-ww-text bg-ww-surface outline-none cursor-pointer focus:border-ww-teal ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);

Select.displayName = "Select";
