import { Buffer } from "node:buffer";
import {
  emptyParsedResume,
  type ParseResult,
  type ResumeParserProvider,
  type ParsedResume,
} from "../resume-parser";
import { textExtractor } from "./text-extractor";

function cleanLine(line: string): string {
  return line.trim().replace(/\s+/g, " ");
}

function expandMarkdownLinks(text: string): string {
  // PDF hyperlinks are embedded as [label](url). Expand http/https links to "label url" so URL regexes can match.
  // Drop mailto: links entirely to avoid extracting their domains as portfolio URLs.
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1 $2")
    .replace(/\[([^\]]+)\]\(mailto:[^\s)]+\)/g, "$1");
}

function extractEmail(text: string): string | undefined {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : undefined;
}

function extractPhone(text: string): string | undefined {
  const m = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  return m ? m[0] : undefined;
}

function normalizeUrl(url: string): string {
  if (!url) return "";
  if (/^www\./i.test(url)) return `https://${url}`;
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

function extractAllUrls(text: string): string[] {
  const urls: string[] = [];
  const re = /(?:https?:\/\/|www\.)[^]<>"'`\s]+/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    urls.push(normalizeUrl(m[0]));
  }
  return urls;
}

function extractLinkedIn(text: string): string | undefined {
  const direct = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[a-zA-Z0-9_-]+\/?/i);
  if (direct) return normalizeUrl(direct[0]);
  // Fallback: if the text contains an explicit @linkedin marker, scan nearby URLs for a LinkedIn URL.
  if (/\b@?linkedin\b/i.test(text)) {
    const nearby = text.slice(Math.max(0, text.search(/\b@?linkedin\b/i) - 400), text.search(/\b@?linkedin\b/i) + 400);
    const url = extractAllUrls(nearby).find((u) => /linkedin\.com/i.test(u));
    if (url) return url;
  }
  return undefined;
}

function extractGitHub(text: string): string | undefined {
  const direct = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/?/i);
  if (direct) return normalizeUrl(direct[0]);
  if (/\b@?github\b/i.test(text)) {
    const nearby = text.slice(Math.max(0, text.search(/\b@?github\b/i) - 400), text.search(/\b@?github\b/i) + 400);
    const url = extractAllUrls(nearby).find((u) => /github\.com/i.test(u));
    if (url) return url;
  }
  return undefined;
}

function extractPortfolio(text: string): string | undefined {
  // Portfolio / personal website links almost always live in the contact header at the very top.
  // Only look in the first 600 characters and ignore obvious non-portfolio URLs.
  const header = text.slice(0, 600);
  // Require an explicit http(s):// or www. prefix so we don't match domains inside email addresses.
  const m = header.match(/(?:https?:\/\/[^\s)]+|www\.[^\s)]+)/g);
  if (!m) return undefined;
  const skip = /linkedin|github|mailto|doi\.org|springer|arxiv|pubmed|researchgate|academia|twitter|x\.com|facebook|instagram|youtube|tiktok/;
  for (const url of m) {
    const lower = url.toLowerCase();
    if (skip.test(lower)) continue;
    return url.startsWith("http") ? url : `https://${url}`;
  }
  return undefined;
}

function isSectionHeader(line: string): boolean {
  return /^(?:experience|work experience|education|skills|technical skills|core competencies|expertise|certifications|licenses|accreditations|courses and certifications|achievements|awards|honors|accomplishments|publications|patents|projects|personal projects|languages|language|extra-curricular|extra-curricular activities|summary|about|professional summary|profile)$/i.test(line.trim());
}

