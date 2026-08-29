/**
 * Resume parser abstraction.
 *
 * The parser converts a resume FILE into a structured PROPOSAL.
 * The proposal is never auto-published; the expert reviews and confirms it.
 */

export type ResumeIdentity = {
  name?: string;
  email?: string;
  phone?: string;
};

export type ResumeLinks = {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
};

export type ResumeExperience = {
  company?: string;
  role?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
};

export type ResumeEducation = {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  description?: string;
};

export type ParsedResume = {
  identity: ResumeIdentity;
  links: ResumeLinks;
  summary?: string;
  headline?: string;
  currentRole?: string;
  currentCompany?: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  certifications: string[];
  achievements: string[];
  /** Confidence 0-1 for fields that were extracted. */
  confidence?: Record<string, number>;
};

export type ParseResult = {
  success: boolean;
  partial: boolean;
  rawText: string;
  parsed: ParsedResume;
  error?: string;
};

export interface ResumeParserProvider {
  readonly name: string;
  parse(fileBase64: string, mimeType: string): Promise<ParseResult>;
}

export function emptyParsedResume(): ParsedResume {
  return {
    identity: {},
    links: {},
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    achievements: [],
  };
}
