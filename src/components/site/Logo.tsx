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

  const dims = size === "sm" ? "h-9" : "h-11";
  return (
    <Link to="/" onClick={handleClick} className="flex items-center gap-2.5 group select-none">
      <motion.img
        whileHover={{ rotate: -6, scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        src="/image copy.png"
        alt="Arena for grads"
        className={`${dims} w-auto object-contain`}
      />
    </Link>
  );
}
