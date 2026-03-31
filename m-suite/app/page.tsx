import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-ww-text">My Opportunities</h1>
        <Button>New Opportunity</Button>
      </div>

      <Card>
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-ww-text-secondary mb-2">
            No opportunities yet.
          </p>
          <p className="text-sm text-ww-text-muted mb-6">
            Create your first opportunity to start the M+ Process.
          </p>
          <Button>New Opportunity</Button>
        </div>
      </Card>

      <div className="mt-8 flex gap-2">
        <Badge variant="teal">Active</Badge>
        <Badge variant="green">Approved</Badge>
        <Badge variant="amber">Changes Requested</Badge>
        <Badge variant="red">Stopped</Badge>
        <Badge variant="muted">Draft</Badge>
      </div>
    </div>
  );
}
