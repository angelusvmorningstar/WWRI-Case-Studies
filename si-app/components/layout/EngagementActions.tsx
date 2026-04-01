"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { archiveEngagementAction, unarchiveEngagementAction } from "@/actions/engagementActions";

export function EngagementActions({
  engagementId,
  accessKey,
  status,
}: {
  engagementId: string;
  accessKey: string;
  status: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/engagement/${accessKey}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleArchive = () => {
    startTransition(async () => {
      if (status === "active") {
        await archiveEngagementAction(engagementId);
      } else {
        await unarchiveEngagementAction(engagementId);
      }
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="ghost" onClick={handleCopyLink}>
        {copied ? "Copied!" : "Copy Link"}
      </Button>
      <Button size="sm" variant={status === "active" ? "ghost" : "primary"} onClick={handleArchive} disabled={isPending}>
        {isPending ? "..." : status === "active" ? "Archive" : "Unarchive"}
      </Button>
    </div>
  );
}