function looksLikeName(line: string): boolean {
  // 1-3 capitalized words, no digits, no @, no section headers, no obvious job-title keywords.
  if (line.length < 3 || line.length > 50) return false;
  if (isSectionHeader(line)) return false;
  if (/\d/.test(line) || /[@#:]|\b(?:Engineer|Developer|Manager|Designer|Consultant|Architect|Analyst|Intern|Lead|Skills|Technical|Experience|Education|Projects|Certifications|Publications|Achievements|Languages)\b/i.test(line)) {
    return false;
  }
  // Allow single-letter last names/initials (e.g. "Kavikkannan K").
  return /^[A-Z](?:[a-zA-Z]+|[a-zA-Z]*\.?)(?:\s+[A-Z](?:[a-zA-Z]+|[a-zA-Z]*\.?)){0,2}$/.test(line);
}

function extractName(text: string): string | undefined {
  const lines = text.split(/\n/).map(cleanLine).filter(Boolean);
  // Prefer the very first line if it looks like a name.
  if (lines[0] && looksLikeName(lines[0])) {
    return lines[0];
  }
  for (const line of lines.slice(0, 20)) {
    if (looksLikeName(line)) return line;
  }
  return undefined;
}

function extractHeadline(text: string, name?: string): string | undefined {
  const patterns = [
    /(?:headline|title|professional title)\s*:?\s*(.+)/i,
    /^(?:Senior|Lead|Principal|Staff|Junior|Associate)?\s*[A-Za-z\s]+(?:Engineer|Manager|Designer|Developer|Architect|Consultant|Director|VP|Head)(?:\s+at\s+\w+)?$/im,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) return cleanLine(m[1]);
  }
  // Fallback: the line immediately after the name often is the current title/headline.
  const lines = text.split(/\n/).map(cleanLine).filter(Boolean);
  const nameIndex = name ? lines.findIndex((l) => l === name) : -1;
  if (nameIndex >= 0 && lines[nameIndex + 1]) {
    const candidate = lines[nameIndex + 1];
    // Avoid treating a contact line or section header as the headline.
    if (
      candidate.length > 3 &&
      candidate.length < 80 &&
      !isSectionHeader(candidate) &&
      !/@/.test(candidate) &&
      !candidate.includes("|") &&
      !/\b(?:Salem|India|USA|UK|Germany|Canada|Australia|Tamilnadu)\b/i.test(candidate)
    ) {
      return candidate;
    }
  }
  return undefined;
}

function extractCurrentRoleAndCompany(text: string, name?: string): { role?: string; company?: string } {
  const headline = extractHeadline(text, name);
  if (!headline) return {};
  const parts = headline.split(/\s+at\s+/i);
  if (parts.length === 2) {
    return { role: parts[0].trim(), company: parts[1].trim() };
  }
  return { role: headline };
}

function extractSummary(text: string): string | undefined {
  const section = splitSections(text)["summary"];
  if (section) {
    const lines = section.split(/\n/).map(cleanLine).filter(Boolean);
    const combined = lines.slice(0, 3).join(" ");
    if (combined.length > 20) return combined;
  }
  return undefined;
}

function isPageMarker(line: string): boolean {
  return /^--?\s*\d+\s+of\s+\d+\s*--?$/.test(line) || /^\d+\s+\/\s+\d+$/.test(line);
}

function splitSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const known: [string, RegExp][] = [
    ["summary", /^(?:summary|about|professional summary|profile)$/im],
    ["experience", /^(?:experience|work experience|employment|professional experience|career)$/im],
    ["education", /^(?:education|academic|qualifications|degrees)$/im],
    ["skills", /^(?:skills|technical skills|core competencies|expertise)$/im],
    ["projects", /^(?:projects|personal projects|key projects)$/im],
    ["certifications", /^(?:certifications|licenses|accreditations|courses and certifications)$/im],
    ["achievements", /^(?:achievements|awards|honors|accomplishments|extra-curricular activities|publications and patents|language|languages)$/im],
  ];

  const lines = text.split(/\n/);
  let current: string | null = null;
  const buffers: Record<string, string[]> = {};

  for (const raw of lines) {
    const line = cleanLine(raw);
    if (!line || isPageMarker(line)) {
      if (current && !isPageMarker(line)) buffers[current].push("");
      continue;
    }
    let matched = false;
    for (const [key, regex] of known) {
      if (regex.test(line) && line.length < 60) {
        current = key;
        if (!buffers[current]) buffers[current] = [];
        matched = true;
        break;
      }
    }
    if (!matched && current) {
      buffers[current].push(line);
    }
  }

  for (const key of Object.keys(buffers)) {
    sections[key] = buffers[key].join("\n").trim();
  }
  return sections;
}

function isNewRoleLine(line: string): boolean {
  const hasTitle = /\b(?:Intern|Engineer|Developer|Manager|Lead|Consultant|Analyst|Designer|Architect|Director|Head|VP|Founder|Researcher|Scientist|Specialist|Associate|Coordinator|Fellow|Trainee)\b/i.test(line);
  const hasDate = /(\d{4}|\b(?:present|current|ongoing)\b)/i.test(line);
  const hasSeparator = /[|@]/.test(line);
  // A role header has a title keyword plus a separator/date, OR a separator plus a date
  // (e.g. "Research Experience | VIT Vellore Ongoing").
  return (hasTitle && (hasDate || hasSeparator)) || (hasSeparator && hasDate);
}

