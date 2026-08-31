export const PLAYBOOK_COLORS: Record<string, string> = {
  "Crack the GD": "#ea580c",
  "Build your MBA profile": "#1c1917",
  "Master the PI": "#c2410c",
  "Consulting case framework": "#44403c",
  "Placement preparation": "#f97316",
  "Career switch": "#57534e",
  "SOP that converts": "#7c2d12",
  "WAT essay mastery": "#92400e",
  "GD Mastery Playbook": "#ea580c",
  "PI Crusher: 200 Real Questions": "#c2410c",
  "WAT & Essay Toolkit": "#92400e",
  "Case Competition Bible": "#44403c",
  "Consulting Casebook 2026": "#57534e",
  "Resume to Shortlist": "#1c1917",
};

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars) {
      if (line) lines.push(line.trim());
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}

export function generateBookCover(
  title: string,
  subtitle?: string,
  color?: string,
): string {
  const bg = color || PLAYBOOK_COLORS[title] || "#ea580c";
  const titleLines = wrap(title, 14).slice(0, 4);
  const subtitleLines = subtitle ? wrap(subtitle, 28).slice(0, 2) : [];

  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="60" y="${160 + i * 52}" fill="white" font-family="DM Sans, system-ui, sans-serif" font-size="48" font-weight="700">${escapeXml(line)}</text>`,
    )
    .join("");

  const subtitleSvg = subtitleLines
    .map(
      (line, i) =>
        `<text x="60" y="${180 + titleLines.length * 52 + i * 32}" fill="rgba(255,255,255,0.82)" font-family="DM Sans, system-ui, sans-serif" font-size="24" font-weight="500">${escapeXml(line)}</text>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect width="600" height="800" fill="${bg}" />
    <rect x="0" y="0" width="24" height="800" fill="rgba(255,255,255,0.12)" />
    <rect x="24" y="0" width="10" height="800" fill="rgba(0,0,0,0.08)" />
    <circle cx="480" cy="120" r="120" fill="rgba(255,255,255,0.06)" />
    <circle cx="120" cy="680" r="160" fill="rgba(0,0,0,0.08)" />
    <rect x="60" y="100" width="80" height="10" rx="5" fill="rgba(255,255,255,0.25)" />
    <rect x="156" y="100" width="40" height="10" rx="5" fill="rgba(255,255,255,0.15)" />
    ${titleSvg}
    ${subtitleSvg}
    <rect x="60" y="720" width="16" height="16" rx="8" fill="rgba(255,255,255,0.5)" />
    <rect x="92" y="724" width="160" height="8" rx="4" fill="rgba(255,255,255,0.2)" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
