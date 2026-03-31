interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <table className={`w-full border-collapse text-[13px] ${className}`}>
      {children}
    </table>
  );
}

export function TableHeader({ children, className = "" }: TableProps) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ children, className = "" }: TableProps) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className = "" }: TableProps) {
  return <tr className={className}>{children}</tr>;
}

interface TableCellProps extends TableProps {
  mono?: boolean;
}

export function Th({ children, className = "" }: TableProps) {
  return (
    <th
      className={`text-[11px] font-semibold uppercase tracking-[0.04em] text-ww-text-muted px-[14px] py-[10px] text-left border-b border-ww-border select-none ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, mono, className = "" }: TableCellProps) {
  return (
    <td
      className={`px-[14px] py-[10px] border-b border-ww-border align-middle ${mono ? "font-mono text-xs" : ""} ${className}`}
    >
      {children}
    </td>
  );
}
