import SiteLayout from "@/components/site/SiteLayout";
import { DocumentHead } from "@/components/site/DocumentHead";

export default function Privacy() {
  return (
    <SiteLayout>
      <DocumentHead
        title="Privacy Policy"
        description="Read the Privacy Policy for Arena for grads — how we collect, use and protect your data on our MBA mentorship platform."
        path="privacy"
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24">
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated: 27 August 2026</p>

        <div className="mt-10 prose prose-stone max-w-none">
          <h2 className="font-display text-2xl font-semibold mt-8">1. What we collect</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            We collect your name, email, phone, LinkedIn URL, role and payment intent when you register. Mentor profiles may include work history, B-school, expertise and a public bio. Event submissions may include files you upload.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">2. How we use data</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            We use your data to match you with mentors, process bookings, run events, send updates and improve the platform. We do not sell your personal information to third parties.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">3. Cookies and sessions</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Arena for grads uses secure HTTP-only cookies to keep you signed in. You can clear cookies from your browser to end your session.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">4. Data sharing</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Candidate contact details are shared with a mentor only after a booking is confirmed. Mentor public profiles are visible to all visitors. We do not share passwords or payment details.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">5. Your rights</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            You can request a copy of your data, correct inaccuracies, or delete your account by contacting us. Account deletion removes your profile but keeps anonymised transaction records where required by law.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">6. Security</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            We use password hashing, signed JWT sessions and HTTPS. File uploads are stored temporarily; we plan to move to encrypted object storage.
          </p>

          <h2 className="font-display text-2xl font-semibold mt-8">7. Updates</h2>
          <p className="text-muted-foreground leading-relaxed mt-3">
            We may update this policy. Material changes will be announced on the platform.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
