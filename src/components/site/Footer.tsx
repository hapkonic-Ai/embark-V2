import { Link } from "react-router";
import { Logo } from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t bg-stone-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <div className="[&_span]:text-white">
              <Logo />
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Mentorship, events, playbooks and college comparisons. Everything
              between you and your dream B-school.
            </p>
            <p className="text-xs text-stone-600">
              Three easter eggs hidden on this site. Gamers already know one.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-white mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-orange-400 transition-colors" to="/mentors">Find a mentor</Link></li>
              <li><Link className="hover:text-orange-400 transition-colors" to="/events">Events & case comps</Link></li>
              <li><Link className="hover:text-orange-400 transition-colors" to="/playbooks">Playbooks</Link></li>
              <li><Link className="hover:text-orange-400 transition-colors" to="/colleges">Compare colleges</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-white mb-3">Roles</h4>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-orange-400 transition-colors" to="/login?mode=register">Become a candidate</Link></li>
              <li><Link className="hover:text-orange-400 transition-colors" to="/login?mode=register&role=mentor">Become a mentor</Link></li>
              <li><Link className="hover:text-orange-400 transition-colors" to="/login">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-white mb-3">Fine print</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li><Link className="hover:text-orange-400 transition-colors" to="/terms">Terms of Service</Link></li>
              <li><Link className="hover:text-orange-400 transition-colors" to="/privacy">Privacy Policy</Link></li>
              <li>Mentors connect with you directly on WhatsApp.</li>
              <li>College stats are indicative. Verify with official sources.</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <span>© 2026 Embark. Built in India.</span>
          <span>CAT · Convert · Campus</span>
        </div>
      </div>
    </footer>
  );
}
