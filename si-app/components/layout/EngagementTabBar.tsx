"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { id: "setup", icon: "\u2699", label: "Setup", path: "" },
  { id: "interview", icon: "\uD83D\uDCCB", label: "Interview", path: "/interview" },
  { id: "results", icon: "\uD83D\uDCCA", label: "Results", path: "/results" },
  { id: "report", icon: "\uD83D\uDCC4", label: "Report", path: "/report" },
];

export function EngagementTabBar({
  accessKey,
  clientName,
}: {
  accessKey: string;
  clientName: string;
}) {
  const pathname = usePathname();
  const basePath = `/engagement/${accessKey}`;

  // Determine active tab
  const activeTab = TABS.find((t) => {
    if (t.id === "interview") return pathname.includes("/interview");
    if (t.id === "results") return pathname.includes("/results");
    if (t.id === "report") return pathname.includes("/report");
    if (t.id === "setup") return pathname === basePath || pathname === basePath + "/setup";
    return false;
  })?.id ?? "setup";

  return (
    <div className="border-b border-ww-border bg-ww-surface flex items-stretch sticky top-0 z-50 h-[52px]">
      {/* Engagement name / branding */}
      <Link
        href="/"
        className="no-underline px-6 border-r border-ww-border flex flex-col justify-center min-w-[160px] flex-shrink-0"
      >
        <div className="text-[10px] text-ww-teal tracking-[0.12em] uppercase font-bold">
          Whitewater
        </div>
        <div className="text-[13px] font-bold leading-tight mt-[1px] text-ww-text max-w-[160px] whitespace-nowrap overflow-hidden text-ellipsis">
          {clientName || "Untitled engagement"}
        </div>
      </Link>

      {/* Tab buttons */}
      <div className="flex">
        {TABS.map((tab) => {
          const href = tab.id === "setup" ? basePath : `${basePath}${tab.path}`;
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={href}
              className={`no-underline flex items-center gap-[6px] px-5 text-[13px] font-semibold border-b-[2.5px] transition-colors ${
                isActive
                  ? "text-ww-teal border-ww-teal"
                  : "text-ww-text-muted border-transparent hover:text-ww-text-secondary"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
