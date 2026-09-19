import React, { useState } from "react";
import { Button, Field, Icon, Logo } from "./primitives.jsx";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/* Decorative brand panel (desktop only, hidden from assistive tech) */
function BrandPanel() {
  const rows = [
    { label: "Dark mode", pct: 46, from: "38%", to: "46%", lead: true },
    { label: "Poll templates", pct: 31, from: "31%", to: "27%" },
    { label: "CSV export", pct: 23, from: "23%", to: "20%" },
  ];
  return (
    <section className="pv-auth__panel" aria-hidden="true">
      <h2 className="pv-auth__headline">Ask a question. Watch the answers land.</h2>
      <div className="pv-mock">
        <div className="pv-mock__head">
          <span className="pv-live pv-live--live">
            <span className="pv-live__dot" />
            Live
          </span>
          <span className="pv-mock__count">128 votes</span>
        </div>
        <p className="pv-mock__q">Which feature should we ship next?</p>
        {rows.map((r) => (
          <div className="pv-mock__row" key={r.label}>
            <div className="pv-mock__label">
              <span>{r.label}</span>
              <span className="pv-num">{r.pct}%</span>
            </div>
            <div className="pv-mock__track">
              <div className={`pv-mock__fill ${r.lead ? "pv-mock__fill--lead" : ""}`} style={{ "--from": r.from, "--to": `${r.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuthShell({ children }) {
  return (
    <div className="pv-root pv-auth">
      <BrandPanel />
      <main className="pv-auth__main">
        <div className="pv-auth__card">
          <Logo size="lg" className="pv-auth__logo" />
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * LoginPage — presentational.
 * Props:
 *  onSubmit({ email, password })  called only when client-side checks pass
 *  loading, error                 pass through your existing request state
 *  signupHref / onSignupClick     wire to your existing router
 */
export function LoginPage({ onSubmit, loading = false, error, signupHref = "/signup", onSignupClick }) {
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const next = {};
    if (!email) next.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email)) next.email = "Enter a valid email, like you@example.com.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) {
      form.elements.namedItem(firstInvalid)?.focus();
      return;
    }
    onSubmit?.({ email, password });
  };

  return (
    <AuthShell>
      <h1 className="pv-auth__title">Welcome back</h1>
      <p className="pv-auth__sub">Log in to manage your polls and watch votes come in live.</p>

      {error && (
        <div className="pv-alert" role="alert">
          <Icon name="alert" size={18} />
          <span>{error}</span>
        </div>
      )}

      <form className="pv-form" noValidate onSubmit={handleSubmit}>
        <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" placeholder="Your password" error={errors.password} />
        <Button type="submit" size="lg" block loading={loading}>
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="pv-auth__switch">
        New to pollavote?{" "}
        <a className="pv-link" href={signupHref} onClick={onSignupClick}>
          Create an account
        </a>
      </p>
    </AuthShell>
  );
}

/* ---------- Signup ---------- */
function scorePassword(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.max(1, s);
}
const STRENGTH_LABEL = ["", "Weak", "Okay", "Good", "Strong"];

/**
 * SignupPage — presentational.
 * Props:
 *  onSubmit({ name, email, password })
 *  loading, error
 *  loginHref / onLoginClick
 */
export function SignupPage({ onSubmit, loading = false, error, loginHref = "/login", onLoginClick }) {
  const [errors, setErrors] = useState({});
  const [pw, setPw] = useState("");
  const level = scorePassword(pw);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const next = {};
    if (!name) next.name = "Enter your name.";
    if (!email) next.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email)) next.email = "Enter a valid email, like you@example.com.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) {
      form.elements.namedItem(firstInvalid)?.focus();
      return;
    }
    onSubmit?.({ name, email, password });
  };

  return (
    <AuthShell>
      <h1 className="pv-auth__title">Create your account</h1>
      <p className="pv-auth__sub">Make a poll in under a minute and share it with a single link.</p>

      {error && (
        <div className="pv-alert" role="alert">
          <Icon name="alert" size={18} />
          <span>{error}</span>
        </div>
      )}

      <form className="pv-form" noValidate onSubmit={handleSubmit}>
        <Field label="Name" name="name" autoComplete="name" placeholder="Priya Nair" error={errors.name} />
        <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" error={errors.email} />
        <div className="pv-form" style={{ gap: 10 }}>
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password}
            onChange={(e) => setPw(e.target.value)}
          />
          <div className="pv-strength" data-level={level} aria-live="polite">
            <div className="pv-strength__bars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <p className="pv-strength__label">{pw ? `Password strength: ${STRENGTH_LABEL[level]}` : ""}</p>
          </div>
        </div>
        <Button type="submit" size="lg" block loading={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="pv-auth__switch">
        Already have an account?{" "}
        <a className="pv-link" href={loginHref} onClick={onLoginClick}>
          Log in
        </a>
      </p>
    </AuthShell>
  );
}
