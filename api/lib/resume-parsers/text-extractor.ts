import { Buffer } from "node:buffer";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import {
  emptyParsedResume,
  type ParseResult,
  type ResumeParserProvider,
} from "../resume-parser";

const SUPPORTED_MIMES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

async function extractPdfText(fileBase64: string): Promise<string> {
  const buffer = Buffer.from(fileBase64, "base64");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    // Embed hyperlink annotations as markdown links [text](url) so the regex parser can read them.
    const result = await parser.getText({ parseHyperlinks: true });
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(fileBase64: string): Promise<string> {
  const buffer = Buffer.from(fileBase64, "base64");
  // Convert to HTML first so we can preserve hyperlinks as markdown links.
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value ?? "";
  // Turn <a href="...">text</a> into [text](url) so the regex parser sees the URL.
  const withLinks = html.replace(
    /<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi,
    (_, url: string, text: string) => `[${text.trim()}](${url})`,
  );
  return htmlToText(withLinks);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim(),
  );
}

/**
 * Phase 1 text extractor.
 *
 * - Plain text: decoded directly.
 * - PDF: extracted via pdf-parse.
 * - DOCX/DOC: extracted via mammoth (DOCX) or mammoth (DOC conversion fallback).
 */
export const textExtractor: ResumeParserProvider = {
  name: "text-extractor",

  async parse(fileBase64: string, mimeType: string): Promise<ParseResult> {
    if (!SUPPORTED_MIMES.includes(mimeType)) {
      return {
        success: false,
        partial: false,
        rawText: "",
        parsed: emptyParsedResume(),
        error: `Unsupported file type: ${mimeType}. Accepted: PDF, TXT, DOC, DOCX.`,
      };
    }

    try {
      let rawText = "";
      if (mimeType === "text/plain") {
        rawText = Buffer.from(fileBase64, "base64").toString("utf-8");
      } else if (mimeType === "application/pdf") {
        rawText = await extractPdfText(fileBase64);
      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "application/msword"
      ) {
        rawText = await extractDocxText(fileBase64);
      }

      return {
        success: true,
        partial: false,
        rawText,
        parsed: emptyParsedResume(),
      };
    } catch (_e) {
      return {
        success: false,
        partial: false,
        rawText: "",
        parsed: emptyParsedResume(),
        error: "Could not extract text from the uploaded resume.",
      };
    }
  },
};
