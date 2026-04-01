type BadgeVariant = "teal" | "amber" | "green" | "red" | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  teal: "bg-ww-teal/10 text-ww-teal",
  amber: "bg-ww-amber/10 text-ww-amber",
  green: "bg-ww-green/10 text-ww-green",
  red: "bg-ww-red/10 text-ww-red",
  muted: "bg-ww-text-muted/10 text-ww-text-muted",
};

export function Badge({ variant = "muted", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-[10px] py-[2px] rounded text-[11px] font-semibold whitespace-nowrap ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
