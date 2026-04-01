"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { createEngagementAction } from "@/actions/engagementActions";

export default function NewEngagementPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setSubmitting(true);
    const accessKey = await createEngagementAction(clientName.trim());
    router.push(`/engagement/${accessKey}`);
  };

  return (
    <div className="px-4 py-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-sm text-ww-teal no-underline hover:underline">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold text-ww-text">New Engagement</h1>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <Input
              label="Client Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Apex Manufacturing"
              autoFocus
            />
            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={!clientName.trim() || submitting}>
                {submitting ? "Creating..." : "Create Engagement"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
