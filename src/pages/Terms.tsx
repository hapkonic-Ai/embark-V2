import SiteLayout from "@/components/site/SiteLayout";

export default function Terms() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">Last updated: 27 August 2026</p>

        <div className="mt-10 prose prose-stone max-w-none">
          <h2 className="font-display text-2xl font-semibold mt-8">1. Overview</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Embark connects MBA aspirants with mentors, events, playbooks and college data. By using our platform, you agree to these terms. If you do not agree, do not use the service.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">2. Eligibility</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            You must be at least 18 years old or have parental consent to use Embark. Mentor accounts require accurate professional and academic credentials. We verify mentor profiles before they appear publicly.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">3. Mentorship Bookings</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Payments made through Embark are currently simulated for demonstration purposes. Real payments, when enabled, will be processed through a regulated payment gateway. Mentors coordinate sessions directly with candidates. Embark does not guarantee admission outcomes.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">4. Content and Conduct</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Do not post harmful, abusive, plagiarised or misleading content. Event submissions must be your own work. We may suspend accounts that violate these rules.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">5. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Playbooks, event materials and platform content are owned by Embark or its licensors. You may not redistribute purchased playbooks or event content without permission.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">6. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            College statistics and mentor information are indicative. Always verify with official college and mentor sources. Embark is not liable for decisions you make using platform data.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">7. Changes</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            We may update these terms. Continued use after changes means you accept the new terms.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
