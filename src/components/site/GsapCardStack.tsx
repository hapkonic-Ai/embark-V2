import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { generateBookCover } from "@/lib/bookCover";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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

  useLayoutEffect(() => {
    const container = containerRef.current;
    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!container || cards.length === 0) return;

    const ctx = gsap.context(() => {
      const centerX = container.offsetWidth / 2 - CARD_W / 2;
      const centerY = container.offsetHeight / 2 - CARD_H / 2;

      // initial stacked state
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

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top 60%",
          end: "bottom 20%",
          scrub: 1,
        },
      });

      cards.forEach((card, i) => {
        const spread = (i - (cards.length - 1) / 2) * (CARD_W + 24);
        tl.to(
          card,
          {
            x: centerX + spread,
            y: centerY - Math.abs(spread) * 0.15,
            rotation: (i - cards.length / 2) * 3,
            scale: 1,
            zIndex: i,
            ease: "none",
          },
          0
        );
      });
    }, container);

    return () => ctx.revert();
  }, [books.length]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[520px] lg:min-h-[640px]"
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
