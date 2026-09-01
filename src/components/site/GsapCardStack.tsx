import { useRef, useLayoutEffect, useState } from "react";
import { gsap } from "gsap";
import { generateBookCover } from "@/lib/bookCover";

const CARD_W = 118;
const CARD_H = 178;

export type StackBook = {
  title: string;
  subtitle: string;
  color: string;
};

export function GsapCardStack({ books }: { books: StackBook[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!container || cards.length === 0) return;

    const ctx = gsap.context(() => {
      const centerX = container.offsetWidth / 2 - CARD_W / 2;
      const centerY = container.offsetHeight / 2 - CARD_H / 2;

      cards.forEach((card, i) => {
        gsap.set(card, {
          x: centerX,
          y: centerY,
          rotation: (i - cards.length / 2) * 5,
          scale: 1 - i * 0.015,
          zIndex: cards.length - i,
          opacity: 1,
        });
      });
    }, container);

    return () => ctx.revert();
  }, [books.length]);

  const fanOut = () => {
    if (prefersReducedMotion) return;
    const container = containerRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!container || cards.length === 0) return;

    const startX = container.offsetWidth * 0.18 - CARD_W / 2;
    const centerY = container.offsetHeight / 2 - CARD_H / 2;
    const gap = 8;

    cards.forEach((card, i) => {
      const spread = i * (CARD_W + gap);
      gsap.to(card, {
        x: startX + spread,
        y: centerY - i * 8,
        rotation: (i - cards.length / 2) * 2,
        scale: 1,
        zIndex: i,
        duration: 0.5,
        ease: "back.out(1.2)",
        delay: i * 0.04,
      });
    });
  };

  const stack = () => {
    if (prefersReducedMotion) return;
    const container = containerRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!container || cards.length === 0) return;

    const centerX = container.offsetWidth / 2 - CARD_W / 2;
    const centerY = container.offsetHeight / 2 - CARD_H / 2;

    cards.forEach((card, i) => {
      gsap.to(card, {
        x: centerX,
        y: centerY,
        rotation: (i - cards.length / 2) * 5,
        scale: 1 - i * 0.015,
        zIndex: cards.length - i,
        duration: 0.45,
        ease: "power2.out",
        delay: (cards.length - i) * 0.025,
      });
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={fanOut}
      onMouseLeave={stack}
      className="relative w-full min-h-[360px] lg:min-h-[420px] cursor-pointer"
    >
      {books.map((book, i) => (
        <div
          key={book.title}
          ref={(el) => { cardsRef.current[i] = el; }}
          className="absolute rounded-r-2xl rounded-l-md border-l-[4px] border-white/30 shadow-xl overflow-hidden will-change-transform"
          style={{
            width: CARD_W,
            height: CARD_H,
            backgroundColor: book.color,
            backgroundImage: `url(${generateBookCover(book.title, book.subtitle, book.color)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* page edge */}
          <div className="absolute inset-y-1 right-1 w-2 rounded-r-xl bg-[#f5f0e8]/90" />
          {/* spine */}
          <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/20 to-transparent" />
          {/* title overlay for readability */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
            <p className="font-display text-sm font-bold text-white leading-tight">
              {book.title}
            </p>
            <p className="mt-0.5 text-[10px] text-white/80 line-clamp-2">
              {book.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
