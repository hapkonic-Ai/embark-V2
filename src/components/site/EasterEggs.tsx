import { useEffect } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

const ORANGE_PALETTE = ["#f97316", "#ea580c", "#fbbf24", "#ffedd5", "#c2410c"];

export function fireConfetti(big = false) {
  confetti({
    particleCount: big ? 260 : 90,
    spread: big ? 130 : 75,
    origin: { y: 0.6 },
    colors: ORANGE_PALETTE,
  });
}

export default function EasterEggs() {
  const [rocket, setRocket] = useState(0);

  useEffect(() => {
    const konamiBuffer: string[] = [];
    let wordBuffer = "";

    const onKey = (e: KeyboardEvent) => {
      // Konami code
      konamiBuffer.push(e.key);
      if (konamiBuffer.length > KONAMI.length) konamiBuffer.shift();
      if (KONAMI.every((k, i) => konamiBuffer[i] === k)) {
        konamiBuffer.length = 0;
        fireConfetti(true);
        setTimeout(() => fireConfetti(true), 350);
        toast("🕹️ KONAMI!", {
          description: "You unlocked absolutely nothing. But the panel is impressed.",
        });
      }

      // typing "embark"
      if (/^[a-z]$/i.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        wordBuffer = (wordBuffer + e.key.toLowerCase()).slice(-6);
        if (wordBuffer === "embark") {
          wordBuffer = "";
          setRocket((r) => r + 1);
          fireConfetti(true);
          toast("🚀 Liftoff!", {
            description: "You typed our name. The rocket approves.",
          });
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {rocket > 0 && (
        <motion.div
          key={rocket}
          initial={{ x: "-10vw", y: "80vh", rotate: -45, opacity: 1 }}
          animate={{ x: "110vw", y: "-20vh", rotate: -45, opacity: [1, 1, 0] }}
          transition={{ duration: 2.4, ease: "easeIn" }}
          className="fixed z-[100] text-6xl pointer-events-none select-none"
        >
          🚀
        </motion.div>
      )}
    </AnimatePresence>
  );
}
