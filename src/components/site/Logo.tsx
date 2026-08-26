import { useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Link } from "react-router";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const clicks = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  const handleClick = (e: React.MouseEvent) => {
    clicks.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => (clicks.current = 0), 900);
    if (clicks.current === 7) {
      e.preventDefault();
      clicks.current = 0;
      document.documentElement.classList.add("party-mode");
      confetti({
        particleCount: 220,
        spread: 120,
        origin: { y: 0.1 },
        colors: ["#f97316", "#ea580c", "#fbbf24", "#fff7ed"],
      });
      toast("🎉 PARTY MODE ACTIVATED", {
        description: "You clicked the logo 7 times. It wears off in 6 seconds. Worth it.",
      });
      setTimeout(
        () => document.documentElement.classList.remove("party-mode"),
        6000,
      );
    }
  };

  const dims = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return (
    <Link to="/" onClick={handleClick} className="flex items-center gap-2.5 group select-none">
      <motion.div
        whileHover={{ rotate: -12, scale: 1.08 }}
        whileTap={{ scale: 0.9 }}
        className={`${dims} rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
          <path d="M13 2 4.5 13.5H11L9.5 22 19.5 9.5H12.5L13 2Z" />
        </svg>
      </motion.div>
      <span className="font-display font-700 text-xl font-bold tracking-tight">
        embark
        <span className="text-orange-500">.</span>
      </span>
    </Link>
  );
}
