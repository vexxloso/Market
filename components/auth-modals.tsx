"use client";

import { withBasePath } from "@/lib/app-origin";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Modal = "login" | "signup" | null;

type AuthModalContextValue = {
  openLogin: () => void;
  openSignup: () => void;
  close: () => void;
  active: Modal;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-500/35 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 id="auth-modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p className="muted mt-0.5 text-sm">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] px-2.5 py-1 text-sm"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function LoginForm({
  onSwitchToSignup,
  onSuccess,
}: {
  onSwitchToSignup: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotNote, setForgotNote] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setResendNote(null);
    setNeedsEmailConfirm(false);
    setLoading(true);
    const res = await fetch(withBasePath("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string; code?: string };
      setError(data.error ?? "Login failed");
      if (data.code === "EMAIL_NOT_VERIFIED") {
        setNeedsEmailConfirm(true);
      }
      return;
    }
    onSuccess();
  }

  async function resendConfirmation() {
    setResendNote(null);
    if (!email.trim()) {
      setResendNote("Enter your email above first.");
      return;
    }
    setResendBusy(true);
    const res = await fetch(withBasePath("/api/auth/resend-verification-public"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    setResendBusy(false);
    const data = (await res.json()) as { error?: string; message?: string };
    if (!res.ok) {
      setResendNote(data.error ?? "Could not send email.");
      return;
    }
    setResendNote(
      data.message ??
        "If this account is still unconfirmed, we sent a new link and 6-digit code.",
    );
  }

  async function sendResetLink() {
    setForgotNote(null);
    setError("");
    if (!email.trim()) {
      setForgotNote("Enter your email above first.");
      return;
    }
    setForgotBusy(true);
    const res = await fetch(withBasePath("/api/auth/forgot-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    setForgotBusy(false);
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    if (!res.ok) {
      setForgotNote(
        typeof data.error === "string" ? data.error : "Could not send reset link.",
      );
      return;
    }
    setForgotNote(
      data.message ?? "If an account exists for this email, we sent a reset link.",
    );
  }

  if (step === "forgot") {
    return (
      <div className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={forgotBusy}
          onClick={() => void sendResetLink()}
          className="brand-btn w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {forgotBusy ? "Sending…" : "Send reset link"}
        </button>
        {forgotNote && (
          <p className="text-sm text-neutral-700" role="status">
            {forgotNote}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setStep("login");
            setForgotNote(null);
          }}
          className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
        >
          Back to log in
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
      />
      <input
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {needsEmailConfirm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="font-medium text-neutral-900">Email not confirmed yet</p>
          <p className="mt-1 text-neutral-700">
            Open the confirmation link or enter the 6-digit code from the email, then try logging in
            again.
          </p>
          {email.trim() ? (
            <p className="mt-2">
              <Link
                href={withBasePath(
                  `/confirm-email?email=${encodeURIComponent(email.trim())}`,
                )}
                className="text-sm font-semibold text-[var(--brand)] underline underline-offset-2"
              >
                Enter code on the Confirm email page
              </Link>
            </p>
          ) : null}
          <button
            type="button"
            disabled={resendBusy}
            onClick={() => void resendConfirmation()}
            className="mt-2 text-sm font-semibold text-[var(--brand)] underline underline-offset-2 disabled:opacity-50"
          >
            {resendBusy ? "Sending…" : "Resend confirmation email"}
          </button>
          {resendNote && (
            <p className="mt-2 text-xs text-neutral-700" role="status">
              {resendNote}
            </p>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="brand-btn w-full rounded-xl py-2.5 text-sm font-semibold text-white"
      >
        {loading ? "Logging in..." : "Log in"}
      </button>
      <button
        type="button"
        onClick={() => {
          setStep("forgot");
          setForgotNote(null);
          setError("");
        }}
        className="w-full text-center text-sm font-semibold text-[var(--brand)] underline underline-offset-2"
      >
        Forgot password?
      </button>
      <p className="text-center text-sm text-neutral-600">
        New to Noire Haven?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold text-[var(--brand)] underline underline-offset-2"
        >
          Create an account
        </button>
      </p>
    </form>
  );
}

const PASSWORD_MIN = 8;

function ConfirmEmailInline({
  email,
  onChangeEmail,
  onConfirmed,
}: {
  email: string;
  onChangeEmail: () => void;
  onConfirmed: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);

  async function confirm() {
    setError("");
    setResendNote(null);
    setLoading(true);
    const res = await fetch(withBasePath("/api/auth/confirm-email-code"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), code }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Could not confirm.");
      return;
    }
    onConfirmed();
  }

  async function resend() {
    setResendNote(null);
    setError("");
    if (!email.trim()) {
      setResendNote("Enter your email above first.");
      return;
    }
    setResendBusy(true);
    const res = await fetch(withBasePath("/api/auth/resend-verification-public"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    setResendBusy(false);
    const data = (await res.json()) as { error?: string; message?: string };
    if (!res.ok) {
      setResendNote(data.error ?? "Could not resend.");
      return;
    }
    setResendNote(
      data.message ??
        "If this account is still unconfirmed, we sent a new link and 6-digit code.",
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--border)] bg-neutral-50 px-3 py-2 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Email
        </p>
        <p className="mt-0.5 truncate font-medium text-neutral-900">{email.trim()}</p>
        <button
          type="button"
          onClick={onChangeEmail}
          className="mt-2 text-sm font-semibold text-[var(--brand)] underline underline-offset-2"
        >
          Change email
        </button>
      </div>
      <input
        type="text"
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={12}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="6-digit code"
        className="w-full rounded-xl border border-[var(--border)] px-3 py-2 font-mono text-lg tracking-widest"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={loading || code.length !== 6}
        onClick={() => void confirm()}
        className="brand-btn w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Confirming..." : "Confirm and continue"}
      </button>
      <button
        type="button"
        disabled={resendBusy}
        onClick={() => void resend()}
        className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
      >
        {resendBusy ? "Sending…" : "Resend code"}
      </button>
      {resendNote && (
        <p className="text-xs text-neutral-600" role="status">
          {resendNote}
        </p>
      )}
    </div>
  );
}

function SignupForm({
  onSwitchToLogin,
  onSuccess,
}: {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [done, setDone] = useState<{
    verificationSent: boolean;
    skipped: boolean;
    resumedUnverifiedSignup: boolean;
  } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters.`);
      return;
    }
    setLoading(true);
    const res = await fetch(withBasePath("/api/auth/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Signup failed");
      return;
    }
    const data = (await res.json()) as {
      verificationEmailSent?: boolean;
      verificationEmailSkipped?: boolean;
      resumedUnverifiedSignup?: boolean;
    };
    setDone({
      verificationSent: Boolean(data.verificationEmailSent),
      skipped: Boolean(data.verificationEmailSkipped),
      resumedUnverifiedSignup: Boolean(data.resumedUnverifiedSignup),
    });
    setStep("confirm");
  }

  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <ConfirmEmailInline
          email={email}
          onChangeEmail={() => {
            setStep("form");
          }}
          onConfirmed={onSuccess}
        />
        <button
          type="button"
          onClick={() => {
            setStep("form");
          }}
          className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
      />
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
      />
      <input
        type="password"
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={`Password (min. ${PASSWORD_MIN} characters)`}
        minLength={PASSWORD_MIN}
        className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="brand-btn w-full rounded-xl py-2.5 text-sm font-semibold text-white"
      >
        {loading ? "Creating account..." : "Agree and continue"}
      </button>
      <p className="text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-[var(--brand)] underline underline-offset-2"
        >
          Log in
        </button>
      </p>
    </form>
  );
}

function AuthModalLayers() {
  const router = useRouter();
  const ctx = useAuthModal();

  useEffect(() => {
    if (!ctx.active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") ctx.close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ctx.active, ctx.close]);

  function onSuccess() {
    ctx.close();
    router.refresh();
  }

  if (ctx.active === "login") {
    return (
      <ModalShell
        title="Log in"
        subtitle="Welcome back to Noire Haven."
        onClose={ctx.close}
      >
        <LoginForm onSwitchToSignup={() => ctx.openSignup()} onSuccess={onSuccess} />
      </ModalShell>
    );
  }

  if (ctx.active === "signup") {
    return (
      <ModalShell
        title="Sign up"
        subtitle="Create an account to book and host."
        onClose={ctx.close}
      >
        <SignupForm onSwitchToLogin={() => ctx.openLogin()} onSuccess={onSuccess} />
      </ModalShell>
    );
  }

  return null;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Modal>(null);

  const openLogin = useCallback(() => setActive("login"), []);
  const openSignup = useCallback(() => setActive("signup"), []);
  const close = useCallback(() => setActive(null), []);

  const value: AuthModalContextValue = {
    openLogin,
    openSignup,
    close,
    active,
  };

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModalLayers />
    </AuthModalContext.Provider>
  );
}

export function AuthModalSearchParamsSync() {
  const searchParams = useSearchParams();
  const { openLogin, openSignup } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "login") {
      openLogin();
    } else if (auth === "signup") {
      openSignup();
    }
    if (auth === "login" || auth === "signup") {
      router.replace("/", { scroll: false });
    }
  }, [searchParams, openLogin, openSignup, router]);

  return null;
}
