// Simple markdown to HTML converter for SOP guidance content
// No external dependency needed — handles the subset we use (headings, lists, bold, paragraphs)

export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3>${inline(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2>${inline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h1>${inline(trimmed.slice(2))}</h1>`);
      continue;
    }

    // List items
    if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(trimmed.slice(2))}</li>`);
      continue;
    }

    // Numbered list items
    if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(trimmed.replace(/^\d+\.\s/, ""))}</li>`);
      continue;
    }

    // Paragraphs
    if (inList) { html.push("</ul>"); inList = false; }
    html.push(`<p>${inline(trimmed)}</p>`);
  }

  if (inList) html.push("</ul>");
  return html.join("\n");
}

function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}
