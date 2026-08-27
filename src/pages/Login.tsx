import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Loader2, MapPinned, Star, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/site/Logo";
import { dashboardPath } from "@/components/site/Navbar";
import { fireConfetti } from "@/components/site/EasterEggs";

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
  const [role, setRole] = useState<"candidate" | "mentor">(
    params.get("role") === "mentor" ? "mentor" : "candidate",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const onSuccess = async (user: { role: string }, isNew: boolean) => {
    await utils.invalidate();
    if (isNew) fireConfetti(true);
    toast.success(isNew ? "Welcome aboard!" : "Welcome back!");
    navigate(dashboardPath(user.role));
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
      {/* left panel */}
      <div className="relative hidden lg:flex flex-col bg-stone-950 p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-orange-600/30 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />

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
            className="mt-10 relative h-72 w-full max-w-md"
          >
            {/* floating avatar stack */}
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute left-0 top-0 rounded-2xl border border-stone-800 bg-stone-900/70 p-4 backdrop-blur-sm"
            >
              <div className="flex -space-x-3">
                {["https://i.pravatar.cc/150?u=l1", "https://i.pravatar.cc/150?u=l2", "https://i.pravatar.cc/150?u=l3", "https://i.pravatar.cc/150?u=l4"].map((src, i) => (
                  <img key={i} src={src} alt="" className="h-10 w-10 rounded-full border-2 border-stone-950 object-cover" />
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-950 bg-orange-500 text-xs font-bold">
                  +4k
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-stone-300">
                <Users className="h-3.5 w-3.5 text-orange-400" />
                <span>Students cracked IIMs this season</span>
              </div>
            </motion.div>

            {/* review card */}
            <motion.div
              animate={{ y: [8, -8, 8] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
              className="absolute right-0 top-8 max-w-[260px] rounded-2xl border border-stone-800 bg-stone-900/70 p-4 backdrop-blur-sm"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                ))}
              </div>
              <p className="mt-3 text-sm text-stone-300 leading-snug">
                “My PI mentor asked the exact questions that came up in my actual IIM panel. Unreal.”
              </p>
              <div className="mt-3 flex items-center gap-2">
                <img src="https://i.pravatar.cc/150?u=l5" alt="" className="h-8 w-8 rounded-full object-cover" />
                <div className="text-xs">
                  <div className="font-semibold text-white">Ayesha K.</div>
                  <div className="text-stone-500">IIM K '27</div>
                </div>
              </div>
            </motion.div>

            {/* stat card */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute left-6 bottom-6 rounded-2xl border border-stone-800 bg-stone-900/70 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">₹35.3 LPA</div>
                  <div className="text-xs text-stone-400">Average top-10 package</div>
                </div>
              </div>
            </motion.div>

            {/* cta bubble */}
            <motion.div
              animate={{ x: [-6, 6, -6] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute right-4 bottom-0 rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 text-xs text-stone-300"
            >
              <span className="inline-flex items-center gap-1">
                Join the waitlist <ArrowRight className="h-3 w-3 text-orange-400" />
              </span>
            </motion.div>
          </motion.div>
        </div>

        <p className="relative mt-6 text-xs text-stone-600">
          “Embark” — because “panic-scroll Quora at 2am” was taken.
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
                <div className="grid grid-cols-2 gap-2">
                  {(["candidate", "mentor"] as const).map((r) => (
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
                        {r === "candidate" ? <GraduationCap className="h-5 w-5" /> : <MapPinned className="h-5 w-5" />}
                      </div>
                      <div className="mt-2 font-display font-semibold capitalize">{r}</div>
                      <div className="text-xs text-muted-foreground">
                        {r === "candidate" ? "I want to get mentored" : "I want to mentor"}
                      </div>
                    </button>
                  ))}
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
                <div className="flex items-start gap-3 rounded-2xl border p-4">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(v === true)}
                    required
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed font-normal cursor-pointer">
                    I agree to the{" "}
                    <Link to="/terms" target="_blank" className="text-orange-600 hover:underline">Terms & Conditions</Link>,{" "}
                    <Link to="/privacy" target="_blank" className="text-orange-600 hover:underline">Privacy Policy</Link>, and
                    understand that mentorship is provided by independent mentors on the Embark platform.
                  </Label>
                </div>
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
              {mode === "login" ? "Sign in" : `Create ${role} account`}
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
            Demo accounts — superadmin@embark.in · admin@embark.in · candidate@embark.in
            <br />(password: Embark@123) ·{" "}
            <Link to="/" className="text-orange-600 hover:underline">← back home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
