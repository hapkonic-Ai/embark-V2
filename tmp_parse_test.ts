import fs from "node:fs";
import { textExtractor } from "./api/lib/resume-parsers/text-extractor";

const b64 = fs.readFileSync("docs/test/kavikkannan_resume (1).pdf", "base64");
const r = await textExtractor.parse(b64, "application/pdf");
console.log(r.rawText);
