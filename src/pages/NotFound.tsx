import { Link } from "react-router";
import { motion } from "framer-motion";
import SiteLayout from "@/components/site/SiteLayout";
import { DocumentHead } from "@/components/site/DocumentHead";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteLayout>
      <DocumentHead title="Page not found" noIndex />
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 text-center min-h-[60vh]">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="font-display text-[8rem] sm:text-[10rem] leading-none font-bold text-gradient-orange select-none"
        >
          404
        </motion.div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold mt-4">This page took a drop year.</h1>
        <p className="mt-3 text-muted-foreground max-w-md">
          It is re-attempting next season. Meanwhile, head back to a page that already converted.
        </p>
        <div className="mt-8 flex gap-3">
          <Button className="rounded-full" asChild>
            <Link to="/">Back to safety</Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/mentors">Find a mentor</Link>
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
}
