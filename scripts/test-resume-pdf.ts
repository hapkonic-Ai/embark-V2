import { readFileSync } from "node:fs";
import { regexParser } from "../api/lib/resume-parsers/regex-parser";

const file = "docs/test/kavikkannan_resume (1).pdf";
const buffer = readFileSync(file);

async function main() {
  const base64 = buffer.toString("base64");
  const result = await regexParser.parse(base64, "application/pdf");
  console.log("=== RAW TEXT ===");
  console.log(result.rawText.slice(0, 2000));
  console.log("\n=== PARSED ===");
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
