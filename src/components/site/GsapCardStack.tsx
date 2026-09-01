import { useRef, useLayoutEffect, useState } from "react";
import { gsap } from "gsap";
import { generateBookCover } from "@/lib/bookCover";

const CARD_W = 220;
const CARD_H = 320;

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
          rotation: (i - cards.length / 2) * 4,
          scale: 1 - i * 0.02,
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

    const centerX = container.offsetWidth / 2 - CARD_W / 2;
    const centerY = container.offsetHeight / 2 - CARD_H / 2;

    cards.forEach((card, i) => {
      const spread = (i - (cards.length - 1) / 2) * (CARD_W + 24);
      gsap.to(card, {
        x: centerX + spread,
        y: centerY - Math.abs(spread) * 0.15,
        rotation: (i - cards.length / 2) * 3,
        scale: 1,
        zIndex: i,
        duration: 0.55,
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
        rotation: (i - cards.length / 2) * 4,
        scale: 1 - i * 0.02,
        zIndex: cards.length - i,
        duration: 0.5,
        ease: "power2.out",
        delay: (cards.length - i) * 0.03,
      });
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={fanOut}
      onMouseLeave={stack}
      className="relative w-full min-h-[520px] lg:min-h-[640px] cursor-pointer"
    >
      {books.map((book, i) => (
        <div
          key={book.title}
          ref={(el) => { cardsRef.current[i] = el; }}
          className="absolute rounded-r-3xl rounded-l-md border-l-[6px] border-white/30 shadow-2xl overflow-hidden will-change-transform"
          style={{
            width: CARD_W,
            height: CARD_H,
            backgroundColor: book.color,
            backgroundImage: `url(${generateBookCover(book.title, book.subtitle, book.color)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}
    </div>
  );
}
