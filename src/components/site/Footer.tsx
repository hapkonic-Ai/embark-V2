import { Link } from "react-router";
import { Mail, MapPin, Phone, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import { Logo } from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t bg-stone-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        {/* top row */}
        <div className="grid gap-12 lg:grid-cols-12">
          {/* brand column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="[&_span]:text-white">
              <Logo />
            </div>
            <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
              Mentorship, events, playbooks and college comparisons. Everything
              between you and your dream B-school, built by people who have
              actually converted their calls.
            </p>
            <div className="flex flex-col gap-3 text-sm text-stone-400">
              <a href="mailto:hello@embark.edu" className="flex items-center gap-2 hover:text-orange-400 transition-colors">
                <Mail className="h-4 w-4" /> hello@embark.edu
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Bangalore, India
              </span>
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> WhatsApp support
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Instagram" className="h-10 w-10 rounded-full border border-stone-800 flex items-center justify-center hover:border-orange-500 hover:text-orange-400 transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Twitter" className="h-10 w-10 rounded-full border border-stone-800 flex items-center justify-center hover:border-orange-500 hover:text-orange-400 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="h-10 w-10 rounded-full border border-stone-800 flex items-center justify-center hover:border-orange-500 hover:text-orange-400 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" aria-label="YouTube" className="h-10 w-10 rounded-full border border-stone-800 flex items-center justify-center hover:border-orange-500 hover:text-orange-400 transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* links */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-display font-semibold text-white mb-4 text-sm">Platform</h4>
              <ul className="space-y-3 text-sm text-stone-400">
                <li><Link className="hover:text-orange-400 transition-colors" to="/mentors">Find a mentor</Link></li>
                <li><Link className="hover:text-orange-400 transition-colors" to="/guest-lecturer">Guest Lecturer</Link></li>
                <li><Link className="hover:text-orange-400 transition-colors" to="/events">Events & case comps</Link></li>
                <li><Link className="hover:text-orange-400 transition-colors" to="/playbooks">Playbooks</Link></li>
                <li><Link className="hover:text-orange-400 transition-colors" to="/colleges">Compare colleges</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-white mb-4 text-sm">Roles</h4>
              <ul className="space-y-3 text-sm text-stone-400">
                <li><Link className="hover:text-orange-400 transition-colors" to="/login?mode=register">Become a candidate</Link></li>
                <li><Link className="hover:text-orange-400 transition-colors" to="/login?mode=register&role=mentor">Become a mentor</Link></li>
                <li><Link className="hover:text-orange-400 transition-colors" to="/login?mode=register&role=campus">Campus requests</Link></li>
                <li><Link className="hover:text-orange-400 transition-colors" to="/login">Sign in</Link></li>
              </ul>
            </div>
          </div>

          {/* newsletter */}
          <div className="lg:col-span-3">
            <h4 className="font-display font-semibold text-white mb-4 text-sm">Stay in the loop</h4>
            <p className="text-sm text-stone-400 mb-4">
              Weekly drops: new mentors, live events, playbooks and campus stories.
            </p>
            <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="you@example.com"
                className="h-11 rounded-full border border-stone-800 bg-stone-900 px-4 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="h-11 rounded-full bg-orange-600 px-6 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-4 text-xs text-stone-600">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-14 pt-8 border-t border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <span>© 2026 Embark. Built in India.</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link className="hover:text-orange-400 transition-colors" to="/terms">Terms of Service</Link>
            <Link className="hover:text-orange-400 transition-colors" to="/privacy">Privacy Policy</Link>
            <span>CAT · Convert · Campus</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
