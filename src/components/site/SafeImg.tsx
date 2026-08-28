import { useState } from "react";

const FALLBACKS: Record<string, string> = {};

export function SafeImg({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  const [error, setError] = useState(false);
  const initial = fallback || FALLBACKS[src];

  // use a deterministic unsplash image as a reliable fallback if none provided
  const finalFallback =
    initial ||
    `https://images.unsplash.com/photo-${["1511632765486-a01980e01a18", "1523580494863-6f3031224c94", "1531482615713-2afd69097998", "1517245386807-bb43f82c33c4", "1540575460203-b5a3f39e7485", "1524178232363-1fb2b075b655"][(alt.length + src.length) % 6]}?auto=format&fit=crop&w=400&q=80`;

  return (
    <img
      src={error ? finalFallback : src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}
