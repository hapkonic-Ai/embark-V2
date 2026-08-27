function MentorIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="14" r="7" stroke="currentColor" strokeWidth="2.5" />
      <path d="M10 42c0-8 6.5-12 14-12s14 4 14 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 10l6-3M8 13l6 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="38" cy="8" r="2.5" fill="currentColor" />
      <circle cx="10" cy="11" r="2.5" fill="currentColor" />
    </svg>
  );
}

function CollegeIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M24 6L6 18v4h36v-4L24 6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M10 22v20M38 22v20M18 22v12M30 22v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M6 42h36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 12h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function CompetitionIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4v6M14 8l4 5M34 8l-4 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 18h12l-2 16h-8L18 18z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 34v8M18 42h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="13" r="3" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

function AspirantsIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="14" r="5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="32" cy="14" r="5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="24" cy="10" r="5" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 42c0-7 5-10 10-10 3 0 5.5 1 7 2.5M40 42c0-7-5-10-10-10-3 0-5.5 1-7 2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M15 42c0-5.5 4-9 9-9s9 3.5 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export const Illustrations = {
  mentor: MentorIllustration,
  college: CollegeIllustration,
  competition: CompetitionIllustration,
  aspirants: AspirantsIllustration,
};
