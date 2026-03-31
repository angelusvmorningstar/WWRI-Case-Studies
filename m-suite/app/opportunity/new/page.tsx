import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createOpportunityAction } from "@/actions/opportunityActions";
import Link from "next/link";

export default function NewOpportunity() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-ww-teal no-underline hover:underline">
          &larr; Back to Opportunities
        </Link>
      </div>

      <h1 className="text-lg font-semibold text-ww-text mb-6">New Opportunity</h1>

      <Card>
        <form action={createOpportunityAction} className="flex flex-col gap-4">
          <Input
            id="clientName"
            name="clientName"
            label="Client Name"
            placeholder="e.g. Meridian Logistics"
            required
          />
          <Input
            id="prospect"
            name="prospect"
            label="Prospect Contact"
            placeholder="e.g. Sarah Chen, CEO"
          />
          <div>
            <label htmlFor="description" className="ww-label block">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Brief description of the opportunity..."
              rows={3}
              className="w-full px-3 py-2 border border-ww-border rounded-[6px] text-[13px] font-sans text-ww-text bg-ww-surface outline-none transition-colors focus:border-ww-teal focus:shadow-[0_0_0_2px_var(--color-ww-teal-ring)] placeholder:text-ww-text-muted resize-y"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Link href="/">
              <Button variant="ghost" type="button">Cancel</Button>
            </Link>
            <Button type="submit">Create Opportunity</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
