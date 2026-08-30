import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { DocumentHead } from "@/components/site/DocumentHead";
import Hero from "@/sections/landing/Hero";
import { PanicState } from "@/sections/landing/PanicState";
import { Marquee, Stats, Features, HowItWorks } from "@/sections/landing/Sections";
import { Programs, MentorsPreview, EventsPreview } from "@/sections/landing/Showcase";
import { Testimonials, FAQ, FinalCTA } from "@/sections/landing/Closing";

export default function Home() {
  return (
    <div className="min-h-screen">
      <DocumentHead
        title="Your MBA Journey Starts Here"
        description="Arena for grads connects MBA aspirants with verified IIM, XLRI and ISB mentors, live events, practical playbooks and B-school comparison tools."
        path=""
      />
      <Navbar />
      <main>
        <Hero />
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
      </main>
      <Footer />
    </div>
  );
}
