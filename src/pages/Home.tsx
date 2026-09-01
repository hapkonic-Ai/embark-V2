import SiteLayout from "@/components/site/SiteLayout";
import { DocumentHead } from "@/components/site/DocumentHead";
import Hero from "@/sections/landing/Hero";
import { PanicState } from "@/sections/landing/PanicState";
import { Marquee, Stats, Features, HowItWorks } from "@/sections/landing/Sections";
import { Programs, MentorsPreview, EventsPreview } from "@/sections/landing/Showcase";
import { Testimonials, FAQ, FinalCTA } from "@/sections/landing/Closing";

export default function Home() {
  return (
    <SiteLayout hero={<Hero />}>
      <DocumentHead
        title="Arena for grads — Mentorship, Events & Playbooks for MBA Aspirants"
        description="Connect with verified IIM, XLRI and ISB mentors, join live events, download practical playbooks and compare B-schools on Arena for grads."
        path=""
      />
      <PanicState />
      <Marquee />
      <Stats />
      <Features />
      <HowItWorks />
      <Programs />
      <MentorsPreview />
      <EventsPreview />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </SiteLayout>
  );
}
