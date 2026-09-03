import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, GraduationCap, Loader2, MapPinned, School, Star, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { isExpertEnabled } from "@contracts/features";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/site/Logo";
import { dashboardPath } from "@/components/site/Navbar";
import { DocumentHead } from "@/components/site/DocumentHead";
import { fireConfetti } from "@/components/site/EasterEggs";
import { SafeImg } from "@/components/site/SafeImg";
import { reviewPersonImage, fallbackFace } from "@/lib/images";

function buildOAuthUrl() {
  const authUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appId = import.meta.env.VITE_APP_ID;
  if (!authUrl || !appId) return null;
  const origin = window.location.origin;
  const redirectUri = `${origin}/api/oauth/callback`;
  const returnTo = new URLSearchParams(window.location.search).get("from") || "/";
  const params = new URLSearchParams({
    client_id: appId,
    response_type: "code",
    redirect_uri: redirectUri,
    state: btoa(returnTo),
  });
  return `${authUrl}/api/oauth/authorize?${params.toString()}`;
}

export default function Login() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(
    params.get("mode") === "register" ? "register" : "login",
  );
  const [role, setRole] = useState<"candidate" | "mentor" | "expert" | "campus">(
    params.get("role") === "mentor"
      ? "mentor"
      : params.get("role") === "expert"
        ? "expert"
        : params.get("role") === "campus"
          ? "campus"
          : "candidate",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const onSuccess = async (
    user: { role: string; onboarding?: { currentStep: string; status: string } | null },
    isNew: boolean,
  ) => {
    await utils.invalidate();
    if (isNew) fireConfetti(true);
    toast.success(isNew ? "Welcome aboard!" : "Welcome back!");
    const from = params.get("from");
    if (
      (user.role === "mentor" || user.role === "expert") &&
      user.onboarding?.status !== "completed"
    ) {
      navigate(user.role === "mentor" ? "/mentor/onboarding" : "/expert/onboarding", {
        replace: true,
      });
      return;
    }
    if (from && from.startsWith("/") && !from.startsWith("/login")) {
      navigate(from, { replace: true });
      return;
    }
    navigate(dashboardPath(user.role), { replace: true });
  };

  const loginMut = trpc.account.login.useMutation({
    onSuccess: (u) => onSuccess(u, false),
    onError: (e) => toast.error(e.message),
  });
  const regMut = trpc.account.register.useMutation({
    onSuccess: (u) => onSuccess(u, true),
    onError: (e) => toast.error(e.message),
  });
  const pending = loginMut.isPending || regMut.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMut.mutate({ email, password });
    } else {
      regMut.mutate({
        name,
        email,
        password,
        phone: phone || undefined,
        role,
        linkedinUrl: linkedinUrl || undefined,
        termsAccepted,
      });
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <DocumentHead title="Sign in" description="Sign in or create your Arena for grads account — for candidates, mentors, experts and campus partners." path="login" noIndex />
      {/* left panel */}
      <div className="section-dark relative hidden lg:flex flex-col p-12">
        <div className="relative [&_span]:text-white">
          <Logo />
        </div>

        <div className="relative flex-1 flex flex-col justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-5xl font-bold leading-tight"
          >
            The journey of
            <br />
            <span className="text-gradient-orange">a thousand mocks</span>
            <br />
            begins with one click.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="mt-6 max-w-md text-stone-400"
          >
            Mentors from IIMs &amp; XLRI. National hackathons. Playbooks that
            actually work. Every B-school in India, comparable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="mt-10 relative h-[420px] w-full max-w-md"
          >
            {/* central student image */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1.4, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 h-[300px] w-[220px] -translate-x-1/2 -translate-y-1/2 z-10"
            >
              <SafeImg
                src="/login-student.png"
                alt="Student holding books"
                className="h-full w-full object-contain drop-shadow-2xl"
                fallback="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=400&q=80"
              />
            </motion.div>

            {/* floating avatar stack */}
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute left-0 top-4 rounded-2xl border border-stone-800 bg-card p-4 z-20"
            >
              <div className="flex -space-x-3">
                {[
                  { name: "Ayesha", src: reviewPersonImage("Ayesha") },
                  { name: "Rahul", src: reviewPersonImage("Rahul") },
                  { name: "Priya", src: reviewPersonImage("Priya") },
                  { name: "Vikram", src: reviewPersonImage("Vikram") },
                ].map((p, i) => (
                  <SafeImg key={i} src={p.src} alt={p.name} fallback={fallbackFace(p.name)} className="h-10 w-10 rounded-full border-2 border-stone-950 object-cover" />
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-950 bg-orange-500 text-xs font-bold">
                  +4k
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-orange-400" />
                <span>Students cracked IIMs this season</span>
              </div>
            </motion.div>

            {/* review card */}
            <motion.div
              animate={{ y: [8, -8, 8] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
              className="absolute right-0 top-12 max-w-[260px] rounded-2xl border border-stone-800 bg-card p-4 z-20"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-snug">
                “My PI mentor asked the exact questions that came up in my actual IIM panel. Unreal.”
              </p>
              <div className="mt-3 flex items-center gap-2">
                <SafeImg src={reviewPersonImage("Ayesha")} alt="Ayesha" fallback={fallbackFace("Ayesha")} className="h-8 w-8 rounded-full object-cover" />
                <div className="text-xs">
                  <div className="font-semibold text-stone-100">Ayesha K.</div>
                  <div className="text-muted-foreground">IIM K '27</div>
                </div>
              </div>
            </motion.div>

            {/* stat card */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute left-6 bottom-6 rounded-2xl border border-stone-800 bg-card p-4 z-20"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">₹35.3 LPA</div>
                  <div className="text-xs text-muted-foreground">Average top-10 package</div>
                </div>
              </div>
            </motion.div>

            {/* cta bubble */}
            <motion.div
              animate={{ x: [-6, 6, -6] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute right-4 bottom-0 rounded-full border border-stone-800 bg-card px-4 py-2 text-xs text-muted-foreground z-20"
            >
              <span className="inline-flex items-center gap-1">
                Join the waitlist <ArrowRight className="h-3 w-3 text-orange-400" />
              </span>
            </motion.div>
          </motion.div>
        </div>

        <p className="relative mt-6 text-xs text-muted-foreground">
          Arena for grads — mentorship, events and college insights built by people who have converted their calls.
        </p>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["candidate", "mentor", "expert", "campus"] as const)
                    .filter((r) => r !== "expert" || isExpertEnabled())
                    .map((r) => {
                    const meta = {
                      candidate: { icon: GraduationCap, label: "Student", desc: "I want to get mentored" },
                      mentor: { icon: MapPinned, label: "Mentor", desc: "I want to mentor" },
                      expert: { icon: Star, label: "Expert", desc: "I want to offer services" },
                      campus: { icon: School, label: "Campus", desc: "I run a college club" },
                    } as const;
                    const Icon = meta[r].icon;
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`rounded-2xl border-2 p-4 text-left transition-all ${
                          role === r
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                            : "border-border hover:border-orange-200"
                        }`}
                      >
                        <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="mt-2 font-display font-semibold">{meta[r].label}</div>
                        <div className="text-xs text-muted-foreground">{meta[r].desc}</div>
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="Aarya Sharma" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone / WhatsApp (optional)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="linkedin">LinkedIn profile URL (optional)</Label>
                  <Input id="linkedin" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/your-handle" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border p-4">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(v === true)}
                    required
                  />
                  <Label htmlFor="terms" className="text-sm font-normal cursor-pointer whitespace-nowrap">
                    I agree to the{" "}
                    <Link to="/terms" target="_blank" className="text-orange-600 hover:underline">Terms & Conditions</Link>{" "}
                    and{" "}
                    <Link to="/privacy" target="_blank" className="text-orange-600 hover:underline">Privacy Policy</Link>.
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground -mt-3 ml-1">
                  Mentorship is provided by independent mentors on the Arena for grads platform.
                </p>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full btn-shine h-11 rounded-full" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign in" : `Create ${role === "campus" ? "campus" : role} account`}
            </Button>

            {mode === "login" && buildOAuthUrl() && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 rounded-full"
                  onClick={() => {
                    const url = buildOAuthUrl();
                    if (url) window.location.href = url;
                  }}
                >
                  Continue with Kimi
                </Button>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Need help?{" "}
            <a href="mailto:hello@arenafograds.com" className="text-orange-600 hover:underline">Contact support</a>
            {" "}·{" "}
            <Link to="/" className="inline-flex items-center gap-1 text-orange-600 hover:underline"><ArrowLeft className="h-3 w-3" /> back home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
