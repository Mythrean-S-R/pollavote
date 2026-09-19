import React, { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";

/* ---------- Icons (24px grid, stroke-based) ---------- */
const ICONS = {
  check: <path d="M20 6 9 17l-5-5" />,
  copy: (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  plus: <path d="M5 12h14M12 5v14" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" />
  ),
  share: <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />,
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      <circle cx="9" cy="7" r="4" />
    </>
  ),
  link: <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
};

export function Icon({ name, size = 20, strokeWidth = 2.25, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {ICONS[name]}
    </svg>
  );
}

/* ---------- Logo: "polla" ink + "vote" lime with outline ---------- */
export function Logo({ size = "md", href, onClick, className = "" }) {
  const inner = (
    <>
      <span className="pv-sr-only">pollavote</span>
      <span aria-hidden="true">
        <span className="pv-logo__polla">polla</span>
        <span className="pv-logo__vote">vote</span>
      </span>
    </>
  );
  const cls = `pv-logo pv-logo--${size} ${className}`.trim();
  return href ? (
    <a className={cls} href={href} onClick={onClick}>
      {inner}
    </a>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

/* ---------- Button ---------- */
export const Button = forwardRef(function Button(
  { variant = "primary", size = "md", block = false, loading = false, icon, as: Tag = "button", className = "", children, disabled, type, iconOnly = false, ...rest },
  ref
) {
  const cls = [
    "pv-btn",
    `pv-btn--${variant}`,
    size !== "md" && `pv-btn--${size}`,
    block && "pv-btn--block",
    iconOnly && "pv-btn--icon",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const btnProps = Tag === "button" ? { type: type || "button", disabled: disabled || loading } : {};
  return (
    <Tag ref={ref} className={cls} aria-busy={loading || undefined} {...btnProps} {...rest}>
      {loading ? <span className="pv-spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={size === "sm" ? 16 : 18} /> : null}
      {children != null && <span>{children}</span>}
    </Tag>
  );
});

/* ---------- Text field (label, hint, error, password toggle) ---------- */
export function Field({ label, name, type = "text", error, hint, inputRef, className = "", ...rest }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  const describedBy = [error && `${id}-err`, hint && !error && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="pv-field">
      <label className="pv-label" htmlFor={id}>
        {label}
      </label>
      <div className="pv-input-wrap">
        <input
          id={id}
          name={name}
          ref={inputRef}
          className={`pv-input ${isPw ? "pv-input--pw" : ""} ${className}`.trim()}
          type={isPw && show ? "text" : type}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {isPw && (
          <button
            type="button"
            className="pv-input-toggle"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            <Icon name={show ? "eyeOff" : "eye"} />
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="pv-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="pv-field__error" role="alert">
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/* ---------- Hooks ---------- */
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Copy text; falls back to execCommand. Resolves true/false. */
export function useCopy(resetMs = 1800) {
  const [copied, setCopied] = useState(false);
  const timer = useRef();
  const copy = useCallback(
    async (text) => {
      let ok = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch (_) {
        /* fall through to legacy path */
      }
      if (!ok) {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand("copy");
          document.body.removeChild(ta);
        } catch (_) {
          ok = false;
        }
      }
      if (ok) {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetMs);
      }
      return ok;
    },
    [resetMs]
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return { copied, copy };
}

/** Eases a displayed integer toward `value` (count-up effect). */
export function useAnimatedNumber(value, duration = 650) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const raf = useRef();
  useEffect(() => {
    if (prefersReducedMotion()) {
      from.current = value;
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(a + (value - a) * eased);
      from.current = v;
      setDisplay(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return display;
}

/** "just now", "12s ago", "3m ago" — re-renders every second. */
export function useTimeAgo(timestamp) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!timestamp) return;
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [timestamp]);
  if (!timestamp) return "";
  const s = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (s < 3) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
}
