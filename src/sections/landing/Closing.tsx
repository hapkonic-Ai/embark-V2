import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ParallaxBox } from "@/components/site/Parallax";

const TESTIMONIALS = [
  {
    name: "Ankit Verma",
    school: "IIM Kozhikode '27",
    text: "My mentor tore my first mock PI apart. Four sessions later, the real panel felt like a practice round. Converted IIM K and IMT.",
  },
  {
    name: "Sana Sheikh",
    school: "XLRI '27",
    text: "Won the National Case Sprint and put it on my resume — two panel questions were literally about it. Best ₹0 I've ever spent.",
  },
  {
    name: "Dev Patel",
    school: "FMS Delhi '27",
    text: "The PI Crusher playbook had 6 of the 8 questions I was actually asked. Slightly creepy, extremely useful.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-orange-50/60 dark:bg-transparent">
      <ParallaxBox offset={35} className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-orange-600 uppercase tracking-widest">Converts</span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">
            They embarked. They converted.
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl border bg-card p-7 shadow-sm"
            >
              <Quote className="h-6 w-6 text-orange-400" />
              <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-5">
                <div className="font-display font-semibold">{t.name}</div>
                <div className="text-xs text-orange-600 font-medium">{t.school}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </ParallaxBox>
    </section>
  );
}

const FAQS = [
  {
    q: "How do I talk to my mentor?",
    a: "Right after checkout, you get your mentor's WhatsApp number. All calls, mock GDs and interviews happen directly between you two — we don't sit in the middle or charge commissions on your conversations.",
  },
  {
    q: "What exactly do I get in a mentorship package?",
    a: "Each mentor sets their own package: a fixed number of mock GDs and mock interviews, plus guidance on SOPs, forms and strategy. You can track every session and its feedback in your dashboard.",
  },
  {
    q: "How do hackathon submissions work?",
    a: "Register on the event page and upload your PPT, PDF or document (up to 8 MB) before the deadline. Our admin jury scores every submission, and winners are announced on the event page itself.",
  },
  {
    q: "Are the college stats official?",
    a: "Figures are compiled from public placement reports and NIRF data, and are meant to be indicative. Always verify final numbers on the institute's official website before making decisions.",
  },
  {
    q: "I heard there are easter eggs?",
    a: "There are. Three of them. One involves arrows, one involves our name, and one involves clicking something seven times. Happy hunting. 🥚",
  },
];

export function FAQ() {
  return (
    <section className="py-20">
      <ParallaxBox offset={30} className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center font-display text-4xl sm:text-5xl font-bold tracking-tight">
          Questions? Good sign.
        </h2>
        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`q${i}`}>
              <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ParallaxBox>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="px-4 sm:px-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-stone-950 px-6 py-20 text-center text-white"
      >
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="absolute -bottom-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-orange-600/30 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tight">
            Your convert story
            <br />
            <span className="text-gradient-orange">starts here.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-stone-400">
            Join thousands of aspirants who stopped preparing alone.
          </p>
          <Button size="lg" className="btn-shine mt-8 rounded-full px-10 h-12 text-base" asChild>
            <Link to="/login?mode=register">
              Create free account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
