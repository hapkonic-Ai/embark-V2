function MentorIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="17" r="7" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 42c0-9 7-14 16-14s16 5 16 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 13l8-5M6 18l8-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="42" cy="8" r="3" fill="currentColor" />
      <circle cx="6" cy="13" r="3" fill="currentColor" />
      <path d="M38 38l3 3M41 38l-3 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function CollegeIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L4 18v3h40v-3L24 4z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M8 21v22M40 21v22M16 21v14M32 21v14M24 21v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M4 43h40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M21 11h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="40" cy="10" r="3" fill="currentColor" />
      <path d="M40 7v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CompetitionIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M16 14h16l-2 16H18L16 14z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 30v8M18 38h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 14l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="36" cy="10" r="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M34 8l4 4M38 8l-4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function AspirantsIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="12" r="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M12 42c0-7 5.5-11 12-11s12 4 12 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="10" cy="16" r="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M4 40c0-5 4-9 9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="38" cy="16" r="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M44 40c0-5-4-9-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 44l6-6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const Illustrations = {
  mentor: MentorIllustration,
  college: CollegeIllustration,
  competition: CompetitionIllustration,
  aspirants: AspirantsIllustration,
};
