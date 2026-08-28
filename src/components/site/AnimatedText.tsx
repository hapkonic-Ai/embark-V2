import { motion, useReducedMotion } from "framer-motion";

export function AnimatedText({
  children,
  className = "",
  as: Tag = "span",
  delay = 0,
  stagger = 0.04,
  splitBy = "word",
}: {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  stagger?: number;
  splitBy?: "word" | "line";
}) {
  const reduce = useReducedMotion();
  const parts = splitBy === "word" ? children.split(" ") : children.split("\n");

  return (
    <Tag className={className}>
      {parts.map((part, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduce ? 0 : 0.55,
              delay: reduce ? 0 : delay + i * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {part}
            {splitBy === "word" && i < parts.length - 1 ? "\u00A0" : ""}
            {splitBy === "line" && i < parts.length - 1 ? <br /> : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
