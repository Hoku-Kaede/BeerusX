"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBazaarStore } from "@/lib/bazaar-store";

export function BazaarAccountMenu() {
  const user = useBazaarStore((state) => state.user);
  const setUser = useBazaarStore((state) => state.setUser);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = ref.current;
    if (panel) {
      const focusable = panel.querySelector<HTMLElement>('button, input, [href], [tabindex]:not([tabindex="-1"])');
      (focusable ?? panel).focus();
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError("Tell us your name (2+ characters).");
      return;
    }
    setError("");
    setUser({ name: name.trim() || trimmedEmail.split("@")[0], email: trimmedEmail, signedIn: true });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="bazaar-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+10px)] z-60 w-72 rounded-2xl border p-4 shadow-pop"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-line)" }}
          >
            {user ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  Hi, {user.name.split(" ")[0]}
                </p>
                <p className="text-xs text-muted">{user.email}</p>
                <button
                  type="button"
                  className="bazaar-btn-ghost w-full"
                  onClick={() => {
                    setUser(null);
                    setOpen(false);
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3" id="bazaar-auth-form">
                <div className="flex gap-1 rounded-full border p-1" style={{ backgroundColor: "var(--color-surface-2)" }}>
                  {(["signin", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${mode === m ? "bg-foreground text-background" : "text-muted"}`}
                      onClick={() => {
                        setMode(m);
                        setError("");
                      }}
                    >
                      {m === "signin" ? "Sign in" : "Create account"}
                    </button>
                  ))}
                </div>
                {mode === "signup" && (
                  <input
                    className="field"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                )}
                <input
                  className="field"
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                {error && <p className="text-xs text-accent-deep">{error}</p>}
                <button type="submit" className="bazaar-btn-primary w-full">
                  {mode === "signin" ? "Sign in" : "Create account"}
                </button>
                <p className="text-center text-[11px] text-muted">Demo auth — stored only in this browser.</p>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
