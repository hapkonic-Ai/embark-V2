import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { playbookCoverImage } from "@/lib/images";

export type HeroBook = {
  title: string;
  subtitle: string;
  color: string;
};

export function BookStack({ books }: { books: HeroBook[] }) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative flex min-h-[520px] items-center justify-center lg:min-h-[640px]">
      {books.map((book, i) => {
        const offset = (i - books.length / 2) * 28;
        const rotate = (i - books.length / 2) * 5;
        const isHovered = hovered === book.title;

        return (
          <motion.div
            key={book.title}
            initial={
              reduce
                ? { opacity: 1, x: 0, y: 0, rotate, scale: 1 }
                : { opacity: 0, x: 80, y: 60, rotate: rotate + 14, scale: 0.9 }
            }
            animate={{
              opacity: 1,
              x: isHovered ? offset * 1.2 : offset,
              y: isHovered ? -40 : 0,
              rotate: isHovered ? 0 : rotate,
              scale: isHovered ? 1.18 : 1,
              zIndex: isHovered ? 50 : books.length - i,
            }}
            transition={{
              duration: 0.5,
              delay: 0.15 + i * 0.1,
              ease: [0.22, 1.4, 0.36, 1],
            }}
            onMouseEnter={() => setHovered(book.title)}
            onMouseLeave={() => setHovered(null)}
            className="absolute w-44 cursor-pointer rounded-r-3xl rounded-l-md border-l-[6px] border-white/30 shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 sm:w-52 lg:w-60"
            style={{
              backgroundColor: book.color,
              height: "320px",
              transformOrigin: "left center",
            }}
          >
            {/* spine texture */}
            <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-white/20 to-transparent" />

            <div className="relative flex h-full flex-col justify-between p-6 text-left text-white">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-10 rounded-full bg-white/30" />
                  <div className="h-2 w-4 rounded-full bg-white/20" />
                </div>
                <motion.h3
                  layout
                  className="mt-8 font-display text-2xl font-bold leading-tight sm:text-3xl"
                >
                  {book.title}
                </motion.h3>
                <p className="mt-3 line-clamp-3 text-sm text-white/80 sm:text-base">
                  {book.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-white/60" />
                <div className="h-2.5 w-20 rounded-full bg-white/20" />
              </div>
            </div>

            {/* hover cover reveal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-r-3xl rounded-l-md"
            >
              <img
                src={playbookCoverImage(book.title)}
                alt={book.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h4 className="font-display text-2xl font-bold text-white">
                  {book.title}
                </h4>
                <p className="mt-2 text-sm text-white/80">{book.subtitle}</p>
              </div>
            </motion.div>
          </motion.div>
        );
      })}

    </div>
  );
}
