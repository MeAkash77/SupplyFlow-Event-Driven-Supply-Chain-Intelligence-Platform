"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight, Globe2 } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { LogoWordmark } from "@/components/logo-wordmark";

const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

export default function LoginPage() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  );
}

function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") ?? "/globe";

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function reset() { setError(""); setSuccess(""); }

  async function handleGoogle() {
    reset(); setGoogleLoading(true);
    try {
      const r = await signIn.social({ provider: "google", callbackURL: from });
      if (r?.error) { setError("Google sign-in failed. Please try again."); setGoogleLoading(false); }
    } catch { setError("Google sign-in failed. Please try again."); setGoogleLoading(false); }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const r = await signIn.email({ email, password });
      if (r.error) setError(r.error.message ?? "Invalid email or password.");
      else router.push(from);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault(); reset();
    if (signupPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (signupPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const r = await signUp.email({ email: signupEmail, password: signupPassword, name });
      if (r.error) setError(r.error.message ?? "Could not create account.");
      else { setSuccess("Account created! Signing you in…"); setTimeout(() => router.push(from), 1200); }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="relative flex min-h-screen">

      {/* ── Background ──────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 0% 0%, rgba(89,225,217,0.16) 0%, transparent 55%)," +
            "radial-gradient(ellipse 55% 40% at 100% 8%, rgba(255,154,90,0.14) 0%, transparent 50%)," +
            "linear-gradient(180deg, hsl(214,55%,4%) 0%, hsl(216,45%,5%) 100%)",
        }}
      />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 grid-sheen opacity-40" />

      {/* ── Left panel — brand + features ────────────────────────────────── */}
      <div className="relative z-10 hidden flex-col justify-between border-r border-white/8 px-14 py-12 lg:flex lg:w-[48%]">

        {/* Back to home */}
        <Link href="/landing" className="flex items-center group w-fit">
          <LogoWordmark className="h-20 w-[450px]" />
        </Link>

        {/* Hero copy */}
        <div>
          <div className="mb-5 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.36em] text-[hsl(184,73%,61%)]">
            <Globe2 className="h-3 w-3" />
            Multi-tenant supply chain OS
          </div>
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white xl:text-5xl">
            Design. Execute.<br />
            <span className="text-white/30">Own every process.</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/40">
            One place for your team to coordinate orders, suppliers, and deliveries —
            without the spreadsheets, missed emails, or guesswork.
          </p>

          <div className="mt-10 space-y-3.5">
            {[
              "Every organization gets its own private workspace",
              "Draw your approval flows on a visual canvas",
              "Connect your existing ERP in minutes",
              "Know your stock levels before they become a problem",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-[0.82rem] text-white/40">
                <ArrowRight className="h-3 w-3 shrink-0 text-[hsl(184,73%,61%)]/60" />
                {f}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <div className="mb-10 lg:hidden">
          <Link href="/landing" className="flex items-center">
            <LogoWordmark className="h-10 w-[210px]" />
          </Link>
        </div>

        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-[1.4rem] font-semibold tracking-tight text-white">
              {tab === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-white/35">
              {tab === "signin"
                ? "Sign in to your EasyFlow workspace."
                : "Start your EasyFlow workspace today."}
            </p>
          </div>

          {/* Google button */}
          {googleEnabled ? (
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/8 active:scale-[0.99] disabled:opacity-50"
            >
              {googleLoading
                ? <Loader2 className="h-[18px] w-[18px] animate-spin text-white/40" />
                : <GoogleIcon />}
              Continue with Google
            </button>
          ) : (
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-white/45">
              Google sign-in is disabled in this environment. Use email and password for local demo access.
            </div>
          )}

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex-1 border-t border-white/8" />
            <span className="text-[0.72rem] text-white/25">or continue with email</span>
            <div className="flex-1 border-t border-white/8" />
          </div>

          {/* Tab switcher */}
          <div className="mb-5 flex gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            <TabBtn active={tab === "signin"} onClick={() => { setTab("signin"); reset(); }}>Sign in</TabBtn>
            <TabBtn active={tab === "signup"} onClick={() => { setTab("signup"); reset(); }}>Sign up</TabBtn>
          </div>

          {/* ── Sign-in ── */}
          {tab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} placeholder="you@company.com" required />
              <div className="relative">
                <Field label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={setPassword} placeholder="••••••••" required />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword((s) => !s)} />
              </div>
              <Feedback error={error} success={success} />
              <SubmitBtn loading={loading}>{loading ? "Signing in…" : "Sign in"}</SubmitBtn>
            </form>
          )}

          {/* ── Sign-up ── */}
          {tab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <Field label="Full name" type="text" autoComplete="name" value={name} onChange={setName} placeholder="Jane Doe" required />
              <Field label="Work email" type="email" autoComplete="email" value={signupEmail} onChange={setSignupEmail} placeholder="jane@company.com" required />
              <div className="relative">
                <Field label="Password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={signupPassword} onChange={setSignupPassword} placeholder="Min. 8 characters" required />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword((s) => !s)} />
              </div>
              <Field label="Confirm password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" required />
              <Feedback error={error} success={success} />
              <SubmitBtn loading={loading}>{loading ? "Creating account…" : "Create account"}</SubmitBtn>
              <p className="text-center text-[0.72rem] text-white/25">
                By signing up you agree to our{" "}
                <span className="cursor-pointer text-[hsl(184,73%,61%)]/70 hover:text-[hsl(184,73%,61%)]">Terms</span>
                {" & "}
                <span className="cursor-pointer text-[hsl(184,73%,61%)]/70 hover:text-[hsl(184,73%,61%)]">Privacy Policy</span>.
              </p>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-white/25">
            {tab === "signin" ? (
              <>No account?{" "}
                <button type="button" onClick={() => { setTab("signup"); reset(); }} className="text-[hsl(184,73%,61%)] hover:underline underline-offset-2">
                  Sign up free
                </button>
              </>
            ) : (
              <>Have an account?{" "}
                <button type="button" onClick={() => { setTab("signin"); reset(); }} className="text-[hsl(184,73%,61%)] hover:underline underline-offset-2">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl py-2 text-sm font-medium transition-colors",
        active ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, type, autoComplete, value, onChange, placeholder, required }: {
  label: string; type: string; autoComplete?: string;
  value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.72rem] font-medium uppercase tracking-[0.22em] text-white/35">
        {label}
      </label>
      <input
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-[hsl(184,73%,61%)]/50 focus:bg-white/7 focus:ring-2 focus:ring-[hsl(184,73%,61%)]/10"
      />
    </div>
  );
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      className="absolute right-4 top-[38px] text-white/25 hover:text-white/55 transition-colors"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function Feedback({ error, success }: { error: string; success: string }) {
  if (error) return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
  );
  if (success) return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{success}</div>
  );
  return null;
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(184,73%,61%)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2045c0-.638-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2582h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.6151z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1818l-2.9087-2.2582c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5832-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71C3.7841 10.17 3.6818 9.5932 3.6818 9s.1023-1.17.2823-1.71V4.9582H.9574C.3477 6.1732 0 7.5477 0 9c0 1.4523.3477 2.8268.9574 4.0418L3.964 10.71z" fill="#FBBC05"/>
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5813C13.4632.891 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1627 6.656 3.5795 9 3.5795z" fill="#EA4335"/>
    </svg>
  );
}
