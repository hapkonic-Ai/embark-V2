import { Link } from "react-router";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { fireConfetti } from "@/components/site/EasterEggs";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="font-display text-[10rem] leading-none font-bold text-gradient-orange select-none"
      >
        404
      </motion.div>
      <h1 className="font-display text-2xl font-bold mt-2">This page took a drop year.</h1>
      <p className="mt-2 text-muted-foreground max-w-md">
        It's re-attempting next season. Meanwhile, here's some confetti for your trouble.
      </p>
      <div className="mt-8 flex gap-3">
        <Button className="rounded-full" asChild><Link to="/">Back to safety</Link></Button>
        <Button variant="outline" className="rounded-full" onClick={() => fireConfetti(true)}>
          More confetti 🎉
        </Button>
      </div>
    </div>
  );
}
