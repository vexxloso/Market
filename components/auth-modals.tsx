"use client";

import { withBasePath } from "@/lib/app-origin";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(withBasePath("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Login failed");
      return;
    }
    onSuccess();
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
      <button
        type="submit"
        disabled={loading}
        className="brand-btn w-full rounded-xl py-2.5 text-sm font-semibold text-white"
      >
        {loading ? "Logging in..." : "Log in"}
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
    onSuccess();
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
