import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Hero from "@/sections/landing/Hero";
import { Marquee, Stats, Features, HowItWorks } from "@/sections/landing/Sections";
import { Programs, MentorsPreview, EventsPreview } from "@/sections/landing/Showcase";
import { Testimonials, FAQ, FinalCTA } from "@/sections/landing/Closing";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
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
