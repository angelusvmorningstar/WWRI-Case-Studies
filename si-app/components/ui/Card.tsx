import { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div className={`ww-card ${className}`} {...props}>
      {children}
    </div>
  );
}
