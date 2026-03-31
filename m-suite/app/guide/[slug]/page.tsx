import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { markdownToHtml } from "@/lib/markdown";
import Link from "next/link";
import fs from "fs";
import path from "path";

const STAGE_META: Record<string, string> = {
  m0: "M0 — Identifying Potential Leaders & Organisation Clients",
  m1: "M1 — 1st Formal Meeting: Exploring Dreams & Challenges",
  m2: "M2 — Options Development",
  m3: "M3 — The Pitch",
  m4: "M4 & M5 — Negotiation & Sign-off of Contract",
};

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!STAGE_META[slug]) notFound();

  const filePath = path.join(process.cwd(), `content/${slug}-guidance.md`);
  if (!fs.existsSync(filePath)) notFound();

  const md = fs.readFileSync(filePath, "utf-8");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-ww-teal no-underline hover:underline">
          &larr; Back to Pipeline
        </Link>
      </div>

      <h1 className="text-lg font-semibold text-ww-text mb-6">{STAGE_META[slug]}</h1>

      <Card>
        <div
          className="prose prose-sm max-w-none
            [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-ww-text [&_h1]:mb-4
            [&_h2]:text-md [&_h2]:font-semibold [&_h2]:text-ww-text [&_h2]:mt-6 [&_h2]:mb-3
            [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-ww-text [&_h3]:mt-4 [&_h3]:mb-2
            [&_p]:text-[13px] [&_p]:text-ww-text-secondary [&_p]:mb-3 [&_p]:leading-relaxed
            [&_ul]:text-[13px] [&_ul]:text-ww-text-secondary [&_ul]:mb-3 [&_ul]:pl-5
            [&_li]:mb-1
            [&_strong]:text-ww-text [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(md) }}
        />
      </Card>
    </div>
  );
}
