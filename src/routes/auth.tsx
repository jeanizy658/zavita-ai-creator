import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/zavita/Logo";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ZAVITA" },
      { name: "description", content: "Sign in to ZAVITA to save your projects and media." },
      { property: "og:title", content: "Sign in — ZAVITA" },
      { property: "og:description", content: "Sign in to save your ZAVITA projects and media." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const navigate = useNavigate();
  const { user, signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/home" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "in") await signInWithPassword(email, password);
      else {
        const r = await signUpWithPassword(email, password);
        if (r.needsConfirmation) setMsg({ kind: "info", text: "Check your email to confirm your account." });
      }
    } catch (err) {
      setMsg({ kind: "error", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 flex justify-center"><Logo /></div>
      <h1 className="text-center text-xl font-extrabold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-[14px] outline-none focus:border-accent" />
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete={mode === "in" ? "current-password" : "new-password"} className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-[14px] outline-none focus:border-accent" />
        {msg ? <p className={msg.kind === "error" ? "text-[12px] text-destructive" : "text-[12px] text-accent"}>{msg.text}</p> : null}
        <button disabled={busy} className="w-full rounded-xl bg-gradient-brand py-3 text-[12px] font-extrabold uppercase tracking-[0.16em] text-primary-foreground shadow-glow-sm disabled:opacity-50">
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
        </button>
      </form>
      <button
        onClick={() => signInWithGoogle().catch((e: Error) => setMsg({ kind: "error", text: e.message }))}
        className="mt-3 w-full rounded-xl border border-border bg-surface py-3 text-[12px] font-bold uppercase tracking-[0.14em]"
      >
        Continue with Google
      </button>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-5 text-center text-[12px] text-muted-foreground">
        {mode === "in" ? "No account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