// Common date patterns found at the end of an experience header line.
const DATE_SUFFIX_RE = /^(.*?)\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–]\s*(?:present|current|ongoing|\d{4})|\d{4}\s*[-–]\s*(?:present|current|ongoing|\d{4})|\d{4})$/i;

function splitCompanyAndDate(part: string): { company: string; date: string } {
  const m = part.match(DATE_SUFFIX_RE);
  if (m) {
    return { company: m[1].trim(), date: m[2].trim() };
  }
  // Some resumes use only "Ongoing", "Present", or "Current" as a date marker.
  const ongoing = part.match(/^(.*)\s+(Ongoing|Present|Current)$/i);
  if (ongoing) {
    return { company: ongoing[1].trim(), date: ongoing[2].trim() };
  }
  return { company: part.trim(), date: "" };
}

function parseExperience(section: string): ParsedResume["experience"] {
  const entries: ParsedResume["experience"] = [];
  const allLines = section.split(/\n/).map(cleanLine).filter(Boolean).filter((l) => !isSectionHeader(l));

  // Split the flat section into entry chunks by detecting role-header lines.
  const chunks: string[][] = [];
  let current: string[] = [];
  for (const line of allLines) {
    if (isNewRoleLine(line) && current.length > 0) {
      chunks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) chunks.push(current);

  for (const lines of chunks) {
    if (lines.length === 0) continue;
    const first = lines[0];
    // Split by | or @ only; hyphens may belong to dates or role names like "Full-Stack".
    const parts = first.split(/\s*[|@]\s*/);
    let role: string | undefined;
    let company: string | undefined;
    let datePart = "";

    if (parts.length >= 2) {
      role = parts[0].trim();
      const last = parts[parts.length - 1].trim();
      const { company: lastCompany, date: lastDate } = splitCompanyAndDate(last);
      if (lastDate) {
        datePart = lastDate;
        company = parts.slice(1, -1).join(" | ").trim() || lastCompany;
      } else {
        company = parts.slice(1).join(" | ").trim() || lastCompany;
      }
    } else {
      const { company: firstCompany, date: firstDate } = splitCompanyAndDate(first.trim());
      company = firstCompany;
      datePart = firstDate;
    }

    const dateMatch = (datePart || lines.join("\n")).match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|present|current|ongoing)/i);
    const ongoingOnly = /^\s*(present|current|ongoing)\s*$/i.test(datePart);
    const startDate = dateMatch ? dateMatch[1] : undefined;
    const endRaw = dateMatch ? dateMatch[2].toLowerCase() : ongoingOnly ? datePart.toLowerCase() : undefined;
    const isCurrent = endRaw ? /present|current|now|ongoing/.test(endRaw) : false;
    const endDate = isCurrent ? undefined : endRaw;

    const descLines = lines.slice(1).filter((l) => l.length > 20 || l.startsWith("•") || l.startsWith("–") || l.startsWith("-"));
    const description = descLines.length ? descLines.join("\n") : undefined;

    entries.push({
      company: company || role || "",
      role,
      startDate,
      endDate,
      isCurrent,
      description,
    });
  }
  return entries.filter((e) => e.company || e.role);
}

function parseEducation(section: string): ParsedResume["education"] {
  const entries: ParsedResume["education"] = [];
  // Stop parsing when we hit another section header within the buffer.
  const blocks = section.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split(/\n/).map(cleanLine).filter(Boolean).filter((l) => !isSectionHeader(l));
    if (lines.length === 0) continue;
    const first = lines[0];
    // Stop at obvious non-education headers that the section splitter missed.
    if (/^(?:publications|patents|projects|courses|certifications|achievements|extra-curricular|languages)$/i.test(first)) break;
    const parts = first.split(/\s*[-|,]\s*/);
    const institution = parts[0];
    const degree = parts.length > 1 ? parts[1] : undefined;
    const fieldOfStudy = parts.length > 2 ? parts.slice(2).join(", ") : undefined;

    const dateMatch = block.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current|ongoing)/i);
    const startDate = dateMatch ? dateMatch[1] : undefined;
    const endDate = dateMatch ? dateMatch[2] : undefined;

    entries.push({
      institution,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
    });
  }
  return entries.filter((e) => e.institution);
}

function parseSkills(section: string): string[] {
  const items: string[] = [];
  const lines = section.split(/\n/).map(cleanLine).filter(Boolean).filter((l) => !isSectionHeader(l));

  for (const raw of lines) {
    // Strip leading bullet/category label, e.g. "• Languages:" or "- ML-related Libraries:".
    const line = raw
      .replace(/^[-•*]\s*/, "")
      .replace(/^[A-Za-z\s-]+:\s*/, "")
      .trim();
    if (!line) continue;
    // If the cleaned line still has commas, split it into individual skills.
    const parts = line.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.length > 1 && part.length < 40 && !/^[A-Za-z\s]+:$/.test(part)) {
        items.push(part);
      }
    }
  }

  return items.length >= 1 ? items.slice(0, 40) : [];
}

function parseText(rawText: string): ParseResult {
  const parsed = emptyParsedResume();
  const confidence: Record<string, number> = {};

  // PDF hyperlinks are embedded as markdown links [label](url); expand them for URL detection.
  const searchableText = expandMarkdownLinks(rawText);

  const email = extractEmail(searchableText);
  if (email) {
    parsed.identity.email = email;
    confidence["identity.email"] = 0.95;
  }

  const phone = extractPhone(searchableText);
  if (phone) {
    parsed.identity.phone = phone;
    confidence["identity.phone"] = 0.85;
  }

  const linkedin = extractLinkedIn(searchableText);
  if (linkedin) {
    parsed.links.linkedin = linkedin;
    confidence["links.linkedin"] = 0.95;
  }

  const github = extractGitHub(searchableText);
  if (github) {
    parsed.links.github = github;
    confidence["links.github"] = 0.95;
  }

  const portfolio = extractPortfolio(searchableText);
  if (portfolio) {
    parsed.links.portfolio = portfolio;
    confidence["links.portfolio"] = 0.6;
  }

  const name = extractName(rawText);
  if (name) {
    parsed.identity.name = name;
    confidence["identity.name"] = 0.6;
  }

  const headline = extractHeadline(rawText, parsed.identity.name);
  if (headline) {
    parsed.headline = headline;
    confidence["headline"] = 0.5;
  }

  const current = extractCurrentRoleAndCompany(rawText, parsed.identity.name);
  if (current.role) {
    parsed.currentRole = current.role;
    confidence["currentRole"] = 0.5;
  }
  if (current.company) {
    parsed.currentCompany = current.company;
    confidence["currentCompany"] = 0.5;
  }

  const summary = extractSummary(rawText);
  if (summary) {
    parsed.summary = summary;
    confidence["summary"] = 0.5;
  }

  const sections = splitSections(rawText);

  if (sections.experience) {
    parsed.experience = parseExperience(sections.experience);
    if (parsed.experience.length) confidence["experience"] = 0.6;
  }

  if (sections.education) {
    parsed.education = parseEducation(sections.education);
    if (parsed.education.length) confidence["education"] = 0.6;
  }

  if (sections.skills) {
    parsed.skills = parseSkills(sections.skills);
    if (parsed.skills.length) confidence["skills"] = 0.5;
  }

  if (sections.certifications) {
    const certs = parseSkills(sections.certifications);
    parsed.certifications = certs.slice(0, 10);
    if (parsed.certifications.length) confidence["certifications"] = 0.5;
  }

  if (sections.achievements) {
    const achievements = parseSkills(sections.achievements);
    parsed.achievements = achievements.slice(0, 10);
    if (parsed.achievements.length) confidence["achievements"] = 0.5;
  }

  parsed.confidence = confidence;

  const extractedCount = Object.keys(confidence).length;
  const success = extractedCount > 0;
  const partial = success && (!parsed.experience.length || !parsed.education.length);

  return {
    success,
    partial,
    rawText,
    parsed,
    error: success ? undefined : "Could not confidently extract any structured information from this resume.",
  };
}

/**
 * Regex / keyword parser.
 *
 * Tolerates missing fields and low-quality resumes.
 * Returns confidence scores only for fields actually extracted.
 */
export const regexParser: ResumeParserProvider = {
  name: "regex-parser",

  async parse(fileBase64: string, mimeType: string): Promise<ParseResult> {
    if (mimeType === "text/plain") {
      try {
        const rawText = Buffer.from(fileBase64, "base64").toString("utf-8");
        return parseText(rawText);
      } catch (_e) {
        return {
          success: false,
          partial: false,
          rawText: "",
          parsed: emptyParsedResume(),
          error: "Could not decode resume text.",
        };
      }
    }

    // Extract text from PDF/DOC/DOCX and then run the regex parser on it.
    const extraction = await textExtractor.parse(fileBase64, mimeType);
    if (!extraction.success || !extraction.rawText) {
      return {
        success: false,
        partial: false,
        rawText: extraction.rawText ?? "",
        parsed: emptyParsedResume(),
        error: extraction.error ?? "Could not extract text from the uploaded resume.",
      };
    }
    return parseText(extraction.rawText);
  },
};
